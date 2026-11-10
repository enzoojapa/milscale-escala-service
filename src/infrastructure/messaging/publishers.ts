import { Clock, EventLog, EventoDominio, EventPublisher } from '../../domain/ports';

/** Grava o evento no log (tabela eventos) e repassa para o publisher seguinte. */
export class LoggingEventPublisher implements EventPublisher {
  constructor(
    private readonly log: EventLog,
    private readonly proximo?: EventPublisher,
  ) {}

  async publicar(evento: EventoDominio): Promise<void> {
    await this.log.registrar(evento);
    if (this.proximo) await this.proximo.publicar(evento);
    console.log(`[evento] ${evento.tipo} ${JSON.stringify(evento.dados)}`);
  }
}

export class SystemClock implements Clock {
  agora(): Date {
    return new Date();
  }
}
