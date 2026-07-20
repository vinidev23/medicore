"""
Conceitos:
- MTTR (Mean Time To Repair): tempo médio para CONSERTAR um equipamento.
  Calculado como a média de (data_conclusao - data_abertura) das OS.

- MTBF (Mean Time Between Failures): tempo médio ENTRE falhas.
  Calculado como o tempo total de observação dividido pelo número
  de falhas (OS corretivas) no período.
"""
from datetime import datetime
from statistics import mean
from typing import Optional

from sqlalchemy.orm import Session

from app.models.ordem_servico import OrdemServico, TipoOSEnum, StatusOSEnum


def calcular_mttr_horas(db: Session, equipamento_id: int) -> Optional[float]:
    """
    Calcula o MTTR (em horas) de um equipamento, usando apenas
    OS do tipo CORRETIVA que já foram CONCLUIDAS (têm data_conclusao).
    """
    ordens = (
        db.query(OrdemServico)
        .filter(
            OrdemServico.equipamento_id == equipamento_id,
            OrdemServico.tipo == TipoOSEnum.CORRETIVA,
            OrdemServico.status == StatusOSEnum.CONCLUIDA,
            OrdemServico.data_conclusao.isnot(None),
        )
        .all()
    )

    if not ordens:
        return None  # Sem dados suficientes para calcular ainda

    tempos_reparo_horas = [
        (os.data_conclusao - os.data_abertura).total_seconds() / 3600
        for os in ordens
    ]

    return round(mean(tempos_reparo_horas), 2)


def calcular_mtbf_horas(db: Session, equipamento_id: int) -> Optional[float]:
    """
    Calcula o MTBF (em horas) de um equipamento.

    Fórmula: tempo total decorrido entre a primeira e a última falha
    registrada, dividido pelo número de falhas (menos 1, porque
    é contado os INTERVALOS entre falhas, não as falhas em si).
    """
    ordens = (
        db.query(OrdemServico)
        .filter(
            OrdemServico.equipamento_id == equipamento_id,
            OrdemServico.tipo == TipoOSEnum.CORRETIVA,
        )
        .order_by(OrdemServico.data_abertura.asc())
        .all()
    )

    # É preciso de pelo menos 2 falhas para calcular um "intervalo entre falhas"
    if len(ordens) < 2:
        return None

    primeira_falha = ordens[0].data_abertura
    ultima_falha = ordens[-1].data_abertura
    numero_de_intervalos = len(ordens) - 1

    tempo_total_horas = (ultima_falha - primeira_falha).total_seconds() / 3600

    return round(tempo_total_horas / numero_de_intervalos, 2)


def obter_indicadores_equipamento(db: Session, equipamento_id: int) -> dict:
    # Função de conveniência que retorna os dois indicadores juntos.
    return {
        "equipamento_id": equipamento_id,
        "mtbf_horas": calcular_mtbf_horas(db, equipamento_id),
        "mttr_horas": calcular_mttr_horas(db, equipamento_id),
    }
