import { Posto } from '../../domain/Escala';
import { EscalaRepository } from '../../domain/ports';
import { escalaDto } from '../dtos';
import { ConflictError, NotFoundError } from '../errors';

export class UpdateEscala {
  constructor(private readonly repo: EscalaRepository) {}

  async execute(id: number, dados: { militarId?: string; militarNome?: string; posto?: Posto }) {
    const escala = await this.repo.buscarPorId(id);
    if (!escala) throw new NotFoundError('Escala nao encontrada');
    escala.alterar(dados);
    const conflito = await this.repo.buscarPorMilitarEData(escala.militarId, escala.data);
    if (conflito && conflito.id !== escala.id) {
      throw new ConflictError(`${escala.militarNome} ja esta escalado em ${escala.data}`);
    }
    return escalaDto(await this.repo.atualizar(escala));
  }
}
