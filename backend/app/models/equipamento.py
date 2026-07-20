import enum
from datetime import date

from sqlalchemy import String, Date, Numeric, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CriticidadeEnum(str, enum.Enum):
    SUPORTE_VIDA = "suporte_vida"      # ex: ventilador, monitor de UTI
    ALTA = "alta"                       # ex: bomba de infusão
    MEDIA = "media"                     # ex: equipamento de diagnóstico
    BAIXA = "baixa"                     # ex: equipamento administrativo


class Equipamento(Base):
    __tablename__ = "equipamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    numero_patrimonio: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    fabricante: Mapped[str] = mapped_column(String(100), nullable=True)
    modelo: Mapped[str] = mapped_column(String(100), nullable=True)

    setor: Mapped[str] = mapped_column(String(100), nullable=False)
    criticidade: Mapped[CriticidadeEnum] = mapped_column(
        Enum(CriticidadeEnum), nullable=False, default=CriticidadeEnum.MEDIA
    )

    data_aquisicao: Mapped[date] = mapped_column(Date, nullable=True)
    valor_aquisicao: Mapped[float] = mapped_column(Numeric(12, 2), nullable=True)

    # Relação: um equipamento tem várias ordens de serviço.
    ordens_servico: Mapped[list["OrdemServico"]] = relationship(
        "OrdemServico", back_populates="equipamento", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Equipamento {self.numero_patrimonio} - {self.nome}>"
