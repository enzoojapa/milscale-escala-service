import { Clock, EscalaRepository, TrocaRepository } from '../../domain/ports';
import { Troca } from '../../domain/Troca';
import { trocaDto } from '../dtos';
import { NotFoundError } from '../errors';

export interface RequestTrocaCommand {
  escalaId: number;
  militarSubstitutoId: string;
  militarSubstitutoNome: string;
  motivo: string;
}

export class RequestTroca {
  constructor(
    private readonly escalas: EscalaRepository,
    private readonly trocas: TrocaRepository,
    private readonly clock: Clock,
  ) {}

  async execute(cmd: RequestTrocaCommand) {
    const escala = await this.escalas.buscarPorId(Number(cmd.escalaId));
    if (!escala) throw new NotFoundError('Escala nao encontrada');
    const troca = Troca.solicitar(escala, cmd, this.clock.agora());
    return trocaDto(await this.trocas.salvar(troca));
  }
}
