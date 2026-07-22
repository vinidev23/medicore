from sqlalchemy import text
from app.database import engine


def main():
    with engine.connect() as conn:
        conn.execute(
            text(
                "ALTER TABLE ordens_servico "
                "ADD COLUMN IF NOT EXISTS observacao_conclusao TEXT"
            )
        )
        conn.commit()
    print("Migração aplicada: coluna 'observacao_conclusao' garantida em ordens_servico.")


if __name__ == "__main__":
    main()
