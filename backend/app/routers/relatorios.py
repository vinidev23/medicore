from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import relatorio as relatorio_service
from app.services.auth import obter_usuario_atual

router = APIRouter(
    prefix="/relatorios",
    tags=["Relatórios"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.get("/parque-tecnologico")
def relatorio_parque_tecnologico(db: Session = Depends(get_db)):
    pdf_buffer = relatorio_service.gerar_relatorio_pdf(db)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=relatorio-parque-tecnologico.pdf"
        },
    )
