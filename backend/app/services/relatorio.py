import io
from datetime import datetime
from collections import Counter

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.models.equipamento import Equipamento
from app.models.ordem_servico import OrdemServico, TipoOSEnum, StatusOSEnum
from app.services import indicadores as indicadores_service

COR_TEAL = colors.HexColor("#0e7c7b")
COR_INK = colors.HexColor("#14232b")
COR_INK_MUTED = colors.HexColor("#55707a")
COR_LINHA = colors.HexColor("#d3deda")
COR_FUNDO_TABELA = colors.HexColor("#eef2f1")

STATUS_LABELS = {
    "aberta": "Aberta",
    "em_andamento": "Em andamento",
    "concluida": "Concluída",
    "cancelada": "Cancelada",
}

CRITICIDADE_LABELS = {
    "suporte_vida": "Suporte à vida",
    "alta": "Alta",
    "media": "Média",
    "baixa": "Baixa",
}


def _estilos():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="TituloRelatorio",
            fontSize=18,
            textColor=COR_INK,
            spaceAfter=2,
            fontName="Helvetica-Bold",
        )
    )
    base.add(
        ParagraphStyle(
            name="Subtitulo",
            fontSize=10,
            textColor=COR_INK_MUTED,
            spaceAfter=16,
        )
    )
    base.add(
        ParagraphStyle(
            name="SecaoTitulo",
            fontSize=13,
            textColor=COR_TEAL,
            spaceBefore=18,
            spaceAfter=8,
            fontName="Helvetica-Bold",
        )
    )
    return base


def gerar_relatorio_pdf(db: Session) -> io.BytesIO:
    equipamentos = db.query(Equipamento).all()
    ordens = db.query(OrdemServico).all()
    estilos = _estilos()

    buffer = io.BytesIO()
    documento = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )

    conteudo = []

    # Cabeçalho
    conteudo.append(Paragraph("MediCore — Relatório de Parque Tecnológico", estilos["TituloRelatorio"]))
    conteudo.append(
        Paragraph(
            f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}",
            estilos["Subtitulo"],
        )
    )

    # Resumo geral
    total_equipamentos = len(equipamentos)
    total_os = len(ordens)
    total_corretivas = sum(1 for os in ordens if os.tipo == TipoOSEnum.CORRETIVA)
    total_abertas = sum(
        1 for os in ordens if os.status in (StatusOSEnum.ABERTA, StatusOSEnum.EM_ANDAMENTO)
    )

    conteudo.append(Paragraph("Resumo Geral", estilos["SecaoTitulo"]))
    dados_resumo = [
        ["Equipamentos cadastrados", str(total_equipamentos)],
        ["Ordens de serviço registradas", str(total_os)],
        ["Ordens de serviço corretivas", str(total_corretivas)],
        ["Ordens de serviço em aberto", str(total_abertas)],
    ]
    tabela_resumo = Table(dados_resumo, colWidths=[9 * cm, 4 * cm])
    tabela_resumo.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (-1, -1), COR_INK),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, COR_LINHA),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
            ]
        )
    )
    conteudo.append(tabela_resumo)

    # Ranking de equipamentos com mais chamados
    contagem_por_equipamento = Counter(os.equipamento_id for os in ordens)
    ranking = contagem_por_equipamento.most_common(10)

    if ranking:
        conteudo.append(Paragraph("Equipamentos com Mais Chamados", estilos["SecaoTitulo"]))
        linhas_ranking = [["Equipamento", "Patrimônio", "Chamados"]]
        mapa_equipamentos = {eq.id: eq for eq in equipamentos}
        for equipamento_id, total in ranking:
            equipamento = mapa_equipamentos.get(equipamento_id)
            nome = equipamento.nome if equipamento else f"#{equipamento_id}"
            patrimonio = equipamento.numero_patrimonio if equipamento else "—"
            linhas_ranking.append([nome, patrimonio, str(total)])

        tabela_ranking = Table(linhas_ranking, colWidths=[8 * cm, 4 * cm, 3 * cm])
        tabela_ranking.setStyle(_estilo_tabela_padrao())
        conteudo.append(tabela_ranking)

    conteudo.append(Paragraph("Equipamentos e Indicadores", estilos["SecaoTitulo"]))
    linhas_equipamentos = [["Equipamento", "Setor", "Criticidade", "MTBF (h)", "MTTR (h)"]]
    for equipamento in equipamentos:
        indicadores = indicadores_service.obter_indicadores_equipamento(db, equipamento.id)
        linhas_equipamentos.append(
            [
                equipamento.nome,
                equipamento.setor,
                CRITICIDADE_LABELS.get(equipamento.criticidade.value, equipamento.criticidade.value),
                str(indicadores["mtbf_horas"]) if indicadores["mtbf_horas"] is not None else "—",
                str(indicadores["mttr_horas"]) if indicadores["mttr_horas"] is not None else "—",
            ]
        )

    if len(linhas_equipamentos) > 1:
        tabela_equipamentos = Table(
            linhas_equipamentos, colWidths=[5.5 * cm, 3.5 * cm, 3 * cm, 2.5 * cm, 2.5 * cm]
        )
        tabela_equipamentos.setStyle(_estilo_tabela_padrao())
        conteudo.append(tabela_equipamentos)
    else:
        conteudo.append(Paragraph("Nenhum equipamento cadastrado ainda.", estilos["Normal"]))

    conteudo.append(Paragraph("Distribuição de Ordens de Serviço por Status", estilos["SecaoTitulo"]))
    contagem_status = Counter(os.status.value for os in ordens)
    if contagem_status:
        linhas_status = [["Status", "Quantidade"]]
        for status, total in contagem_status.items():
            linhas_status.append([STATUS_LABELS.get(status, status), str(total)])
        tabela_status = Table(linhas_status, colWidths=[9 * cm, 4 * cm])
        tabela_status.setStyle(_estilo_tabela_padrao())
        conteudo.append(tabela_status)
    else:
        conteudo.append(Paragraph("Nenhuma ordem de serviço registrada ainda.", estilos["Normal"]))

    conteudo.append(Spacer(1, 20))
    conteudo.append(
        Paragraph(
            "Relatório gerado automaticamente pelo sistema MediCore. "
            "Os indicadores MTBF/MTTR consideram apenas ordens de serviço corretivas concluídas.",
            estilos["Subtitulo"],
        )
    )

    documento.build(conteudo)
    buffer.seek(0)
    return buffer


def _estilo_tabela_padrao() -> TableStyle:
    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), COR_TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, COR_LINHA),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COR_FUNDO_TABELA]),
            ("TEXTCOLOR", (0, 1), (-1, -1), COR_INK),
        ]
    )
