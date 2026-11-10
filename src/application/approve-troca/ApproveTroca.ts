import { Clock, EscalaRepository, EventPublisher, TrocaRepository } from '../../domain/ports';
import { escalaDto, trocaDto } from '../dtos';
import { ConflictError, NotFoundError } from '../errors';

export class ApproveTroca {
  constructor(
    private readonly escalas: EscalaRepository,
    private readonly trocas: TrocaRepository,
    private readonly publisher: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(id: number) {
    const troca = await this.trocas.buscarPorId(id);
    if (!troca) throw new NotFoundError('Troca nao encontrada');
    const escala = await this.escalas.buscarPorId(troca.escalaId);
    if (!escala) throw new NotFoundError('Escala da troca nao encontrada');

    const ocupado = await this.escalas.buscarPorMilitarEData(troca.militarSubstitutoId, escala.data);
    if (ocupado) {
      throw new ConflictError(`${troca.militarSubstitutoNome} ja esta escalado em ${escala.data}`);
    }

    troca.aprovar();
    escala.substituirMilitar(troca.militarSubstitutoId, troca.militarSubstitutoNome);
    await this.trocas.atualizar(troca);
    await this.escalas.atualizar(escala);

    await this.publisher.publicar({
      tipo: 'TrocaAprovada',
      versao: 1,
      ocorridoEm: this.clock.agora().toISOString(),
      dados: {
        trocaId: troca.id,
        escalaId: escala.id,
        data: escala.data,
        militarSaiId: troca.militarOriginalId,
        militarEntraId: troca.militarSubstitutoId,
        militarEntraNome: troca.militarSubstitutoNome,
      },
    });
    return { troca: trocaDto(troca), escala: escalaDto(escala) };
  }
}
