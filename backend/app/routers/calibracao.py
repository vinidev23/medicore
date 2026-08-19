from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.equipamento import Equipamento
from app.models.calibracao import (
    CalibracaoEquipamento,
    CalibracaoParametro,
    ResultadoCalibracaoEnum,
)
from app.schemas.calibracao import CalibracaoCreate, CalibracaoRead
from app.services.auth import obter_usuario_atual
from app.services import relatorio_calibracao as relatorio_calibracao_service

router = APIRouter(
    prefix="/calibracoes",
    tags=["Calibrações"],
    dependencies=[Depends(obter_usuario_atual)],
)


def _com_parametros(query):
    return query.options(joinedload(CalibracaoEquipamento.parametros))


@router.get("", response_model=list[CalibracaoRead])
def listar_calibracoes(
    equipamento_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = _com_parametros(db.query(CalibracaoEquipamento))
    if equipamento_id is not None:
        query = query.filter(CalibracaoEquipamento.equipamento_id == equipamento_id)

    return (
        query.order_by(CalibracaoEquipamento.data_calibracao.desc())
        .distinct()
        .all()
    )


@router.get("/{calibracao_id}", response_model=CalibracaoRead)
def obter_calibracao(calibracao_id: int, db: Session = Depends(get_db)):
    calibracao = _com_parametros(
        db.query(CalibracaoEquipamento).filter(CalibracaoEquipamento.id == calibracao_id)
    ).first()
    if not calibracao:
        raise HTTPException(status_code=404, detail="Calibração não encontrada")
    return calibracao


@router.post("", response_model=CalibracaoRead, status_code=201)
def registrar_calibracao(dados: CalibracaoCreate, db: Session = Depends(get_db)):
    equipamento = db.get(Equipamento, dados.equipamento_id)
    if not equipamento:
        raise HTTPException(
            status_code=404,
            detail=f"Equipamento com id {dados.equipamento_id} não encontrado",
        )

    nova_calibracao = CalibracaoEquipamento(
        equipamento_id=dados.equipamento_id,
        data_calibracao=dados.data_calibracao,
        tecnico_responsavel=dados.tecnico_responsavel,
        instrumento_padrao=dados.instrumento_padrao,
        certificado_numero=dados.certificado_numero,
        proxima_calibracao=dados.proxima_calibracao,
        observacoes=dados.observacoes,
    )

    todos_dentro_da_tolerancia = True
    for parametro in dados.parametros:
        erro = round(parametro.valor_medido - parametro.valor_referencia, 4)
        dentro_tolerancia = abs(erro) <= parametro.tolerancia_maxima
        if not dentro_tolerancia:
            todos_dentro_da_tolerancia = False

        nova_calibracao.parametros.append(
            CalibracaoParametro(
                grandeza=parametro.grandeza,
                unidade=parametro.unidade,
                valor_referencia=parametro.valor_referencia,
                valor_medido=parametro.valor_medido,
                tolerancia_maxima=parametro.tolerancia_maxima,
                erro=erro,
                dentro_tolerancia=dentro_tolerancia,
            )
        )

    if dados.ajustado:
        nova_calibracao.resultado_geral = ResultadoCalibracaoEnum.AJUSTADO
    elif todos_dentro_da_tolerancia:
        nova_calibracao.resultado_geral = ResultadoCalibracaoEnum.APROVADO
    else:
        nova_calibracao.resultado_geral = ResultadoCalibracaoEnum.REPROVADO

    db.add(nova_calibracao)
    db.commit()
    db.refresh(nova_calibracao)
    return nova_calibracao


@router.delete("/{calibracao_id}", status_code=204)
def remover_calibracao(calibracao_id: int, db: Session = Depends(get_db)):
    calibracao = db.get(CalibracaoEquipamento, calibracao_id)
    if not calibracao:
        raise HTTPException(status_code=404, detail="Calibração não encontrada")
    db.delete(calibracao)
    db.commit()


@router.get("/{calibracao_id}/relatorio")
def relatorio_calibracao(calibracao_id: int, db: Session = Depends(get_db)):
    calibracao = _com_parametros(
        db.query(CalibracaoEquipamento).filter(CalibracaoEquipamento.id == calibracao_id)
    ).first()
    if not calibracao:
        raise HTTPException(status_code=404, detail="Calibração não encontrada")

    pdf_buffer = relatorio_calibracao_service.gerar_relatorio_calibracao_pdf(calibracao)
    conteudo_pdf = pdf_buffer.getvalue()

    return Response(
        content=conteudo_pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=relatorio-calibracao-{calibracao_id}.pdf",
            "Content-Length": str(len(conteudo_pdf)),
        },
    )
