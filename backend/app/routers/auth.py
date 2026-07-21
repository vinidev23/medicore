from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioRead, Token
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registrar", response_model=UsuarioRead, status_code=201)
def registrar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if existente:
        raise HTTPException(status_code=409, detail="Já existe um usuário com este e-mail")

    novo_usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=auth_service.gerar_hash_senha(dados.senha),
        papel=dados.papel,
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    usuario = auth_service.autenticar_usuario(db, form_data.username, form_data.password)
    if not usuario:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    token_acesso = auth_service.criar_token_acesso(dados={"sub": usuario.email})
    return {"access_token": token_acesso, "token_type": "bearer", "usuario": usuario}


@router.get("/eu", response_model=UsuarioRead)
def obter_meus_dados(usuario_atual: Usuario = Depends(auth_service.obter_usuario_atual)):
    return usuario_atual
