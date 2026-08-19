import io
from datetime import datetime

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

from app.models.calibracao import CalibracaoEquipamento, ResultadoCalibracaoEnum

COR_TEAL = colors.HexColor("#0e7c7b")
COR_INK = colors.HexColor("#14232b")
COR_INK_MUTED = colors.HexColor("#55707a")
COR_LINHA = colors.HexColor("#d3deda")
COR_FUNDO_TABELA = colors.HexColor("#eef2f1")
COR_VERDE = colors.HexColor("#1f7a4d")
COR_VERMELHO = colors.HexColor("#a83c46")
COR_AMBAR = colors.HexColor("#b8792e")

RESULTADO_LABELS = {
    ResultadoCalibracaoEnum.APROVADO: "Aprovado",
    ResultadoCalibracaoEnum.REPROVADO: "Reprovado",
    ResultadoCalibracaoEnum.AJUSTADO: "Ajustado",
}

RESULTADO_CORES_HEX = {
    ResultadoCalibracaoEnum.APROVADO: "#1f7a4d",
    ResultadoCalibracaoEnum.REPROVADO: "#a83c46",
    ResultadoCalibracaoEnum.AJUSTADO: "#b8792e",
}


def _estilos():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="TituloRelatorioCal",
            fontSize=18,
            textColor=COR_INK,
            spaceAfter=2,
            fontName="Helvetica-Bold",
        )
    )
    base.add(
        ParagraphStyle(
            name="SubtituloCal",
            fontSize=10,
            textColor=COR_INK_MUTED,
            spaceAfter=16,
        )
    )
    base.add(
        ParagraphStyle(
            name="SecaoTituloCal",
            fontSize=13,
            textColor=COR_TEAL,
            spaceBefore=18,
            spaceAfter=8,
            fontName="Helvetica-Bold",
        )
    )
    base.add(
        ParagraphStyle(
            name="ResultadoDestaque",
            fontSize=14,
            fontName="Helvetica-Bold",
            spaceBefore=10,
            spaceAfter=4,
        )
    )
    return base


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


def gerar_relatorio_calibracao_pdf(calibracao: CalibracaoEquipamento) -> io.BytesIO:
    equipamento = calibracao.equipamento
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
    conteudo.append(Paragraph("MediCore — Relatório de Calibração", estilos["TituloRelatorioCal"]))
    conteudo.append(
        Paragraph(
            f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')} · Certificado nº "
            f"{calibracao.certificado_numero or '—'}",
            estilos["SubtituloCal"],
        )
    )

    # Dados do equipamento
    conteudo.append(Paragraph("Equipamento", estilos["SecaoTituloCal"]))
    dados_equipamento = [
        ["Nome", equipamento.nome if equipamento else "—"],
        ["Patrimônio", equipamento.numero_patrimonio if equipamento else "—"],
        ["Fabricante / Modelo", f"{equipamento.fabricante or '—'} / {equipamento.modelo or '—'}" if equipamento else "—"],
        ["Setor", equipamento.setor if equipamento else "—"],
    ]
    tabela_equipamento = Table(dados_equipamento, colWidths=[5 * cm, 8 * cm])
    tabela_equipamento.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (-1, -1), COR_INK),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, COR_LINHA),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ]
        )
    )
    conteudo.append(tabela_equipamento)

    # Dados da calibração
    conteudo.append(Paragraph("Dados da Calibração", estilos["SecaoTituloCal"]))
    dados_calibracao = [
        ["Data da calibração", calibracao.data_calibracao.strftime("%d/%m/%Y")],
        ["Técnico responsável", calibracao.tecnico_responsavel],
        ["Instrumento/padrão utilizado", calibracao.instrumento_padrao or "—"],
        [
            "Próxima calibração",
            calibracao.proxima_calibracao.strftime("%d/%m/%Y")
            if calibracao.proxima_calibracao
            else "—",
        ],
    ]
    tabela_calibracao = Table(dados_calibracao, colWidths=[5 * cm, 8 * cm])
    tabela_calibracao.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (-1, -1), COR_INK),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, COR_LINHA),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ]
        )
    )
    conteudo.append(tabela_calibracao)

    # Parâmetros medidos
    conteudo.append(Paragraph("Parâmetros Medidos", estilos["SecaoTituloCal"]))
    linhas_parametros = [
        ["Grandeza", "Unid.", "Referência", "Medido", "Erro", "Tolerância", "Resultado"]
    ]
    for parametro in calibracao.parametros:
        erro_valor = float(parametro.erro)
        valor_referencia = float(parametro.valor_referencia)
        valor_medido = float(parametro.valor_medido)
        tolerancia_maxima = float(parametro.tolerancia_maxima)
        erro_formatado = f"+{erro_valor:g}" if erro_valor > 0 else f"{erro_valor:g}"
        linhas_parametros.append(
            [
                parametro.grandeza,
                parametro.unidade or "—",
                f"{valor_referencia:g}",
                f"{valor_medido:g}",
                erro_formatado,
                f"±{tolerancia_maxima:g}",
                "Conforme" if parametro.dentro_tolerancia else "Não conforme",
            ]
        )

    tabela_parametros = Table(
        linhas_parametros,
        colWidths=[3.2 * cm, 1.6 * cm, 2 * cm, 2 * cm, 1.7 * cm, 2 * cm, 2.5 * cm],
    )
    estilo_parametros = _estilo_tabela_padrao()
    tabela_parametros.setStyle(estilo_parametros)

    # Destaca em vermelho as linhas fora da tolerância
    for indice, parametro in enumerate(calibracao.parametros, start=1):
        if not parametro.dentro_tolerancia:
            tabela_parametros.setStyle(
                TableStyle(
                    [("TEXTCOLOR", (6, indice), (6, indice), COR_VERMELHO)]
                )
            )
    conteudo.append(tabela_parametros)

    # Resultado geral
    conteudo.append(
        Paragraph(
            f'Resultado geral: <font color="{RESULTADO_CORES_HEX[calibracao.resultado_geral]}">'
            f"{RESULTADO_LABELS[calibracao.resultado_geral]}</font>",
            estilos["ResultadoDestaque"],
        )
    )

    if calibracao.observacoes:
        conteudo.append(Paragraph("Observações", estilos["SecaoTituloCal"]))
        conteudo.append(Paragraph(calibracao.observacoes, estilos["Normal"]))

    conteudo.append(Spacer(1, 30))
    conteudo.append(Paragraph("_" * 40, estilos["Normal"]))
    conteudo.append(Paragraph(calibracao.tecnico_responsavel, estilos["Normal"]))
    conteudo.append(Paragraph("Técnico responsável pela calibração", estilos["SubtituloCal"]))

    conteudo.append(Spacer(1, 10))
    conteudo.append(
        Paragraph(
            "Relatório gerado automaticamente pelo sistema MediCore a partir dos "
            "parâmetros registrados para esta calibração.",
            estilos["SubtituloCal"],
        )
    )

    documento.build(conteudo)
    buffer.seek(0)
    return buffer
