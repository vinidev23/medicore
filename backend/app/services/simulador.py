from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.ordem_servico import OrdemServico, StatusOSEnum
from app.models.equipamento import Equipamento


def calcular_simulacao(
    db: Session,
    equipamento_id: int,
    valor_equipamento_novo: float,
    vida_util_estimada_anos: float,
    meses_historico: int = 12,
) -> dict:
    equipamento = db.get(Equipamento, equipamento_id)

    data_limite = datetime.utcnow() - timedelta(days=30 * meses_historico)

    ordens_periodo = (
        db.query(OrdemServico)
        .filter(
            OrdemServico.equipamento_id == equipamento_id,
            OrdemServico.status == StatusOSEnum.CONCLUIDA,
            OrdemServico.data_abertura >= data_limite,
            OrdemServico.custo.isnot(None),
        )
        .all()
    )

    custo_total_periodo = sum(float(os.custo) for os in ordens_periodo)
    custo_medio_mensal = (
        round(custo_total_periodo / meses_historico, 2) if meses_historico else 0
    )
    projecao_manter_12_meses = round(custo_medio_mensal * 12, 2)

    custo_anualizado_substituir = (
        round(valor_equipamento_novo / vida_util_estimada_anos, 2)
        if vida_util_estimada_anos > 0
        else None
    )

    # % do valor de aquisição original já consumido em manutenção total (considerando TODAS as OS com custo, não só o período recente)
    todas_ordens_com_custo = (
        db.query(OrdemServico)
        .filter(
            OrdemServico.equipamento_id == equipamento_id,
            OrdemServico.custo.isnot(None),
        )
        .all()
    )
    custo_total_historico = sum(float(os.custo) for os in todas_ordens_com_custo)

    percentual_do_valor_original: Optional[float] = None
    if equipamento and equipamento.valor_aquisicao:
        percentual_do_valor_original = round(
            (custo_total_historico / float(equipamento.valor_aquisicao)) * 100, 1
        )

    recomendacao = "dados_insuficientes"
    if custo_anualizado_substituir is not None and ordens_periodo:
        if projecao_manter_12_meses > custo_anualizado_substituir:
            recomendacao = "substituir"
        else:
            recomendacao = "manter"

    return {
        "equipamento_id": equipamento_id,
        "meses_analisados": meses_historico,
        "quantidade_os_no_periodo": len(ordens_periodo),
        "custo_total_periodo": round(custo_total_periodo, 2),
        "custo_medio_mensal": custo_medio_mensal,
        "projecao_manter_12_meses": projecao_manter_12_meses,
        "custo_anualizado_substituir": custo_anualizado_substituir,
        "custo_total_historico_manutencao": round(custo_total_historico, 2),
        "percentual_do_valor_original_gasto": percentual_do_valor_original,
        "recomendacao": recomendacao,
    }
