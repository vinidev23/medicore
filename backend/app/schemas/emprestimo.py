from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.emprestimo import StatusEmprestimoEnum


class EmprestimoBase(BaseModel):
    equipamento_id: int
    setor_destino: str
    solicitante: str
    responsavel_transporte: Optional[str] = None
    motivo: Optional[str] = None
    data_prevista_devolucao: datetime


class EmprestimoCreate(EmprestimoBase):
    # setor_origem normalmente é inferido do cadastro do equipamento, mas
    # pode ser informado explicitamente caso o equipamento já esteja fora
    # do setor de lotação original.
    setor_origem: Optional[str] = None

    @model_validator(mode="after")
    def validar_setores_diferentes(self):
        if self.setor_origem and self.setor_origem == self.setor_destino:
            raise ValueError("O setor de destino deve ser diferente do setor de origem")
        return self


class EmprestimoDevolucao(BaseModel):
    observacao_devolucao: Optional[str] = None


class EmprestimoRead(EmprestimoBase):
    id: int
    setor_origem: str
    status: StatusEmprestimoEnum
    data_emprestimo: datetime
    data_devolucao: Optional[datetime] = None
    observacao_devolucao: Optional[str] = None

    # Campo calculado: True quando o empréstimo está em andamento e a data
    # prevista de devolução já passou.
    atrasado: bool = False

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def calcular_atrasado(self):
        if self.status == StatusEmprestimoEnum.EM_ANDAMENTO and self.data_devolucao is None:
            self.atrasado = self.data_prevista_devolucao < datetime.utcnow()
        else:
            self.atrasado = False
        return self
