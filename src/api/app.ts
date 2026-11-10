import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { ApproveTroca } from '../application/approve-troca/ApproveTroca';
import { CreateEscala } from '../application/create-escala/CreateEscala';
import { DeleteEscala } from '../application/delete-escala/DeleteEscala';
import { ConflictError, NotFoundError } from '../application/errors';
import { GetEscala } from '../application/get-escala/GetEscala';
import { ListEscalas } from '../application/list-escalas/ListEscalas';
import { ListEventos } from '../application/list-eventos/ListEventos';
import { ListTrocas } from '../application/list-trocas/ListTrocas';
import { PublishEscala } from '../application/publish-escala/PublishEscala';
import { RequestTroca } from '../application/request-troca/RequestTroca';
import { UpdateEscala } from '../application/update-escala/UpdateEscala';
import { DomainError } from '../domain/DomainError';
import { Clock, EscalaRepository, EventLog, EventPublisher, TrocaRepository } from '../domain/ports';
import { asyncApiSpec } from './docs/asyncapi';
import { openApiSpec } from './docs/openapi';
import { approveTrocaRoute } from './features/approve-troca.route';
import { createEscalaRoute } from './features/create-escala.route';
import { deleteEscalaRoute } from './features/delete-escala.route';
import { getEscalaRoute } from './features/get-escala.route';
import { listEscalasRoute } from './features/list-escalas.route';
import { listEventosRoute } from './features/list-eventos.route';
import { listTrocasRoute } from './features/list-trocas.route';
import { publishEscalaRoute } from './features/publish-escala.route';
import { requestTrocaRoute } from './features/request-troca.route';
import { updateEscalaRoute } from './features/update-escala.route';

export interface Dependencias {
  escalas: EscalaRepository;
  trocas: TrocaRepository;
  publisher: EventPublisher;
  eventLog: EventLog;
  clock: Clock;
}

export function buildApp(d: Dependencias): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', servico: 'milscale-escala-service' });
  });
  app.get('/swagger.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.get('/asyncapi.json', (_req, res) => {
    res.json(asyncApiSpec);
  });
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use(createEscalaRoute(new CreateEscala(d.escalas)));
  app.use(listEscalasRoute(new ListEscalas(d.escalas)));
  app.use(getEscalaRoute(new GetEscala(d.escalas)));
  app.use(updateEscalaRoute(new UpdateEscala(d.escalas)));
  app.use(deleteEscalaRoute(new DeleteEscala(d.escalas)));
  app.use(publishEscalaRoute(new PublishEscala(d.escalas, d.publisher, d.clock)));
  app.use(requestTrocaRoute(new RequestTroca(d.escalas, d.trocas, d.clock)));
  app.use(listTrocasRoute(new ListTrocas(d.trocas)));
  app.use(approveTrocaRoute(new ApproveTroca(d.escalas, d.trocas, d.publisher, d.clock)));
  app.use(listEventosRoute(new ListEventos(d.eventLog)));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof DomainError) return void res.status(422).json({ erro: err.message });
    if (err instanceof NotFoundError) return void res.status(404).json({ erro: err.message });
    if (err instanceof ConflictError) return void res.status(409).json({ erro: err.message });
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  });
  return app;
}
