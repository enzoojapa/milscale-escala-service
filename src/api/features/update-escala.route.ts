import { Router } from 'express';
import { UpdateEscala } from '../../application/update-escala/UpdateEscala';

export function updateEscalaRoute(uc: UpdateEscala): Router {
  return Router().put('/escalas/:id', async (req, res) => {
    res.json(await uc.execute(Number(req.params.id), req.body));
  });
}
