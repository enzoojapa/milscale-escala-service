import { Escala } from '../domain/Escala';
import { Troca } from '../domain/Troca';

export function escalaDto(e: Escala) {
  return {
    id: e.id,
    data: e.data,
    militarId: e.militarId,
    militarNome: e.militarNome,
    posto: e.posto,
    status: e.status,
    inicio: e.inicio().toISOString(),
    fim: e.fim().toISOString(),
    publicadaEm: e.publicadaEm ? e.publicadaEm.toISOString() : null,
  };
}

export function trocaDto(t: Troca) {
  return {
    id: t.id,
    escalaId: t.escalaId,
    militarOriginalId: t.militarOriginalId,
    militarSubstitutoId: t.militarSubstitutoId,
    militarSubstitutoNome: t.militarSubstitutoNome,
    motivo: t.motivo,
    status: t.status,
    solicitadaEm: t.solicitadaEm.toISOString(),
  };
}
