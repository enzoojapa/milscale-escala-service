import { Router } from 'express';
import { ApproveTroca } from '../../application/approve-troca/ApproveTroca';

export function approveTrocaRoute(uc: ApproveTroca): Router {
  return Router().post('/trocas/:id/aprovar', async (req, res) => {
    res.json(await uc.execute(Number(req.params.id)));
  });
}
