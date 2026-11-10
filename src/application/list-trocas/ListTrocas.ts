import { TrocaRepository } from '../../domain/ports';
import { trocaDto } from '../dtos';

export class ListTrocas {
  constructor(private readonly repo: TrocaRepository) {}

  async execute(filtro: { status?: string } = {}) {
    const trocas = await this.repo.listar(filtro);
    return { total: trocas.length, trocas: trocas.map(trocaDto) };
  }
}
