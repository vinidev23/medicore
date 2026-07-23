import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import equipamento, ordem_servico, auth, relatorios

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

app.include_router(auth.router)
app.include_router(equipamento.router)
app.include_router(ordem_servico.router)
app.include_router(relatorios.router)


@app.get("/")
def raiz():
    return {"status": "ok", "mensagem": "API MediCore rodando"}
