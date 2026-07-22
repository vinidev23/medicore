import sys

from app.database import SessionLocal
from app.models.usuario import Usuario, PapelEnum


def main():
    if len(sys.argv) != 2:
        print("Uso: python -m app.scripts.promover_admin <email>")
        sys.exit(1)

    email = sys.argv[1]
    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        if not usuario:
            print(f"Nenhum usuário encontrado com o e-mail {email}")
            sys.exit(1)

        usuario.papel = PapelEnum.ADMIN
        db.commit()
        print(f"Usuário {email} agora é ADMIN.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
