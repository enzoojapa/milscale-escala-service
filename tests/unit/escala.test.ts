import request from 'supertest';
import { buildApp } from '../../src/api/app';
import { DomainError } from '../../src/domain/DomainError';
import { Escala } from '../../src/domain/Escala';
import { Clock } from '../../src/domain/ports';
import { Troca } from '../../src/domain/Troca';
import { LoggingEventPublisher } from '../../src/infrastructure/messaging/publishers';
import {
  InMemoryEscalaRepository,
  InMemoryEventLog,
  InMemoryTrocaRepository,
} from '../../src/infrastructure/persistence/InMemoryRepositories';

const relogio = (iso: string): Clock => ({ agora: () => new Date(iso) });

function escalaPublicada(data: string): Escala {
  const e = Escala.restaurar({ id: 1, data, militarId: 'm1', militarNome: 'SD SILVA', posto: 'SENTINELA' });
  e.publicar(new Date());
  return e;
}

describe('Escala (dominio)', () => {
  it('servico vai das 08h as 08h do dia seguinte (UTC-3)', () => {
    const e = Escala.criar({ data: '2026-11-20', militarId: 'm1', militarNome: 'SD SILVA', posto: 'SENTINELA' });
    expect(e.inicio().toISOString()).toBe('2026-11-20T11:00:00.000Z');
    expect(e.fim().toISOString()).toBe('2026-11-21T11:00:00.000Z');
  });

  it('nao permite editar escala publicada', () => {
    const e = escalaPublicada('2026-11-20');
    expect(() => e.alterar({ posto: 'CABO_DA_GUARDA' })).toThrow(DomainError);
  });

  it('rejeita posto invalido', () => {
    expect(() => Escala.criar({ data: '2026-11-20', militarId: 'm1', militarNome: 'X', posto: 'COZINHA' as never })).toThrow(DomainError);
  });
});

describe('Regra das 24h para troca', () => {
  const dados = { militarSubstitutoId: 'm2', militarSubstitutoNome: 'SD SOUZA', motivo: 'Consulta medica' };

  it('aceita com mais de 24h de antecedencia', () => {
    const troca = Troca.solicitar(escalaPublicada('2026-11-20'), dados, new Date('2026-11-18T12:00:00Z'));
    expect(troca.status).toBe('PENDENTE');
  });

  it('recusa com menos de 24h de antecedencia', () => {
    expect(() => Troca.solicitar(escalaPublicada('2026-11-20'), dados, new Date('2026-11-19T20:00:00Z'))).toThrow(/24h/);
  });

  it('recusa troca de escala em rascunho', () => {
    const rascunho = Escala.restaurar({ id: 1, data: '2026-11-20', militarId: 'm1', militarNome: 'SD SILVA', posto: 'SENTINELA' });
    expect(() => Troca.solicitar(rascunho, dados, new Date('2026-11-10T12:00:00Z'))).toThrow(DomainError);
  });
});

describe('API', () => {
  function montar(agora: string) {
    const eventLog = new InMemoryEventLog();
    const app = buildApp({
      escalas: new InMemoryEscalaRepository(),
      trocas: new InMemoryTrocaRepository(),
      publisher: new LoggingEventPublisher(eventLog),
      eventLog,
      clock: relogio(agora),
    });
    return { app, eventLog };
  }
  const nova = { data: '2026-11-20', militarId: 'm1', militarNome: 'SD SILVA', posto: 'SENTINELA' };

  it('CRUD completo de escala em rascunho', async () => {
    const { app } = montar('2026-11-10T12:00:00Z');
    const { body } = await request(app).post('/escalas').send(nova).expect(201);
    await request(app).get(`/escalas/${body.id}`).expect(200);
    await request(app).put(`/escalas/${body.id}`).send({ posto: 'CABO_DA_GUARDA' }).expect(200);
    await request(app).delete(`/escalas/${body.id}`).expect(204);
    await request(app).get(`/escalas/${body.id}`).expect(404);
  });

  it('nao escala o mesmo militar duas vezes no mesmo dia', async () => {
    const { app } = montar('2026-11-10T12:00:00Z');
    await request(app).post('/escalas').send(nova).expect(201);
    await request(app).post('/escalas').send({ ...nova, posto: 'CABO_DA_GUARDA' }).expect(409);
  });

  it('publicar emite EscalaPublicada e aprovar troca emite TrocaAprovada', async () => {
    const { app, eventLog } = montar('2026-11-10T12:00:00Z');
    const { body } = await request(app).post('/escalas').send(nova).expect(201);
    await request(app).post(`/escalas/${body.id}/publicar`).expect(200);
    const troca = await request(app)
      .post('/trocas')
      .send({ escalaId: body.id, militarSubstitutoId: 'm2', militarSubstitutoNome: 'SD SOUZA', motivo: 'Consulta' })
      .expect(201);
    const aprovada = await request(app).post(`/trocas/${troca.body.id}/aprovar`).expect(200);
    expect(aprovada.body.escala.militarNome).toBe('SD SOUZA');
    expect(eventLog.eventos.map((e) => e.tipo)).toEqual(['TrocaAprovada', 'EscalaPublicada']);
  });

  it('troca com menos de 24h retorna 422', async () => {
    const { app } = montar('2026-11-20T08:00:00Z');
    const { body } = await request(app).post('/escalas').send(nova).expect(201);
    await request(app).post(`/escalas/${body.id}/publicar`).expect(200);
    const r = await request(app)
      .post('/trocas')
      .send({ escalaId: body.id, militarSubstitutoId: 'm2', militarSubstitutoNome: 'SD SOUZA', motivo: 'Consulta' })
      .expect(422);
    expect(r.body.erro).toMatch(/24h/);
  });
});
