from datetime import date, datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator

from app.models.calibracao import ResultadoCalibracaoEnum


class CalibracaoParametroBase(BaseModel):
    grandeza: str = Field(..., description="Ex: Pressão, Temperatura, Vazão, Energia")
    unidade: Optional[str] = Field(None, description="Ex: mmHg, °C, mL/h, J")
    valor_referencia: float
    valor_medido: float
    tolerancia_maxima: float = Field(
        ..., description="Desvio máximo absoluto aceito entre referência e medido"
    )


class CalibracaoParametroCreate(CalibracaoParametroBase):
    pass


class CalibracaoParametroRead(CalibracaoParametroBase):
    id: int
    erro: float
    dentro_tolerancia: bool

    model_config = ConfigDict(from_attributes=True)


class CalibracaoBase(BaseModel):
    equipamento_id: int
    data_calibracao: date
    tecnico_responsavel: str
    instrumento_padrao: Optional[str] = None
    certificado_numero: Optional[str] = None
    proxima_calibracao: Optional[date] = None
    observacoes: Optional[str] = None


class CalibracaoCreate(CalibracaoBase):
    parametros: list[CalibracaoParametroCreate] = Field(..., min_length=1)
    # Opcional: marque "ajustado" quando o equipamento precisou de correção
    # para ficar dentro da tolerância. Se omitido, o resultado é calculado
    # automaticamente (aprovado/reprovado) a partir dos parâmetros.
    ajustado: bool = False


class CalibracaoRead(CalibracaoBase):
    id: int
    resultado_geral: ResultadoCalibracaoEnum
    criado_em: datetime
    parametros: list[CalibracaoParametroRead] = []

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("criado_em")
    def serializar_criado_em(self, valor: datetime) -> str:
        if valor.tzinfo is None:
            valor = valor.replace(tzinfo=timezone.utc)
        return valor.isoformat()
