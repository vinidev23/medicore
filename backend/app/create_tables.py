from app.database import engine, Base
from app import models


def main():
    print("Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas com sucesso: equipamentos, ordens_servico")


if __name__ == "__main__":
    main()
