from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.equipamento import CriticidadeEnum


class EquipamentoBase(BaseModel):
    nome: str
    numero_patrimonio: str
    fabricante: Optional[str] = None
    modelo: Optional[str] = None
    setor: str
    criticidade: CriticidadeEnum = CriticidadeEnum.MEDIA
    data_aquisicao: Optional[date] = None
    valor_aquisicao: Optional[float] = None


class EquipamentoCreate(EquipamentoBase):
    pass


class EquipamentoUpdate(BaseModel):
    nome: Optional[str] = None
    numero_patrimonio: Optional[str] = None
    fabricante: Optional[str] = None
    modelo: Optional[str] = None
    setor: Optional[str] = None
    criticidade: Optional[CriticidadeEnum] = None
    data_aquisicao: Optional[date] = None
    valor_aquisicao: Optional[float] = None


class EquipamentoRead(EquipamentoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
