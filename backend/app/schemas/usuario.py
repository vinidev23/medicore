from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models.usuario import PapelEnum


class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str = Field(min_length=6)
    papel: PapelEnum = PapelEnum.TECNICO


class UsuarioRead(BaseModel):
    id: int
    nome: str
    email: EmailStr
    papel: PapelEnum
    ativo: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioRead
