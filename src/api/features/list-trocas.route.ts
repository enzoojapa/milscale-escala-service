import { Router } from 'express';
import { ListTrocas } from '../../application/list-trocas/ListTrocas';

export function listTrocasRoute(uc: ListTrocas): Router {
  return Router().get('/trocas', async (req, res) => {
    res.json(await uc.execute({ status: req.query.status as string }));
  });
}
