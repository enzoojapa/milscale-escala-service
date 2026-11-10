import { DomainError } from './DomainError';
import { Escala } from './Escala';

export type StatusTroca = 'PENDENTE' | 'APROVADA' | 'RECUSADA';

/** Regra de negocio: troca so pode ser pedida com no minimo 24h antes do inicio do servico. */
export const ANTECEDENCIA_MINIMA_HORAS = 24;

export interface TrocaProps {
  id?: number;
  escalaId: number;
  militarOriginalId: string;
  militarSubstitutoId: string;
  militarSubstitutoNome: string;
  motivo: string;
  status?: StatusTroca;
  solicitadaEm?: Date;
}

export class Troca {
  readonly id?: number;
  readonly escalaId: number;
  readonly militarOriginalId: string;
  readonly militarSubstitutoId: string;
  readonly militarSubstitutoNome: string;
  readonly motivo: string;
  status: StatusTroca;
  readonly solicitadaEm: Date;

  private constructor(props: TrocaProps) {
    this.id = props.id;
    this.escalaId = props.escalaId;
    this.militarOriginalId = props.militarOriginalId;
    this.militarSubstitutoId = props.militarSubstitutoId;
    this.militarSubstitutoNome = props.militarSubstitutoNome;
    this.motivo = props.motivo;
    this.status = props.status ?? 'PENDENTE';
    this.solicitadaEm = props.solicitadaEm ?? new Date();
  }

  static solicitar(
    escala: Escala,
    dados: { militarSubstitutoId: string; militarSubstitutoNome: string; motivo: string },
    agora: Date,
  ): Troca {
    if (!escala.estaPublicada()) {
      throw new DomainError('So e possivel pedir troca de escala publicada');
    }
    if (!dados.militarSubstitutoId || !dados.militarSubstitutoNome) {
      throw new DomainError('Informe o militar substituto');
    }
    if (dados.militarSubstitutoId === escala.militarId) {
      throw new DomainError('O substituto precisa ser outro militar');
    }
    if (!dados.motivo || dados.motivo.trim().length < 3) {
      throw new DomainError('Informe o motivo da troca');
    }
    const horasAteInicio = (escala.inicio().getTime() - agora.getTime()) / 3600000;
    if (horasAteInicio < ANTECEDENCIA_MINIMA_HORAS) {
      throw new DomainError(
        `Troca recusada: precisa de ${ANTECEDENCIA_MINIMA_HORAS}h de antecedencia e faltam ${Math.max(0, horasAteInicio).toFixed(1)}h para o servico`,
      );
    }
    return new Troca({
      escalaId: escala.id as number,
      militarOriginalId: escala.militarId,
      ...dados,
      status: 'PENDENTE',
      solicitadaEm: agora,
    });
  }

  static restaurar(props: TrocaProps): Troca {
    return new Troca(props);
  }

  aprovar(): void {
    if (this.status !== 'PENDENTE') throw new DomainError('Troca ja foi analisada');
    this.status = 'APROVADA';
  }
}
