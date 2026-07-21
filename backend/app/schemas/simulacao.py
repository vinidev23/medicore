from typing import Optional

from pydantic import BaseModel, Field


class SimulacaoInput(BaseModel):
    valor_equipamento_novo: float = Field(gt=0)
    vida_util_estimada_anos: float = Field(gt=0)
    meses_historico: int = Field(default=12, gt=0)


class SimulacaoResultado(BaseModel):
    equipamento_id: int
    meses_analisados: int
    quantidade_os_no_periodo: int
    custo_total_periodo: float
    custo_medio_mensal: float
    projecao_manter_12_meses: float
    custo_anualizado_substituir: Optional[float]
    custo_total_historico_manutencao: float
    percentual_do_valor_original_gasto: Optional[float]
    recomendacao: str
