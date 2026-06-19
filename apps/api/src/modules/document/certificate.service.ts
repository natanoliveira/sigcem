import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface CertificateData {
  municipio: string;
  falecidoNome: string;
  falecidoNascimento: Date;
  falecidoFalecimento: Date;
  naturalidade?: string | null;
  nomePai?: string | null;
  nomeMae?: string | null;
  tipoOperacao: 'INUMACAO' | 'EXUMACAO' | 'TRANSLADO';
  dataEvento: Date;
  jazigoCodigo: string;
  quadraCodigo: string;
  cemiterioNome: string;
  autorizadoPor: string;
  funeraria?: string | null;
  emitidoPorNome: string;
  numeroRegistro: string;
}

@Injectable()
export class CertificateService {
  async generate(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const TITLE_COLOR = '#1e3a5f';
      const LINE_COLOR = '#c0c8d4';
      const TEXT_COLOR = '#1a1a2e';
      const MUTED_COLOR = '#6b7280';

      const formatDate = (d: Date) =>
        new Date(d).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric',
        });

      const tipoLabel: Record<string, string> = {
        INUMACAO: 'Inumação',
        EXUMACAO: 'Exumação',
        TRANSLADO: 'Translado',
      };

      // ── Cabeçalho ──────────────────────────────────────────────────────────
      doc
        .fillColor(TITLE_COLOR)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('PREFEITURA MUNICIPAL', { align: 'center' });

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor(MUTED_COLOR)
        .text(data.municipio.toUpperCase(), { align: 'center' });

      doc.moveDown(0.5);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor(LINE_COLOR).lineWidth(1).stroke();
      doc.moveDown(0.5);

      // ── Título ─────────────────────────────────────────────────────────────
      doc
        .fillColor(TITLE_COLOR)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`CERTIDÃO DE ${tipoLabel[data.tipoOperacao].toUpperCase()}`, { align: 'center' });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(MUTED_COLOR)
        .text(`Registro nº ${data.numeroRegistro}`, { align: 'center' });

      doc.moveDown(1);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor(LINE_COLOR).stroke();
      doc.moveDown(1);

      // ── Corpo ──────────────────────────────────────────────────────────────
      doc
        .fillColor(TEXT_COLOR)
        .fontSize(11)
        .font('Helvetica')
        .text(
          `Certificamos que, conforme registros desta municipalidade, foi realizada a ` +
          `${tipoLabel[data.tipoOperacao].toLowerCase()} de:`,
          { align: 'justify' },
        );

      doc.moveDown(1);

      // Dados do falecido
      section(doc, 'DADOS DO FALECIDO', TITLE_COLOR, LINE_COLOR);
      field(doc, 'Nome completo', data.falecidoNome, TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Data de nascimento', formatDate(data.falecidoNascimento), TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Data de falecimento', formatDate(data.falecidoFalecimento), TEXT_COLOR, MUTED_COLOR);
      if (data.naturalidade) field(doc, 'Naturalidade', data.naturalidade, TEXT_COLOR, MUTED_COLOR);
      if (data.nomePai) field(doc, 'Filiação (pai)', data.nomePai, TEXT_COLOR, MUTED_COLOR);
      if (data.nomeMae) field(doc, 'Filiação (mãe)', data.nomeMae, TEXT_COLOR, MUTED_COLOR);

      doc.moveDown(0.5);
      section(doc, 'DADOS DA OPERAÇÃO', TITLE_COLOR, LINE_COLOR);
      field(doc, 'Tipo', tipoLabel[data.tipoOperacao], TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Data do evento', formatDate(data.dataEvento), TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Cemitério', data.cemiterioNome, TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Quadra / Jazigo', `Quadra ${data.quadraCodigo} — Jazigo ${data.jazigoCodigo}`, TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Autorizado por', data.autorizadoPor, TEXT_COLOR, MUTED_COLOR);
      if (data.funeraria) field(doc, 'Funerária', data.funeraria, TEXT_COLOR, MUTED_COLOR);

      doc.moveDown(1.5);

      // Rodapé / assinatura
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor(LINE_COLOR).stroke();
      doc.moveDown(0.5);

      doc
        .fontSize(9)
        .fillColor(MUTED_COLOR)
        .text(
          `Documento emitido em ${formatDate(new Date())} por ${data.emitidoPorNome} ` +
          `através do Sistema de Gestão de Cemitérios — SIGCEM.`,
          { align: 'center' },
        );

      doc.moveDown(2);
      doc
        .moveTo(180, doc.y)
        .lineTo(415, doc.y)
        .strokeColor('#1e3a5f')
        .lineWidth(0.5)
        .stroke();

      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .fillColor(TEXT_COLOR)
        .font('Helvetica-Bold')
        .text(data.emitidoPorNome, { align: 'center' });
      doc
        .font('Helvetica')
        .fillColor(MUTED_COLOR)
        .text('Responsável pela emissão', { align: 'center' });

      doc.end();
    });
  }
}

function section(doc: PDFKit.PDFDocument, title: string, color: string, lineColor: string) {
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(color)
    .text(title);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor(lineColor).lineWidth(0.5).stroke();
  doc.moveDown(0.3);
}

function field(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  textColor: string,
  mutedColor: string,
) {
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(mutedColor)
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .fillColor(textColor)
    .text(value);
}
