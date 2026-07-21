from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.ordem_servico import TipoOSEnum, StatusOSEnum


class OrdemServicoBase(BaseModel):
    equipamento_id: int
    tipo: TipoOSEnum
    descricao_problema: Optional[str] = None
    tecnico_responsavel: Optional[str] = None
    custo: Optional[float] = None


class OrdemServicoCreate(OrdemServicoBase):
    pass


class OrdemServicoUpdate(BaseModel):
    status: Optional[StatusOSEnum] = None
    descricao_problema: Optional[str] = None
    tecnico_responsavel: Optional[str] = None
    custo: Optional[float] = None


class OrdemServicoRead(OrdemServicoBase):
    id: int
    status: StatusOSEnum
    data_abertura: datetime
    data_conclusao: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
