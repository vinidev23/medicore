from sqlalchemy import text
from app.database import engine


def main():
    with engine.connect() as conn:
        conn.execute(
            text(
                "DO $$ BEGIN "
                "CREATE TYPE resultadocalibracaoenum AS ENUM "
                "('aprovado', 'reprovado', 'ajustado'); "
                "EXCEPTION WHEN duplicate_object THEN null; "
                "END $$;"
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS calibracoes_equipamento (
                    id SERIAL PRIMARY KEY,
                    equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id),
                    data_calibracao DATE NOT NULL,
                    tecnico_responsavel VARCHAR(150) NOT NULL,
                    instrumento_padrao VARCHAR(150),
                    certificado_numero VARCHAR(100),
                    proxima_calibracao DATE,
                    resultado_geral resultadocalibracaoenum NOT NULL DEFAULT 'aprovado',
                    observacoes TEXT,
                    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
                )
                """
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS calibracoes_parametros (
                    id SERIAL PRIMARY KEY,
                    calibracao_id INTEGER NOT NULL REFERENCES calibracoes_equipamento(id) ON DELETE CASCADE,
                    grandeza VARCHAR(100) NOT NULL,
                    unidade VARCHAR(30),
                    valor_referencia NUMERIC(12, 4) NOT NULL,
                    valor_medido NUMERIC(12, 4) NOT NULL,
                    tolerancia_maxima NUMERIC(12, 4) NOT NULL,
                    erro NUMERIC(12, 4) NOT NULL,
                    dentro_tolerancia BOOLEAN NOT NULL
                )
                """
            )
        )
        conn.commit()
    print(
        "Migração aplicada: tabelas 'calibracoes_equipamento' e "
        "'calibracoes_parametros' criadas/garantidas."
    )


if __name__ == "__main__":
    main()
