import enum
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Enum, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TipoOSEnum(str, enum.Enum):
    CORRETIVA = "corretiva"
    PREVENTIVA = "preventiva"
    CALIBRACAO = "calibracao"


class StatusOSEnum(str, enum.Enum):
    ABERTA = "aberta"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    equipamento_id: Mapped[int] = mapped_column(
        ForeignKey("equipamentos.id"), nullable=False
    )
    equipamento: Mapped["Equipamento"] = relationship(
        "Equipamento", back_populates="ordens_servico"
    )

    tipo: Mapped[TipoOSEnum] = mapped_column(Enum(TipoOSEnum), nullable=False)
    status: Mapped[StatusOSEnum] = mapped_column(
        Enum(StatusOSEnum), nullable=False, default=StatusOSEnum.ABERTA
    )

    descricao_problema: Mapped[str] = mapped_column(Text, nullable=True)
    data_abertura: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    data_conclusao: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    tecnico_responsavel: Mapped[str] = mapped_column(String(100), nullable=True)

    def __repr__(self) -> str:
        return f"<OrdemServico {self.id} - {self.tipo} - {self.status}>"
