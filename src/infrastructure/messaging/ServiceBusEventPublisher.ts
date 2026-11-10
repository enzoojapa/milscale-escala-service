import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { EventoDominio, EventPublisher } from '../../domain/ports';

/** Envia o evento para a fila do Azure Service Bus (consumida pela Azure Function). */
export class ServiceBusEventPublisher implements EventPublisher {
  private readonly sender: ServiceBusSender;

  constructor(connectionString: string, queue: string) {
    this.sender = new ServiceBusClient(connectionString).createSender(queue);
  }

  async publicar(evento: EventoDominio): Promise<void> {
    await this.sender.sendMessages({
      body: evento,
      subject: evento.tipo,
      contentType: 'application/json',
      applicationProperties: { tipo: evento.tipo, versao: evento.versao },
    });
  }
}
