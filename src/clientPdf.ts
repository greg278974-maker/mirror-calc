import { jsPDF } from 'jspdf';
import RobotoRegularUrl from './assets/fonts/Roboto-Regular.ttf?url';
import RobotoBoldUrl from './assets/fonts/Roboto-Bold.ttf?url';
import { fmtMoney } from './format';
import type { ClientQuote } from './clientQuote';

export interface ClientInfo {
  name: string;
  phone: string;
}

function bufToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// Fetch + base64-encode each font once; reused across exports.
let fontsPromise: Promise<{ regular: string; bold: string }> | undefined;
function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch(RobotoRegularUrl).then(r => r.arrayBuffer()),
      fetch(RobotoBoldUrl).then(r => r.arrayBuffer()),
    ]).then(([reg, bold]) => ({ regular: bufToBase64(reg), bold: bufToBase64(bold) }));
  }
  return fontsPromise;
}

async function registerFonts(doc: jsPDF) {
  const { regular, bold } = await loadFonts();
  doc.addFileToVFS('Roboto-Regular.ttf', regular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
}

// Rasterize the live diagram SVG to a PNG data URL at print resolution.
function svgToPng(svg: SVGSVGElement, scale = 3): Promise<{ url: string; w: number; h: number }> {
  const vb = svg.viewBox.baseVal;
  const w = (vb && vb.width) || svg.clientWidth || 600;
  const h = (vb && vb.height) || svg.clientHeight || 600;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no 2d context'));
      ctx.fillStyle = '#1a1314';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ url: canvas.toDataURL('image/png'), w, h });
    };
    img.onerror = () => reject(new Error('svg rasterization failed'));
    img.src = svgUrl;
  });
}

export async function exportClientPdf(
  quote: ClientQuote,
  svg: SVGSVGElement | null,
  client: ClientInfo,
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await registerFonts(doc);
  doc.setFont('Roboto', 'normal');

  const W = 210;
  const M = 18;
  const right = W - M;
  let y = M;

  const dateStr = new Date().toLocaleDateString('ru-RU');

  // Title
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Расчёт стоимости зеркала', M, y);
  y += 7;

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Дата: ${dateStr}`, M, y);
  y += 8;

  // Client block
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  if (client.name.trim()) { doc.text(`Клиент: ${client.name.trim()}`, M, y); y += 6; }
  if (client.phone.trim()) { doc.text(`Телефон: ${client.phone.trim()}`, M, y); y += 6; }
  y += 2;

  // Specs
  doc.setDrawColor(220, 220, 220);
  doc.line(M, y, right, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(`Внешний размер: ${quote.outerSize}`, M, y);
  doc.text(`Зеркало: ${quote.mirrorSize}`, right, y, { align: 'right' });
  y += 9;

  // Materials table
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(140, 140, 140);
  doc.text('МАТЕРИАЛЫ', M, y);
  doc.text('ЦЕНА', right, y, { align: 'right' });
  y += 2.5;
  doc.setDrawColor(220, 220, 220);
  doc.line(M, y, right, y);
  y += 6;

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  for (const line of quote.lines) {
    doc.text(line.name, M, y);
    doc.text(fmtMoney(line.amount), right, y, { align: 'right' });
    y += 6.5;
  }

  // Totals
  y += 1;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, right, y);
  y += 7;

  const totalLine = (label: string, value: number, bold = false, size = 11) => {
    doc.setFont('Roboto', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(bold ? 30 : 70, bold ? 30 : 70, bold ? 30 : 70);
    doc.text(label, M, y);
    doc.text(fmtMoney(value), right, y, { align: 'right' });
    y += bold ? 8 : 6.5;
  };

  totalLine('Изделие', quote.productClient);
  if (quote.delivery > 0) totalLine('Доставка', quote.delivery);
  if (quote.montage > 0) totalLine('Монтаж', quote.montage);
  totalLine('Итого', quote.total, true, 12);

  y += 1;
  doc.setFillColor(44, 33, 34);
  doc.roundedRect(M, y, right - M, 13, 2, 2, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(245, 236, 233);
  doc.text('К оплате', M + 4, y + 8.5);
  doc.text(fmtMoney(quote.totalRounded), right - 4, y + 8.5, { align: 'right' });
  y += 13 + 10;

  // Diagram
  if (svg) {
    try {
      const png = await svgToPng(svg);
      const maxW = right - M;
      const maxH = 297 - M - y; // remaining space to bottom margin
      const ratio = png.h / png.w;
      let drawW = maxW;
      let drawH = drawW * ratio;
      if (drawH > maxH) { drawH = maxH; drawW = drawH / ratio; }
      const x = M + (maxW - drawW) / 2;
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      doc.text('СХЕМА ИЗДЕЛИЯ', M, y);
      y += 4;
      doc.addImage(png.url, 'PNG', x, y, drawW, drawH);
    } catch {
      // diagram is optional — skip silently if rasterization fails
    }
  }

  const safeName = client.name.trim().replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim() || 'зеркало';
  doc.save(`Смета_${safeName}.pdf`);
}
