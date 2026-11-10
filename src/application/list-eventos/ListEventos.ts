import { EventLog } from '../../domain/ports';

export class ListEventos {
  constructor(private readonly log: EventLog) {}

  async execute(limite = 20) {
    const eventos = await this.log.listar(limite);
    return { total: eventos.length, eventos };
  }
}
