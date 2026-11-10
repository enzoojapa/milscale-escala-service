import { asyncApiSpec } from './asyncapi';

const POSTOS = ['SENTINELA', 'CABO_DA_GUARDA', 'SARGENTO_DE_DIA', 'OFICIAL_DE_DIA'];
const json = (schema: object) => ({ content: { 'application/json': { schema } } });
const erro = { type: 'object', properties: { erro: { type: 'string' } } };
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };

const escala = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    data: { type: 'string', format: 'date', example: '2026-11-20' },
    militarId: { type: 'string' },
    militarNome: { type: 'string', example: 'SD SILVA' },
    posto: { type: 'string', enum: POSTOS },
    status: { type: 'string', enum: ['RASCUNHO', 'PUBLICADA'] },
    inicio: { type: 'string', format: 'date-time' },
    fim: { type: 'string', format: 'date-time' },
    publicadaEm: { type: 'string', format: 'date-time', nullable: true },
  },
};

const troca = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    escalaId: { type: 'integer' },
    militarOriginalId: { type: 'string' },
    militarSubstitutoId: { type: 'string' },
    militarSubstitutoNome: { type: 'string' },
    motivo: { type: 'string' },
    status: { type: 'string', enum: ['PENDENTE', 'APROVADA', 'RECUSADA'] },
    solicitadaEm: { type: 'string', format: 'date-time' },
  },
};

const eventos = asyncApiSpec.components.messages;

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MilScale - Escala Service',
    version: '1.0.0',
    description:
      'Microsservico de escalas de servico (24h, 08h as 08h) e trocas. Banco: Azure SQL. ' +
      'Publica os eventos EscalaPublicada e TrocaAprovada no Azure Service Bus (ver schemas de Eventos e /asyncapi.json).',
  },
  tags: [{ name: 'Escalas' }, { name: 'Trocas' }, { name: 'Eventos' }, { name: 'Health' }],
  paths: {
    '/health': { get: { tags: ['Health'], summary: 'Status do servico', responses: { 200: { description: 'OK' } } } },
    '/escalas': {
      get: {
        tags: ['Escalas'],
        summary: 'Lista escalas',
        parameters: [
          { name: 'data', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['RASCUNHO', 'PUBLICADA'] } },
        ],
        responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { total: { type: 'integer' }, escalas: { type: 'array', items: escala } } }) } },
      },
      post: {
        tags: ['Escalas'],
        summary: 'Cria escala (rascunho)',
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['data', 'militarId', 'militarNome', 'posto'],
            properties: {
              data: { type: 'string', format: 'date', example: '2026-11-20' },
              militarId: { type: 'string', example: '6731f0c2a1b2c3d4e5f60789' },
              militarNome: { type: 'string', example: 'SD SILVA' },
              posto: { type: 'string', enum: POSTOS, example: 'SENTINELA' },
            },
          }),
        },
        responses: {
          201: { description: 'Criada', ...json(escala) },
          409: { description: 'Militar ja escalado no dia', ...json(erro) },
          422: { description: 'Regra de negocio violada', ...json(erro) },
        },
      },
    },
    '/escalas/{id}': {
      get: { tags: ['Escalas'], summary: 'Busca escala', parameters: [idParam], responses: { 200: { description: 'OK', ...json(escala) }, 404: { description: 'Nao encontrada', ...json(erro) } } },
      put: {
        tags: ['Escalas'],
        summary: 'Altera escala em rascunho',
        parameters: [idParam],
        requestBody: { required: true, ...json({ type: 'object', properties: { militarId: { type: 'string' }, militarNome: { type: 'string' }, posto: { type: 'string', enum: POSTOS } } }) },
        responses: { 200: { description: 'Alterada', ...json(escala) }, 422: { description: 'Escala publicada nao pode ser editada', ...json(erro) } },
      },
      delete: { tags: ['Escalas'], summary: 'Remove escala em rascunho', parameters: [idParam], responses: { 204: { description: 'Removida' }, 422: { description: 'Escala publicada', ...json(erro) } } },
    },
    '/escalas/{id}/publicar': {
      post: {
        tags: ['Escalas', 'Eventos'],
        summary: 'Publica a escala e emite o evento EscalaPublicada',
        parameters: [idParam],
        responses: { 200: { description: 'Publicada', ...json(escala) }, 422: { description: 'Ja publicada', ...json(erro) } },
      },
    },
    '/trocas': {
      get: {
        tags: ['Trocas'],
        summary: 'Lista trocas',
        parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { total: { type: 'integer' }, trocas: { type: 'array', items: troca } } }) } },
      },
      post: {
        tags: ['Trocas'],
        summary: 'Solicita troca (minimo de 24h antes do inicio do servico)',
        requestBody: {
          required: true,
          ...json({
            type: 'object',
            required: ['escalaId', 'militarSubstitutoId', 'militarSubstitutoNome', 'motivo'],
            properties: {
              escalaId: { type: 'integer', example: 1 },
              militarSubstitutoId: { type: 'string' },
              militarSubstitutoNome: { type: 'string', example: 'SD SOUZA' },
              motivo: { type: 'string', example: 'Consulta medica' },
            },
          }),
        },
        responses: { 201: { description: 'Solicitada', ...json(troca) }, 422: { description: 'Menos de 24h de antecedencia', ...json(erro) } },
      },
    },
    '/trocas/{id}/aprovar': {
      post: {
        tags: ['Trocas', 'Eventos'],
        summary: 'Aprova a troca, atualiza a escala e emite TrocaAprovada',
        parameters: [idParam],
        responses: { 200: { description: 'Aprovada' }, 409: { description: 'Substituto ja escalado no dia', ...json(erro) } },
      },
    },
    '/eventos': {
      get: {
        tags: ['Eventos'],
        summary: 'Ultimos eventos publicados (log)',
        parameters: [{ name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/asyncapi.json': {
      get: { tags: ['Eventos'], summary: 'Contrato AsyncAPI dos eventos', responses: { 200: { description: 'OK' } } },
    },
  },
  components: {
    schemas: {
      Escala: escala,
      Troca: troca,
      EventoEscalaPublicada: eventos.EscalaPublicada.payload,
      EventoTrocaAprovada: eventos.TrocaAprovada.payload,
    },
  },
};
