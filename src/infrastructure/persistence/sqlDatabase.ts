import sql from 'mssql';

const SCHEMA = `
IF OBJECT_ID('dbo.escalas', 'U') IS NULL
CREATE TABLE dbo.escalas (
  id INT IDENTITY(1,1) PRIMARY KEY,
  data DATE NOT NULL,
  militar_id VARCHAR(64) NOT NULL,
  militar_nome NVARCHAR(120) NOT NULL,
  posto VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  publicada_em DATETIME2 NULL,
  CONSTRAINT uq_escala_militar_data UNIQUE (militar_id, data)
);

IF OBJECT_ID('dbo.trocas', 'U') IS NULL
CREATE TABLE dbo.trocas (
  id INT IDENTITY(1,1) PRIMARY KEY,
  escala_id INT NOT NULL REFERENCES dbo.escalas(id) ON DELETE CASCADE,
  militar_original_id VARCHAR(64) NOT NULL,
  militar_substituto_id VARCHAR(64) NOT NULL,
  militar_substituto_nome NVARCHAR(120) NOT NULL,
  motivo NVARCHAR(300) NOT NULL,
  status VARCHAR(20) NOT NULL,
  solicitada_em DATETIME2 NOT NULL
);

IF OBJECT_ID('dbo.eventos', 'U') IS NULL
CREATE TABLE dbo.eventos (
  id INT IDENTITY(1,1) PRIMARY KEY,
  tipo VARCHAR(40) NOT NULL,
  versao INT NOT NULL,
  ocorrido_em DATETIME2 NOT NULL,
  dados NVARCHAR(MAX) NOT NULL
);
`;

export async function conectarSql(connectionString: string): Promise<sql.ConnectionPool> {
  const pool = await new sql.ConnectionPool(connectionString).connect();
  await pool.request().batch(SCHEMA);
  return pool;
}
