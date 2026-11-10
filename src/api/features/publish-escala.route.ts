import { Router } from 'express';
import { PublishEscala } from '../../application/publish-escala/PublishEscala';

export function publishEscalaRoute(uc: PublishEscala): Router {
  return Router().post('/escalas/:id/publicar', async (req, res) => {
    res.json(await uc.execute(Number(req.params.id)));
  });
}
