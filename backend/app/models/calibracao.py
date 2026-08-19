import enum
from datetime import date, datetime

from sqlalchemy import (
    String,
    Date,
    DateTime,
    ForeignKey,
    Enum,
    Integer,
    Text,
    Numeric,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ResultadoCalibracaoEnum(str, enum.Enum):
    APROVADO = "aprovado"    # todos os parâmetros dentro da tolerância
    REPROVADO = "reprovado"  # ao menos um parâmetro fora da tolerância, sem ajuste
    AJUSTADO = "ajustado"    # equipamento precisou de ajuste para ficar conforme


class CalibracaoEquipamento(Base):
    """
    Registra uma calibração realizada em um equipamento: quem fez, quando,
    com qual padrão/instrumento de referência, o resultado geral e a data da
    próxima calibração prevista. Cada calibração tem um ou mais parâmetros
    medidos (ex: pressão, temperatura, vazão), guardados em CalibracaoParametro.
    """

    __tablename__ = "calibracoes_equipamento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    equipamento_id: Mapped[int] = mapped_column(
        ForeignKey("equipamentos.id"), nullable=False
    )
    equipamento: Mapped["Equipamento"] = relationship(
        "Equipamento", back_populates="calibracoes"
    )

    data_calibracao: Mapped[date] = mapped_column(Date, nullable=False)
    tecnico_responsavel: Mapped[str] = mapped_column(String(150), nullable=False)
    instrumento_padrao: Mapped[str] = mapped_column(String(150), nullable=True)
    certificado_numero: Mapped[str] = mapped_column(String(100), nullable=True)

    proxima_calibracao: Mapped[date] = mapped_column(Date, nullable=True)

    resultado_geral: Mapped[ResultadoCalibracaoEnum] = mapped_column(
        Enum(ResultadoCalibracaoEnum),
        nullable=False,
        default=ResultadoCalibracaoEnum.APROVADO,
    )

    observacoes: Mapped[str] = mapped_column(Text, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    parametros: Mapped[list["CalibracaoParametro"]] = relationship(
        "CalibracaoParametro",
        back_populates="calibracao",
        cascade="all, delete-orphan",
        order_by="CalibracaoParametro.id",
    )
    
    resultado_geral = Column(
    Enum(
        ResultadoCalibracaoEnum,
        values_callable=lambda obj: [e.value for e in obj]
    ),
    nullable=False
)

    def __repr__(self) -> str:
        return (
            f"<CalibracaoEquipamento {self.id} - equipamento={self.equipamento_id} "
            f"{self.resultado_geral}>"
        )


class CalibracaoParametro(Base):
    """
    Um ponto/grandeza medido dentro de uma calibração (ex: 'Pressão a 100 mmHg',
    'Temperatura a 37°C'). O erro é a diferença entre o valor medido e o valor
    de referência, e "dentro_tolerancia" indica se esse erro ficou dentro da
    tolerância máxima aceita para aquele parâmetro.
    """

    __tablename__ = "calibracoes_parametros"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    calibracao_id: Mapped[int] = mapped_column(
        ForeignKey("calibracoes_equipamento.id"), nullable=False
    )
    calibracao: Mapped["CalibracaoEquipamento"] = relationship(
        "CalibracaoEquipamento", back_populates="parametros"
    )

    grandeza: Mapped[str] = mapped_column(String(100), nullable=False)
    unidade: Mapped[str] = mapped_column(String(30), nullable=True)

    valor_referencia: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    valor_medido: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    tolerancia_maxima: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)

    erro: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    dentro_tolerancia: Mapped[bool] = mapped_column(Boolean, nullable=False)

    def __repr__(self) -> str:
        return f"<CalibracaoParametro {self.grandeza} erro={self.erro}>"
