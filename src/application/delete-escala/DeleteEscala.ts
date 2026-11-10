import { EscalaRepository } from '../../domain/ports';
import { NotFoundError } from '../errors';

export class DeleteEscala {
  constructor(private readonly repo: EscalaRepository) {}

  async execute(id: number): Promise<void> {
    const escala = await this.repo.buscarPorId(id);
    if (!escala) throw new NotFoundError('Escala nao encontrada');
    escala.podeSerRemovida();
    await this.repo.remover(id);
  }
}
