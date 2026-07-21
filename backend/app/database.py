import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://engclin_user:engclin_pass@localhost:5432/engclin_db",
)

# O "engine" é o que sabe como se conectar fisicamente ao PostgreSQL.
engine = create_engine(DATABASE_URL)

# Cada requisição à API vai abrir uma "sessão" (conversa) com o banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base é a classe da qual todos os nossos modelos (tabelas) vão herdar
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
