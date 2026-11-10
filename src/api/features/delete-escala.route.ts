import { Router } from 'express';
import { DeleteEscala } from '../../application/delete-escala/DeleteEscala';

export function deleteEscalaRoute(uc: DeleteEscala): Router {
  return Router().delete('/escalas/:id', async (req, res) => {
    await uc.execute(Number(req.params.id));
    res.status(204).send();
  });
}
