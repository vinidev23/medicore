from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.equipamento import Equipamento
from app.models.ordem_servico import OrdemServico, StatusOSEnum
from app.schemas.ordem_servico import (
    OrdemServicoCreate,
    OrdemServicoUpdate,
    OrdemServicoRead,
)
from app.services.auth import obter_usuario_atual

router = APIRouter(
    prefix="/ordens-servico",
    tags=["Ordens de Serviço"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.get("", response_model=list[OrdemServicoRead])
def listar_ordens_servico(
    equipamento_id: int | None = None, db: Session = Depends(get_db)
):
    query = db.query(OrdemServico)
    if equipamento_id is not None:
        query = query.filter(OrdemServico.equipamento_id == equipamento_id)
    return query.order_by(OrdemServico.data_abertura.desc()).all()


@router.get("/{os_id}", response_model=OrdemServicoRead)
def obter_ordem_servico(os_id: int, db: Session = Depends(get_db)):
    ordem = db.get(OrdemServico, os_id)
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    return ordem


@router.post("", response_model=OrdemServicoRead, status_code=201)
def abrir_ordem_servico(dados: OrdemServicoCreate, db: Session = Depends(get_db)):
    # Garante que o equipamento referenciado realmente existe
    equipamento = db.get(Equipamento, dados.equipamento_id)
    if not equipamento:
        raise HTTPException(
            status_code=404,
            detail=f"Equipamento com id {dados.equipamento_id} não encontrado",
        )

    nova_os = OrdemServico(**dados.model_dump())
    db.add(nova_os)
    db.commit()
    db.refresh(nova_os)
    return nova_os


@router.patch("/{os_id}", response_model=OrdemServicoRead)
def atualizar_ordem_servico(
    os_id: int, dados: OrdemServicoUpdate, db: Session = Depends(get_db)
):
    ordem = db.get(OrdemServico, os_id)
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")

    dados_para_atualizar = dados.model_dump(exclude_unset=True)
    
    if (
        dados_para_atualizar.get("status") == StatusOSEnum.CONCLUIDA
        and ordem.data_conclusao is None
    ):
        ordem.data_conclusao = datetime.utcnow()

    for campo, valor in dados_para_atualizar.items():
        setattr(ordem, campo, valor)

    db.commit()
    db.refresh(ordem)
    return ordem
