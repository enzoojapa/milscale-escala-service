import { LoggingEventPublisher, SystemClock } from '../infrastructure/messaging/publishers';
import { ServiceBusEventPublisher } from '../infrastructure/messaging/ServiceBusEventPublisher';
import { conectarSql } from '../infrastructure/persistence/sqlDatabase';
import { SqlEscalaRepository, SqlEventLog, SqlTrocaRepository } from '../infrastructure/persistence/SqlRepositories';
import { buildApp } from './app';

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 3002);
  const conn = process.env.SQL_CONNECTION_STRING;
  if (!conn) throw new Error('Variavel SQL_CONNECTION_STRING nao configurada');

  const pool = await conectarSql(conn);
  const eventLog = new SqlEventLog(pool);

  const sbConn = process.env.SERVICEBUS_CONNECTION_STRING;
  const fila = process.env.SERVICEBUS_QUEUE ?? 'escala-eventos';
  const bus = sbConn ? new ServiceBusEventPublisher(sbConn, fila) : undefined;
  if (!bus) console.warn('SERVICEBUS_CONNECTION_STRING ausente: eventos ficam apenas no log do banco');

  const app = buildApp({
    escalas: new SqlEscalaRepository(pool),
    trocas: new SqlTrocaRepository(pool),
    publisher: new LoggingEventPublisher(eventLog, bus),
    eventLog,
    clock: new SystemClock(),
  });

  app.listen(port, () => console.log(`milscale-escala-service rodando na porta ${port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
