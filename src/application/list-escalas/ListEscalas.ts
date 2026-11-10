import { EscalaRepository } from '../../domain/ports';
import { escalaDto } from '../dtos';

export class ListEscalas {
  constructor(private readonly repo: EscalaRepository) {}

  async execute(filtro: { data?: string; status?: string } = {}) {
    const escalas = await this.repo.listar(filtro);
    return { total: escalas.length, escalas: escalas.map(escalaDto) };
  }
}
