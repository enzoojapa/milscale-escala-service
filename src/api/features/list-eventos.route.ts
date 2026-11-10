import { Router } from 'express';
import { ListEventos } from '../../application/list-eventos/ListEventos';

export function listEventosRoute(uc: ListEventos): Router {
  return Router().get('/eventos', async (req, res) => {
    res.json(await uc.execute(Number(req.query.limite ?? 20)));
  });
}
