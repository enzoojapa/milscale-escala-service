import { EscalaRepository } from '../../domain/ports';
import { escalaDto } from '../dtos';
import { NotFoundError } from '../errors';

export class GetEscala {
  constructor(private readonly repo: EscalaRepository) {}

  async execute(id: number) {
    const escala = await this.repo.buscarPorId(id);
    if (!escala) throw new NotFoundError('Escala nao encontrada');
    return escalaDto(escala);
  }
}
