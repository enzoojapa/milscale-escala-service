import { Router } from 'express';
import { CreateEscala } from '../../application/create-escala/CreateEscala';

export function createEscalaRoute(uc: CreateEscala): Router {
  return Router().post('/escalas', async (req, res) => {
    res.status(201).json(await uc.execute(req.body));
  });
}
