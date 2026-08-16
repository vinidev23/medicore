from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.equipamento import Equipamento
from app.models.emprestimo import EmprestimoInterno, StatusEmprestimoEnum
from app.schemas.emprestimo import (
    EmprestimoCreate,
    EmprestimoDevolucao,
    EmprestimoRead,
)
from app.services.auth import obter_usuario_atual

router = APIRouter(
    prefix="/emprestimos",
    tags=["Empréstimos Internos"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.get("", response_model=list[EmprestimoRead])
def listar_emprestimos(
    equipamento_id: int | None = None,
    status: StatusEmprestimoEnum | None = None,
    apenas_atrasados: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(EmprestimoInterno)
    if equipamento_id is not None:
        query = query.filter(EmprestimoInterno.equipamento_id == equipamento_id)
    if status is not None:
        query = query.filter(EmprestimoInterno.status == status)

    emprestimos = query.order_by(EmprestimoInterno.data_emprestimo.desc()).all()

    if apenas_atrasados:
        agora = datetime.utcnow()
        emprestimos = [
            e
            for e in emprestimos
            if e.status == StatusEmprestimoEnum.EM_ANDAMENTO
            and e.data_prevista_devolucao < agora
        ]

    return emprestimos


@router.get("/alertas", response_model=list[EmprestimoRead])
def listar_alertas_devolucao_pendente(db: Session = Depends(get_db)):
    """Lista os empréstimos em andamento cujo prazo de devolução já venceu."""
    agora = datetime.utcnow()
    emprestimos = (
        db.query(EmprestimoInterno)
        .filter(EmprestimoInterno.status == StatusEmprestimoEnum.EM_ANDAMENTO)
        .filter(EmprestimoInterno.data_prevista_devolucao < agora)
        .order_by(EmprestimoInterno.data_prevista_devolucao.asc())
        .all()
    )
    return emprestimos


@router.get("/{emprestimo_id}", response_model=EmprestimoRead)
def obter_emprestimo(emprestimo_id: int, db: Session = Depends(get_db)):
    emprestimo = db.get(EmprestimoInterno, emprestimo_id)
    if not emprestimo:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")
    return emprestimo


@router.post("", response_model=EmprestimoRead, status_code=201)
def registrar_emprestimo(dados: EmprestimoCreate, db: Session = Depends(get_db)):
    equipamento = db.get(Equipamento, dados.equipamento_id)
    if not equipamento:
        raise HTTPException(
            status_code=404,
            detail=f"Equipamento com id {dados.equipamento_id} não encontrado",
        )

    if equipamento.emprestado_atualmente:
        raise HTTPException(
            status_code=409,
            detail=(
                f"O equipamento '{equipamento.nome}' já está emprestado e "
                "precisa ser devolvido antes de um novo empréstimo."
            ),
        )

    setor_origem = dados.setor_origem or equipamento.localizacao_atual or equipamento.setor
    if setor_origem == dados.setor_destino:
        raise HTTPException(
            status_code=422,
            detail="O setor de destino deve ser diferente do setor de origem",
        )

    novo_emprestimo = EmprestimoInterno(
        equipamento_id=dados.equipamento_id,
        setor_origem=setor_origem,
        setor_destino=dados.setor_destino,
        solicitante=dados.solicitante,
        responsavel_transporte=dados.responsavel_transporte,
        motivo=dados.motivo,
        data_prevista_devolucao=dados.data_prevista_devolucao,
    )
    db.add(novo_emprestimo)

    # Atualiza a localização "ao vivo" do equipamento para refletir a transferência
    equipamento.localizacao_atual = dados.setor_destino
    equipamento.emprestado_atualmente = True

    db.commit()
    db.refresh(novo_emprestimo)
    return novo_emprestimo


@router.patch("/{emprestimo_id}/devolver", response_model=EmprestimoRead)
def devolver_emprestimo(
    emprestimo_id: int, dados: EmprestimoDevolucao, db: Session = Depends(get_db)
):
    emprestimo = db.get(EmprestimoInterno, emprestimo_id)
    if not emprestimo:
        raise HTTPException(status_code=404, detail="Empréstimo não encontrado")

    if emprestimo.status == StatusEmprestimoEnum.DEVOLVIDO:
        raise HTTPException(status_code=409, detail="Este empréstimo já foi devolvido")

    emprestimo.status = StatusEmprestimoEnum.DEVOLVIDO
    emprestimo.data_devolucao = datetime.utcnow()
    emprestimo.observacao_devolucao = dados.observacao_devolucao

    equipamento = db.get(Equipamento, emprestimo.equipamento_id)
    if equipamento:
        equipamento.localizacao_atual = emprestimo.setor_origem
        equipamento.emprestado_atualmente = False

    db.commit()
    db.refresh(emprestimo)
    return emprestimo
