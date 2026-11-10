import { Clock, EscalaRepository, EventPublisher } from '../../domain/ports';
import { escalaDto } from '../dtos';
import { NotFoundError } from '../errors';

export class PublishEscala {
  constructor(
    private readonly repo: EscalaRepository,
    private readonly publisher: EventPublisher,
    private readonly clock: Clock,
  ) {}

  async execute(id: number) {
    const escala = await this.repo.buscarPorId(id);
    if (!escala) throw new NotFoundError('Escala nao encontrada');

    escala.publicar(this.clock.agora());
    await this.repo.atualizar(escala);

    await this.publisher.publicar({
      tipo: 'EscalaPublicada',
      versao: 1,
      ocorridoEm: this.clock.agora().toISOString(),
      dados: {
        escalaId: escala.id,
        data: escala.data,
        posto: escala.posto,
        militarId: escala.militarId,
        militarNome: escala.militarNome,
        inicio: escala.inicio().toISOString(),
      },
    });
    return escalaDto(escala);
  }
}
