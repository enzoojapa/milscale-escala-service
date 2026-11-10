import sql from 'mssql';
import { Escala, Posto, StatusEscala } from '../../domain/Escala';
import { EscalaRepository, EventLog, EventoDominio, EventoRegistrado, TrocaRepository } from '../../domain/ports';
import { StatusTroca, Troca } from '../../domain/Troca';

function dataIso(valor: Date | string): string {
  return valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
}

function linhaParaEscala(r: any): Escala {
  return Escala.restaurar({
    id: r.id,
    data: dataIso(r.data),
    militarId: r.militar_id,
    militarNome: r.militar_nome,
    posto: r.posto as Posto,
    status: r.status as StatusEscala,
    publicadaEm: r.publicada_em,
  });
}

function linhaParaTroca(r: any): Troca {
  return Troca.restaurar({
    id: r.id,
    escalaId: r.escala_id,
    militarOriginalId: r.militar_original_id,
    militarSubstitutoId: r.militar_substituto_id,
    militarSubstitutoNome: r.militar_substituto_nome,
    motivo: r.motivo,
    status: r.status as StatusTroca,
    solicitadaEm: r.solicitada_em,
  });
}

export class SqlEscalaRepository implements EscalaRepository {
  constructor(private readonly pool: sql.ConnectionPool) {}

  async salvar(e: Escala): Promise<Escala> {
    const r = await this.pool
      .request()
      .input('data', sql.Date, e.data)
      .input('militarId', sql.VarChar(64), e.militarId)
      .input('militarNome', sql.NVarChar(120), e.militarNome)
      .input('posto', sql.VarChar(30), e.posto)
      .input('status', sql.VarChar(20), e.status)
      .query(`INSERT INTO dbo.escalas (data, militar_id, militar_nome, posto, status)
              OUTPUT INSERTED.* VALUES (@data, @militarId, @militarNome, @posto, @status)`);
    return linhaParaEscala(r.recordset[0]);
  }

  async atualizar(e: Escala): Promise<Escala> {
    await this.pool
      .request()
      .input('id', sql.Int, e.id)
      .input('militarId', sql.VarChar(64), e.militarId)
      .input('militarNome', sql.NVarChar(120), e.militarNome)
      .input('posto', sql.VarChar(30), e.posto)
      .input('status', sql.VarChar(20), e.status)
      .input('publicadaEm', sql.DateTime2, e.publicadaEm)
      .query(`UPDATE dbo.escalas SET militar_id=@militarId, militar_nome=@militarNome, posto=@posto,
              status=@status, publicada_em=@publicadaEm WHERE id=@id`);
    return e;
  }

  async buscarPorId(id: number): Promise<Escala | null> {
    const r = await this.pool.request().input('id', sql.Int, id).query('SELECT * FROM dbo.escalas WHERE id=@id');
    return r.recordset[0] ? linhaParaEscala(r.recordset[0]) : null;
  }

  async buscarPorMilitarEData(militarId: string, data: string): Promise<Escala | null> {
    const r = await this.pool
      .request()
      .input('militarId', sql.VarChar(64), militarId)
      .input('data', sql.Date, data)
      .query('SELECT * FROM dbo.escalas WHERE militar_id=@militarId AND data=@data');
    return r.recordset[0] ? linhaParaEscala(r.recordset[0]) : null;
  }

  async listar(filtro: { data?: string; status?: string } = {}): Promise<Escala[]> {
    const req = this.pool.request();
    const where: string[] = [];
    if (filtro.data) {
      req.input('data', sql.Date, filtro.data);
      where.push('data=@data');
    }
    if (filtro.status) {
      req.input('status', sql.VarChar(20), filtro.status);
      where.push('status=@status');
    }
    const r = await req.query(
      `SELECT * FROM dbo.escalas ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY data, posto`,
    );
    return r.recordset.map(linhaParaEscala);
  }

  async remover(id: number): Promise<boolean> {
    const r = await this.pool.request().input('id', sql.Int, id).query('DELETE FROM dbo.escalas WHERE id=@id');
    return r.rowsAffected[0] === 1;
  }
}

export class SqlTrocaRepository implements TrocaRepository {
  constructor(private readonly pool: sql.ConnectionPool) {}

  async salvar(t: Troca): Promise<Troca> {
    const r = await this.pool
      .request()
      .input('escalaId', sql.Int, t.escalaId)
      .input('original', sql.VarChar(64), t.militarOriginalId)
      .input('substituto', sql.VarChar(64), t.militarSubstitutoId)
      .input('substitutoNome', sql.NVarChar(120), t.militarSubstitutoNome)
      .input('motivo', sql.NVarChar(300), t.motivo)
      .input('status', sql.VarChar(20), t.status)
      .input('solicitadaEm', sql.DateTime2, t.solicitadaEm)
      .query(`INSERT INTO dbo.trocas (escala_id, militar_original_id, militar_substituto_id, militar_substituto_nome,
              motivo, status, solicitada_em) OUTPUT INSERTED.*
              VALUES (@escalaId, @original, @substituto, @substitutoNome, @motivo, @status, @solicitadaEm)`);
    return linhaParaTroca(r.recordset[0]);
  }

  async atualizar(t: Troca): Promise<Troca> {
    await this.pool
      .request()
      .input('id', sql.Int, t.id)
      .input('status', sql.VarChar(20), t.status)
      .query('UPDATE dbo.trocas SET status=@status WHERE id=@id');
    return t;
  }

  async buscarPorId(id: number): Promise<Troca | null> {
    const r = await this.pool.request().input('id', sql.Int, id).query('SELECT * FROM dbo.trocas WHERE id=@id');
    return r.recordset[0] ? linhaParaTroca(r.recordset[0]) : null;
  }

  async listar(filtro: { status?: string } = {}): Promise<Troca[]> {
    const req = this.pool.request();
    let where = '';
    if (filtro.status) {
      req.input('status', sql.VarChar(20), filtro.status);
      where = 'WHERE status=@status';
    }
    const r = await req.query(`SELECT * FROM dbo.trocas ${where} ORDER BY solicitada_em DESC`);
    return r.recordset.map(linhaParaTroca);
  }
}

export class SqlEventLog implements EventLog {
  constructor(private readonly pool: sql.ConnectionPool) {}

  async registrar(e: EventoDominio): Promise<void> {
    await this.pool
      .request()
      .input('tipo', sql.VarChar(40), e.tipo)
      .input('versao', sql.Int, e.versao)
      .input('ocorridoEm', sql.DateTime2, new Date(e.ocorridoEm))
      .input('dados', sql.NVarChar(sql.MAX), JSON.stringify(e.dados))
      .query('INSERT INTO dbo.eventos (tipo, versao, ocorrido_em, dados) VALUES (@tipo, @versao, @ocorridoEm, @dados)');
  }

  async listar(limite: number): Promise<EventoRegistrado[]> {
    const r = await this.pool
      .request()
      .input('limite', sql.Int, limite)
      .query('SELECT TOP (@limite) * FROM dbo.eventos ORDER BY id DESC');
    return r.recordset.map((x: any) => ({
      id: x.id,
      tipo: x.tipo,
      versao: x.versao,
      ocorridoEm: new Date(x.ocorrido_em).toISOString(),
      dados: JSON.parse(x.dados),
    }));
  }
}
