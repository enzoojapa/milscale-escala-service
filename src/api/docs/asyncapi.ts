export const asyncApiSpec = {
  asyncapi: '2.6.0',
  info: {
    title: 'MilScale - Eventos de Escala',
    version: '1.0.0',
    description: 'Eventos publicados pelo milscale-escala-service na fila do Azure Service Bus e consumidos pela Azure Function.',
  },
  servers: {
    azure: { url: '<namespace>.servicebus.windows.net', protocol: 'amqp', description: 'Azure Service Bus' },
  },
  channels: {
    'escala-eventos': {
      description: 'Fila com os eventos de dominio de escala',
      subscribe: {
        summary: 'Eventos emitidos pelo servico de escalas',
        message: { oneOf: [{ $ref: '#/components/messages/EscalaPublicada' }, { $ref: '#/components/messages/TrocaAprovada' }] },
      },
    },
  },
  components: {
    messages: {
      EscalaPublicada: {
        name: 'EscalaPublicada',
        summary: 'Escala de servico publicada; os militares devem ser avisados',
        payload: {
          type: 'object',
          properties: {
            tipo: { type: 'string', const: 'EscalaPublicada' },
            versao: { type: 'integer', example: 1 },
            ocorridoEm: { type: 'string', format: 'date-time' },
            dados: {
              type: 'object',
              properties: {
                escalaId: { type: 'integer' },
                data: { type: 'string', format: 'date' },
                posto: { type: 'string' },
                militarId: { type: 'string' },
                militarNome: { type: 'string' },
                inicio: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      TrocaAprovada: {
        name: 'TrocaAprovada',
        summary: 'Troca de servico aprovada; quem sai e quem entra devem ser avisados',
        payload: {
          type: 'object',
          properties: {
            tipo: { type: 'string', const: 'TrocaAprovada' },
            versao: { type: 'integer', example: 1 },
            ocorridoEm: { type: 'string', format: 'date-time' },
            dados: {
              type: 'object',
              properties: {
                trocaId: { type: 'integer' },
                escalaId: { type: 'integer' },
                data: { type: 'string', format: 'date' },
                militarSaiId: { type: 'string' },
                militarEntraId: { type: 'string' },
                militarEntraNome: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};
