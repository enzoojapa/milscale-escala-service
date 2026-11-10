import { DomainError } from './DomainError';

export const POSTOS = ['SENTINELA', 'CABO_DA_GUARDA', 'SARGENTO_DE_DIA', 'OFICIAL_DE_DIA'] as const;
export type Posto = (typeof POSTOS)[number];
export type StatusEscala = 'RASCUNHO' | 'PUBLICADA';

/** O servico comeca as 08h00 (horario de Brasilia, UTC-3) e dura 24 horas. */
export const HORA_INICIO_SERVICO_UTC = 11;
export const DURACAO_SERVICO_HORAS = 24;

export interface EscalaProps {
  id?: number;
  data: string; // YYYY-MM-DD
  militarId: string;
  militarNome: string;
  posto: Posto;
  status?: StatusEscala;
  publicadaEm?: Date | null;
}

export class Escala {
  readonly id?: number;
  readonly data: string;
  militarId: string;
  militarNome: string;
  posto: Posto;
  status: StatusEscala;
  publicadaEm: Date | null;

  private constructor(props: EscalaProps) {
    this.id = props.id;
    this.data = props.data;
    this.militarId = props.militarId;
    this.militarNome = props.militarNome;
    this.posto = props.posto;
    this.status = props.status ?? 'RASCUNHO';
    this.publicadaEm = props.publicadaEm ?? null;
  }

  static criar(props: EscalaProps): Escala {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(props.data) || Number.isNaN(Date.parse(props.data))) {
      throw new DomainError('Data invalida. Use o formato AAAA-MM-DD');
    }
    if (!props.militarId) throw new DomainError('militarId e obrigatorio');
    if (!props.militarNome) throw new DomainError('militarNome e obrigatorio');
    if (!POSTOS.includes(props.posto)) {
      throw new DomainError(`Posto invalido. Use: ${POSTOS.join(', ')}`);
    }
    return new Escala({ ...props, status: 'RASCUNHO', publicadaEm: null });
  }

  static restaurar(props: EscalaProps): Escala {
    return new Escala(props);
  }

  inicio(): Date {
    const d = new Date(`${this.data}T00:00:00Z`);
    d.setUTCHours(HORA_INICIO_SERVICO_UTC);
    return d;
  }

  fim(): Date {
    return new Date(this.inicio().getTime() + DURACAO_SERVICO_HORAS * 3600 * 1000);
  }

  estaPublicada(): boolean {
    return this.status === 'PUBLICADA';
  }

  alterar(dados: { militarId?: string; militarNome?: string; posto?: Posto }): void {
    if (this.estaPublicada()) {
      throw new DomainError('Escala publicada nao pode ser editada. Use uma solicitacao de troca');
    }
    if (dados.posto && !POSTOS.includes(dados.posto)) {
      throw new DomainError(`Posto invalido. Use: ${POSTOS.join(', ')}`);
    }
    this.militarId = dados.militarId ?? this.militarId;
    this.militarNome = dados.militarNome ?? this.militarNome;
    this.posto = dados.posto ?? this.posto;
  }

  podeSerRemovida(): void {
    if (this.estaPublicada()) {
      throw new DomainError('Escala publicada nao pode ser removida');
    }
  }

  publicar(agora: Date): void {
    if (this.estaPublicada()) throw new DomainError('Escala ja esta publicada');
    this.status = 'PUBLICADA';
    this.publicadaEm = agora;
  }

  substituirMilitar(militarId: string, militarNome: string): void {
    this.militarId = militarId;
    this.militarNome = militarNome;
  }
}
