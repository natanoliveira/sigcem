import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface CertificateData {
  municipio: string;
  deceasedName: string;
  deceasedBirthDate: Date;
  deceasedDeathDate: Date;
  birthPlace?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  operationType: 'INHUMATION' | 'EXHUMATION' | 'TRANSFER';
  eventDate: Date;
  graveCode: string;
  blockCode: string;
  cemeteryName: string;
  authorizedBy: string;
  funeralHome?: string | null;
  issuedByName: string;
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

      const typeLabel: Record<string, string> = {
        INHUMATION: 'Inumação',
        EXHUMATION: 'Exumação',
        TRANSFER: 'Translado',
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
        .text(`CERTIDÃO DE ${typeLabel[data.operationType].toUpperCase()}`, { align: 'center' });

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
          `${typeLabel[data.operationType].toLowerCase()} de:`,
          { align: 'justify' },
        );

      doc.moveDown(1);

      // Dados do falecido
      section(doc, 'DADOS DO FALECIDO', TITLE_COLOR, LINE_COLOR);
      field(doc, 'Nome completo', data.deceasedName, TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Data de nascimento', formatDate(data.deceasedBirthDate), TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Data de falecimento', formatDate(data.deceasedDeathDate), TEXT_COLOR, MUTED_COLOR);
      if (data.birthPlace) field(doc, 'Naturalidade', data.birthPlace, TEXT_COLOR, MUTED_COLOR);
      if (data.fatherName) field(doc, 'Filiação (pai)', data.fatherName, TEXT_COLOR, MUTED_COLOR);
      if (data.motherName) field(doc, 'Filiação (mãe)', data.motherName, TEXT_COLOR, MUTED_COLOR);

      doc.moveDown(0.5);
      section(doc, 'DADOS DA OPERAÇÃO', TITLE_COLOR, LINE_COLOR);
      field(doc, 'Tipo', typeLabel[data.operationType], TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Data do evento', formatDate(data.eventDate), TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Cemitério', data.cemeteryName, TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Quadra / Jazigo', `Quadra ${data.blockCode} — Jazigo ${data.graveCode}`, TEXT_COLOR, MUTED_COLOR);
      field(doc, 'Autorizado por', data.authorizedBy, TEXT_COLOR, MUTED_COLOR);
      if (data.funeralHome) field(doc, 'Funerária', data.funeralHome, TEXT_COLOR, MUTED_COLOR);

      doc.moveDown(1.5);

      // Rodapé / assinatura
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor(LINE_COLOR).stroke();
      doc.moveDown(0.5);

      doc
        .fontSize(9)
        .fillColor(MUTED_COLOR)
        .text(
          `Documento emitido em ${formatDate(new Date())} por ${data.issuedByName} ` +
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
        .text(data.issuedByName, { align: 'center' });
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
