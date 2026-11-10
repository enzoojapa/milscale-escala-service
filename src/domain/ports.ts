import { Escala } from './Escala';
import { Troca } from './Troca';

export interface EscalaRepository {
  salvar(escala: Escala): Promise<Escala>;
  atualizar(escala: Escala): Promise<Escala>;
  buscarPorId(id: number): Promise<Escala | null>;
  buscarPorMilitarEData(militarId: string, data: string): Promise<Escala | null>;
  listar(filtro?: { data?: string; status?: string }): Promise<Escala[]>;
  remover(id: number): Promise<boolean>;
}

export interface TrocaRepository {
  salvar(troca: Troca): Promise<Troca>;
  atualizar(troca: Troca): Promise<Troca>;
  buscarPorId(id: number): Promise<Troca | null>;
  listar(filtro?: { status?: string }): Promise<Troca[]>;
}

export interface EventoDominio {
  tipo: 'EscalaPublicada' | 'TrocaAprovada';
  versao: number;
  ocorridoEm: string;
  dados: Record<string, unknown>;
}

export interface EventPublisher {
  publicar(evento: EventoDominio): Promise<void>;
}

export interface EventoRegistrado extends EventoDominio {
  id: number;
}

export interface EventLog {
  registrar(evento: EventoDominio): Promise<void>;
  listar(limite: number): Promise<EventoRegistrado[]>;
}

export interface Clock {
  agora(): Date;
}
