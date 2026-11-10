import { Escala, Posto } from '../../domain/Escala';
import { EscalaRepository } from '../../domain/ports';
import { escalaDto } from '../dtos';
import { ConflictError } from '../errors';

export interface CreateEscalaCommand {
  data: string;
  militarId: string;
  militarNome: string;
  posto: Posto;
}

export class CreateEscala {
  constructor(private readonly repo: EscalaRepository) {}

  async execute(cmd: CreateEscalaCommand) {
    const escala = Escala.criar(cmd);
    const conflito = await this.repo.buscarPorMilitarEData(escala.militarId, escala.data);
    if (conflito) {
      throw new ConflictError(`${escala.militarNome} ja esta escalado em ${escala.data}`);
    }
    return escalaDto(await this.repo.salvar(escala));
  }
}
