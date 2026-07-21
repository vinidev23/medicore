import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PapelEnum(str, enum.Enum):
    ADMIN = "admin"        # pode gerenciar usuários e tudo mais
    TECNICO = "tecnico"    # uso operacional do dia a dia


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    papel: Mapped[PapelEnum] = mapped_column(Enum(PapelEnum), default=PapelEnum.TECNICO)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Usuario {self.email}>"
