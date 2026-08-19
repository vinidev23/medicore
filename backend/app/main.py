import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import equipamento, ordem_servico, auth, relatorios, emprestimo, calibracao

logger = logging.getLogger("medicore")

app = FastAPI(
    title="MediCore - Engenharia Clínica",
    description="API de gestão de parque tecnológico e indicadores de manutenção",
    version="0.1.0",
)

origens_extras = os.getenv("FRONTEND_URL", "")
origens_permitidas = ["http://localhost:5173", "http://127.0.0.1:5173"]
if origens_extras:
    origens_permitidas += [origem.strip() for origem in origens_extras.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sem isso, uma exceção não tratada (500) é respondida pelo ServerErrorMiddleware
# do Starlette, que fica FORA do CORSMiddleware — a resposta sai sem os headers
# de CORS e o navegador reporta "bloqueado por política de CORS" (ou "erro 0"),
# escondendo o erro real. Registrando o handler aqui, a resposta de erro passa
# pelo CORSMiddleware normalmente e o front recebe o JSON com a causa real.
@app.exception_handler(Exception)
async def tratar_excecao_nao_prevista(request: Request, exc: Exception):
    logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno no servidor. Tente novamente em instantes."},
    )


app.include_router(auth.router)
app.include_router(equipamento.router)
app.include_router(ordem_servico.router)
app.include_router(relatorios.router)
app.include_router(emprestimo.router)
app.include_router(calibracao.router)


@app.get("/")
def raiz():
    return {"status": "ok", "mensagem": "API MediCore rodando"}
