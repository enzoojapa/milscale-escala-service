import { Escala } from '../../domain/Escala';
import { EscalaRepository, EventLog, EventoDominio, EventoRegistrado, TrocaRepository } from '../../domain/ports';
import { Troca } from '../../domain/Troca';

export class InMemoryEscalaRepository implements EscalaRepository {
  private seq = 0;
  private readonly itens = new Map<number, Escala>();

  async salvar(e: Escala): Promise<Escala> {
    const salvo = Escala.restaurar({ ...e, id: ++this.seq });
    this.itens.set(salvo.id as number, salvo);
    return salvo;
  }
  async atualizar(e: Escala): Promise<Escala> {
    this.itens.set(e.id as number, e);
    return e;
  }
  async buscarPorId(id: number): Promise<Escala | null> {
    return this.itens.get(id) ?? null;
  }
  async buscarPorMilitarEData(militarId: string, data: string): Promise<Escala | null> {
    return [...this.itens.values()].find((e) => e.militarId === militarId && e.data === data) ?? null;
  }
  async listar(filtro: { data?: string; status?: string } = {}): Promise<Escala[]> {
    return [...this.itens.values()].filter(
      (e) => (!filtro.data || e.data === filtro.data) && (!filtro.status || e.status === filtro.status),
    );
  }
  async remover(id: number): Promise<boolean> {
    return this.itens.delete(id);
  }
}

export class InMemoryTrocaRepository implements TrocaRepository {
  private seq = 0;
  private readonly itens = new Map<number, Troca>();

  async salvar(t: Troca): Promise<Troca> {
    const salvo = Troca.restaurar({ ...t, id: ++this.seq });
    this.itens.set(salvo.id as number, salvo);
    return salvo;
  }
  async atualizar(t: Troca): Promise<Troca> {
    this.itens.set(t.id as number, t);
    return t;
  }
  async buscarPorId(id: number): Promise<Troca | null> {
    return this.itens.get(id) ?? null;
  }
  async listar(filtro: { status?: string } = {}): Promise<Troca[]> {
    return [...this.itens.values()].filter((t) => !filtro.status || t.status === filtro.status);
  }
}

export class InMemoryEventLog implements EventLog {
  readonly eventos: EventoRegistrado[] = [];

  async registrar(e: EventoDominio): Promise<void> {
    this.eventos.unshift({ ...e, id: this.eventos.length + 1 });
  }
  async listar(limite: number): Promise<EventoRegistrado[]> {
    return this.eventos.slice(0, limite);
  }
}
