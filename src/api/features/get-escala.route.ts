import { Router } from 'express';
import { GetEscala } from '../../application/get-escala/GetEscala';

export function getEscalaRoute(uc: GetEscala): Router {
  return Router().get('/escalas/:id', async (req, res) => {
    res.json(await uc.execute(Number(req.params.id)));
  });
}
