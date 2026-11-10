import { Router } from 'express';
import { ListEscalas } from '../../application/list-escalas/ListEscalas';

export function listEscalasRoute(uc: ListEscalas): Router {
  return Router().get('/escalas', async (req, res) => {
    res.json(await uc.execute({ data: req.query.data as string, status: req.query.status as string }));
  });
}
