from sqlalchemy import text
from app.database import engine


def main():
    with engine.connect() as conn:
        conn.execute(
            text(
                "ALTER TABLE equipamentos "
                "ADD COLUMN IF NOT EXISTS localizacao_atual VARCHAR(100)"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE equipamentos "
                "ADD COLUMN IF NOT EXISTS emprestado_atualmente BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        conn.execute(
            text(
                "UPDATE equipamentos SET localizacao_atual = setor "
                "WHERE localizacao_atual IS NULL"
            )
        )

        conn.execute(
            text(
                "DO $$ BEGIN "
                "CREATE TYPE statusemprestimoenum AS ENUM ('em_andamento', 'devolvido'); "
                "EXCEPTION WHEN duplicate_object THEN null; "
                "END $$;"
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS emprestimos_internos (
                    id SERIAL PRIMARY KEY,
                    equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id),
                    setor_origem VARCHAR(100) NOT NULL,
                    setor_destino VARCHAR(100) NOT NULL,
                    solicitante VARCHAR(150) NOT NULL,
                    responsavel_transporte VARCHAR(150),
                    motivo TEXT,
                    status statusemprestimoenum NOT NULL DEFAULT 'em_andamento',
                    data_emprestimo TIMESTAMP NOT NULL DEFAULT NOW(),
                    data_prevista_devolucao TIMESTAMP NOT NULL,
                    data_devolucao TIMESTAMP,
                    observacao_devolucao TEXT
                )
                """
            )
        )
        conn.commit()
    print(
        "Migração aplicada: tabela 'emprestimos_internos' e colunas de "
        "localização criadas/garantidas."
    )


if __name__ == "__main__":
    main()
