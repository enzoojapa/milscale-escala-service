import { Router } from 'express';
import { RequestTroca } from '../../application/request-troca/RequestTroca';

export function requestTrocaRoute(uc: RequestTroca): Router {
  return Router().post('/trocas', async (req, res) => {
    res.status(201).json(await uc.execute(req.body));
  });
}
