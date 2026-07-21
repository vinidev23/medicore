from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.equipamento import Equipamento
from app.schemas.equipamento import EquipamentoCreate, EquipamentoUpdate, EquipamentoRead
from app.schemas.simulacao import SimulacaoInput, SimulacaoResultado
from app.services import indicadores as indicadores_service
from app.services import simulador as simulador_service
from app.services.auth import obter_usuario_atual

router = APIRouter(
    prefix="/equipamentos",
    tags=["Equipamentos"],
    dependencies=[Depends(obter_usuario_atual)],  # protege TODAS as rotas deste router
)


@router.get("", response_model=list[EquipamentoRead])
def listar_equipamentos(db: Session = Depends(get_db)):
    return db.query(Equipamento).all()


@router.get("/{equipamento_id}", response_model=EquipamentoRead)
def obter_equipamento(equipamento_id: int, db: Session = Depends(get_db)):
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    return equipamento


@router.post("", response_model=EquipamentoRead, status_code=201)
def criar_equipamento(dados: EquipamentoCreate, db: Session = Depends(get_db)):
    # Verifica duplicidade de patrimônio ANTES de tentar salvar, para dar uma mensagem de erro clara em vez de um erro genérico do banco
    existente = (
        db.query(Equipamento)
        .filter(Equipamento.numero_patrimonio == dados.numero_patrimonio)
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=409,
            detail=f"Já existe um equipamento com o patrimônio {dados.numero_patrimonio}",
        )

    novo_equipamento = Equipamento(**dados.model_dump())
    db.add(novo_equipamento)
    db.commit()
    db.refresh(novo_equipamento)  # recarrega o objeto com o "id" gerado pelo banco
    return novo_equipamento


@router.patch("/{equipamento_id}", response_model=EquipamentoRead)
def atualizar_equipamento(
    equipamento_id: int, dados: EquipamentoUpdate, db: Session = Depends(get_db)
):
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")

    dados_para_atualizar = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_para_atualizar.items():
        setattr(equipamento, campo, valor)

    db.commit()
    db.refresh(equipamento)
    return equipamento


@router.delete("/{equipamento_id}", status_code=204)
def remover_equipamento(equipamento_id: int, db: Session = Depends(get_db)):
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    db.delete(equipamento)
    db.commit()


@router.get("/{equipamento_id}/indicadores")
def obter_indicadores(equipamento_id: int, db: Session = Depends(get_db)):
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    return indicadores_service.obter_indicadores_equipamento(db, equipamento_id)


@router.post("/{equipamento_id}/simulacao", response_model=SimulacaoResultado)
def simular_troca_vs_manutencao(
    equipamento_id: int, dados: SimulacaoInput, db: Session = Depends(get_db)
):
    equipamento = db.get(Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")

    return simulador_service.calcular_simulacao(
        db=db,
        equipamento_id=equipamento_id,
        valor_equipamento_novo=dados.valor_equipamento_novo,
        vida_util_estimada_anos=dados.vida_util_estimada_anos,
        meses_historico=dados.meses_historico,
    )
