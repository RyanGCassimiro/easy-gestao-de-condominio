-- ============================================================
-- Easy Gestão de Condomínio — Modelo Físico
-- Execute este arquivo ANTES dos arquivos 001 a 009
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE perfil_tipo AS ENUM ('morador', 'comerciante', 'sindico', 'porteiro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE prioridade_aviso AS ENUM ('normal', 'urgente', 'info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_reserva AS ENUM ('ativa', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE modalidade_assembleia AS ENUM ('presencial', 'online', 'hibrida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opcao_voto AS ENUM ('sim', 'nao', 'abstencao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_item AS ENUM ('disponivel', 'retirado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_dependente AS ENUM ('pet', 'pessoa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABELA: usuario
-- Sincronizada com auth.users via trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL UNIQUE,
  perfil            perfil_tipo NOT NULL DEFAULT 'morador',
  nome_fantasia     TEXT,
  foto_url          TEXT,
  aceite_termos_em  TIMESTAMPTZ,
  push_token        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: cria row em usuario quando um user faz signup no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.usuario (id_usuario, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id_usuario) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABELA: morador
-- ============================================================
CREATE TABLE IF NOT EXISTS morador (
  id_usuario UUID PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  cpf_hash   TEXT NOT NULL UNIQUE,
  unidade    TEXT NOT NULL,
  bloco      TEXT NOT NULL
);

-- ============================================================
-- TABELA: comerciante
-- ============================================================
CREATE TABLE IF NOT EXISTS comerciante (
  id_usuario       UUID PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  nome_fantasia    TEXT NOT NULL,
  cnpj             TEXT NOT NULL UNIQUE,
  nome_responsavel TEXT NOT NULL
);

-- ============================================================
-- TABELA: espaco_comum
-- ============================================================
CREATE TABLE IF NOT EXISTS espaco_comum (
  id_espaco  SERIAL PRIMARY KEY,
  nome       TEXT    NOT NULL,
  descricao  TEXT,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Espaços padrão do condomínio
INSERT INTO espaco_comum (nome, descricao) VALUES
  ('Salão de Festas',  'Salão principal para eventos e festas'),
  ('Churrasqueira',    'Área de churrasqueira coberta'),
  ('Quadra Esportiva', 'Quadra poliesportiva'),
  ('Academia',         'Academia de ginástica'),
  ('Piscina',          'Área da piscina adulto e infantil')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABELA: reserva
-- ============================================================
CREATE TABLE IF NOT EXISTS reserva (
  id_reserva          SERIAL PRIMARY KEY,
  id_usuario          UUID        NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_espaco           INTEGER     NOT NULL REFERENCES espaco_comum(id_espaco),
  data                DATE        NOT NULL,
  hora_inicio         TIME        NOT NULL,
  hora_fim            TIME        NOT NULL,
  observacao          TEXT,
  status              status_reserva NOT NULL DEFAULT 'ativa',
  motivo_cancelamento TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_hora_valida CHECK (hora_fim > hora_inicio)
);

-- ============================================================
-- TABELA: postagem (Feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS postagem (
  id_postagem  SERIAL      PRIMARY KEY,
  id_autor     UUID        NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  titulo       TEXT        NOT NULL,
  conteudo     TEXT        NOT NULL,
  imagem_url   TEXT,
  whatsapp_url TEXT,
  categorias   TEXT[]      NOT NULL DEFAULT '{}',
  is_maior18   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: curtida
-- ============================================================
CREATE TABLE IF NOT EXISTS curtida (
  id_curtida  SERIAL  PRIMARY KEY,
  id_postagem INTEGER NOT NULL REFERENCES postagem(id_postagem) ON DELETE CASCADE,
  id_usuario  UUID    NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  UNIQUE (id_postagem, id_usuario)
);

-- ============================================================
-- TABELA: aviso
-- ============================================================
CREATE TABLE IF NOT EXISTS aviso (
  id_aviso      SERIAL         PRIMARY KEY,
  titulo        TEXT           NOT NULL,
  conteudo      TEXT           NOT NULL,
  prioridade    prioridade_aviso NOT NULL DEFAULT 'normal',
  bloco         TEXT,
  andar         INTEGER,
  expira_em     TIMESTAMPTZ,
  id_condominio INTEGER        NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: visualiza_aviso (lido/não lido)
-- ============================================================
CREATE TABLE IF NOT EXISTS visualiza_aviso (
  id_aviso   INTEGER NOT NULL REFERENCES aviso(id_aviso) ON DELETE CASCADE,
  id_usuario UUID    NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  lido_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_aviso, id_usuario)
);

-- ============================================================
-- TABELA: assembleia
-- ============================================================
CREATE TABLE IF NOT EXISTS assembleia (
  id_assembleia SERIAL              PRIMARY KEY,
  titulo        TEXT                NOT NULL,
  descricao     TEXT,
  data_hora     TIMESTAMPTZ         NOT NULL,
  local         TEXT                NOT NULL,
  modalidade    modalidade_assembleia NOT NULL DEFAULT 'presencial'
);

-- ============================================================
-- TABELA: pauta
-- ============================================================
CREATE TABLE IF NOT EXISTS pauta (
  id_pauta      SERIAL  PRIMARY KEY,
  id_assembleia INTEGER NOT NULL REFERENCES assembleia(id_assembleia) ON DELETE CASCADE,
  titulo        TEXT    NOT NULL,
  descricao     TEXT,
  ordem         INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- TABELA: voto
-- ============================================================
CREATE TABLE IF NOT EXISTS voto (
  id_voto    SERIAL     PRIMARY KEY,
  id_pauta   INTEGER    NOT NULL REFERENCES pauta(id_pauta) ON DELETE CASCADE,
  id_usuario UUID       NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  opcao      opcao_voto NOT NULL,
  data_hora  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_pauta, id_usuario)
);

-- ============================================================
-- TABELA: item_achado (Achados e Perdidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS item_achado (
  id_item              SERIAL      PRIMARY KEY,
  descricao            TEXT        NOT NULL,
  local_achado         TEXT        NOT NULL,
  imagem_url           TEXT,
  data_achado          DATE        NOT NULL,
  status               status_item NOT NULL DEFAULT 'disponivel',
  nome_retirada        TEXT,
  documento_retirada   TEXT,
  observacao_retirada  TEXT,
  data_retirada        DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: dependente (Pets / Fofuras)
-- ============================================================
CREATE TABLE IF NOT EXISTS dependente (
  id_dependente      SERIAL          PRIMARY KEY,
  id_usuario         UUID            NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  nome               TEXT            NOT NULL,
  raca               TEXT,
  especie            TEXT,
  imagem_url         TEXT,
  data_nasc          DATE,
  observacao         TEXT,
  tipo               tipo_dependente NOT NULL DEFAULT 'pet',
  consentimento_lgpd BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: tentativa_login (bloqueio por brute-force)
-- ============================================================
CREATE TABLE IF NOT EXISTS tentativa_login (
  id_tentativa SERIAL      PRIMARY KEY,
  email        TEXT        NOT NULL,
  ip           TEXT,
  sucesso      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id_log      SERIAL      PRIMARY KEY,
  id_usuario  UUID        REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  acao        TEXT        NOT NULL,
  entidade    TEXT        NOT NULL,
  id_entidade TEXT,
  detalhes    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Função helper para inserir audit log
CREATE OR REPLACE FUNCTION inserir_audit_log(
  p_acao        TEXT,
  p_entidade    TEXT,
  p_id_entidade TEXT    DEFAULT NULL,
  p_detalhes    JSONB   DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (id_usuario, acao, entidade, id_entidade, detalhes)
  VALUES (auth.uid(), p_acao, p_entidade, p_id_entidade, p_detalhes);
END;
$$;

-- ============================================================
-- Indexes para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_postagem_autor       ON postagem(id_autor);
CREATE INDEX IF NOT EXISTS idx_postagem_created     ON postagem(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_curtida_postagem     ON curtida(id_postagem);
CREATE INDEX IF NOT EXISTS idx_reserva_usuario      ON reserva(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reserva_espaco_data  ON reserva(id_espaco, data);
CREATE INDEX IF NOT EXISTS idx_aviso_created        ON aviso(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aviso_prioridade     ON aviso(prioridade);
CREATE INDEX IF NOT EXISTS idx_pauta_assembleia     ON pauta(id_assembleia);
CREATE INDEX IF NOT EXISTS idx_voto_pauta           ON voto(id_pauta);
CREATE INDEX IF NOT EXISTS idx_dependente_usuario   ON dependente(id_usuario);
CREATE INDEX IF NOT EXISTS idx_tentativa_email      ON tentativa_login(email, created_at);
