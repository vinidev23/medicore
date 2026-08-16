import enum
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Enum, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StatusEmprestimoEnum(str, enum.Enum):
    EM_ANDAMENTO = "em_andamento"   # equipamento está fora do setor de origem
    DEVOLVIDO = "devolvido"         # já retornou ao setor de origem


class EmprestimoInterno(Base):
    """
    Registra o empréstimo/transferência temporária de um equipamento entre
    setores (ex: UTI -> Centro Cirúrgico), permitindo rastrear a localização
    atual do equipamento e cobrar a devolução no prazo combinado.
    """

    __tablename__ = "emprestimos_internos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    equipamento_id: Mapped[int] = mapped_column(
        ForeignKey("equipamentos.id"), nullable=False
    )
    equipamento: Mapped["Equipamento"] = relationship(
        "Equipamento", back_populates="emprestimos"
    )

    setor_origem: Mapped[str] = mapped_column(String(100), nullable=False)
    setor_destino: Mapped[str] = mapped_column(String(100), nullable=False)

    solicitante: Mapped[str] = mapped_column(String(150), nullable=False)
    responsavel_transporte: Mapped[str] = mapped_column(String(150), nullable=True)
    motivo: Mapped[str] = mapped_column(Text, nullable=True)

    status: Mapped[StatusEmprestimoEnum] = mapped_column(
        Enum(StatusEmprestimoEnum), nullable=False, default=StatusEmprestimoEnum.EM_ANDAMENTO
    )

    data_emprestimo: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    data_prevista_devolucao: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    data_devolucao: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    observacao_devolucao: Mapped[str] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<EmprestimoInterno {self.id} - equipamento={self.equipamento_id} "
            f"{self.setor_origem}->{self.setor_destino} - {self.status}>"
        )
