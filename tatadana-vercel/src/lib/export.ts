import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Transaction } from './types';
import { formatRupiah, formatTanggalWIB } from './formatters';

/**
 * Generate Excel (.xlsx) workbook for user transactions
 * Compatible with Node.js API routes and direct browser generation
 */
export function generateExcelReport(
  transactions: Transaction[],
  userName: string = 'Pengguna TataDana',
  startDate: string = '2026-10-01',
  endDate: string = '2026-10-31'
): Uint8Array {
  // Format data for sheet
  const rows = transactions.map((t, idx) => {
    const wib = formatTanggalWIB(t.transaction_time);
    return {
      No: idx + 1,
      Tanggal: `${wib.tanggal} ${wib.jam}`,
      Tipe: t.type === 'expense' ? 'Pengeluaran' : t.type === 'income' ? 'Pemasukan' : 'Transfer',
      Kategori: t.category?.name || 'Umum',
      Dompet: t.wallet?.name || 'Default',
      'Nominal (IDR)': t.amount,
      Catatan: t.notes || '-',
      Sumber: t.source === 'telegram_text' ? 'Telegram (Text)' :
              t.source === 'telegram_ocr' ? 'Telegram (OCR Struk)' :
              t.source === 'telegram_voice' ? 'Telegram (Voice)' : 'Web App',
      'Rincian OCR Struk': t.is_ocr && t.ocr_items?.length
        ? t.ocr_items.map(item => `${item.name} (${formatRupiah(item.price)})`).join('; ')
        : '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Transaksi');

  // Add Metadata / Ringkasan Sheet
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  const summaryData = [
    { Label: 'Aplikasi', Value: 'TataDana - Fintech SaaS Indonesia' },
    { Label: 'Nama Pengguna', Value: userName },
    { Label: 'Periode Laporan', Value: `${startDate} s/d ${endDate}` },
    { Label: 'Zona Waktu', Value: 'Asia/Jakarta (WIB, UTC+7)' },
    { Label: 'Total Transaksi', Value: transactions.length },
    { Label: 'Total Pemasukan', Value: formatRupiah(totalIncome) },
    { Label: 'Total Pengeluaran', Value: formatRupiah(totalExpense) },
    { Label: 'Arus Kas Bersih (Net Cashflow)', Value: formatRupiah(netCashflow) },
    { Label: 'Tanggal Unduh', Value: formatTanggalWIB().fullFormatted },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

  // Use 'array' type for universal Node.js and Browser binary compatibility
  const buf = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

/**
 * Generate PDF report for user transactions
 * Compatible with Node.js API routes and direct browser generation
 */
export function generatePdfReport(
  transactions: Transaction[],
  userName: string = 'Pengguna TataDana',
  startDate: string = '2026-10-01',
  endDate: string = '2026-10-31'
): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header & Branding (TataDana Orange #ea580c)
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TATADANA', 14, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Keuangan Eksekutif & Riwayat Mutasi Transaksi (WIB)', 14, 20);

  // Metadata Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nama: ${userName}`, 14, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 39);
  doc.text(`Dibuat pada: ${formatTanggalWIB().fullFormatted}`, 14, 44);

  // Executive Summary Box
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  // Background Box
  doc.setFillColor(254, 243, 199); // Light Amber
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, 48, 182, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`Pemasukan: ${formatRupiah(totalIncome)}`, 18, 56.5);

  doc.setTextColor(225, 29, 72); // Rose
  doc.text(`Pengeluaran: ${formatRupiah(totalExpense)}`, 80, 56.5);

  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(`Net Cashflow: ${formatRupiah(netCashflow)}`, 142, 56.5);

  // Transactions Table
  const tableData = transactions.map((t, idx) => {
    const wib = formatTanggalWIB(t.transaction_time);
    let noteText = t.notes || '-';
    if (t.is_ocr && t.ocr_items?.length) {
      noteText += ` [Struk: ${t.ocr_items.length} item]`;
    }
    return [
      idx + 1,
      `${wib.tanggal}\n${wib.jam}`,
      t.type === 'expense' ? 'Pengeluaran' : t.type === 'income' ? 'Pemasukan' : 'Transfer',
      t.category?.name || 'Umum',
      t.wallet?.name || 'Default',
      formatRupiah(t.amount),
      noteText,
    ];
  });

  (doc as any).autoTable({
    startY: 66,
    head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Nominal', 'Catatan / Deskripsi']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 24 },
      3: { cellWidth: 30 },
      4: { cellWidth: 24 },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 'auto' },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237],
    },
  });

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Trigger client-side direct download of Excel report (.xlsx)
 */
export function downloadExcelFile(
  transactions: Transaction[],
  userName: string = 'Budi Santoso',
  startDate: string = '2026-10-01',
  endDate: string = '2026-10-31',
  filename?: string
): void {
  const bytes = generateExcelReport(transactions, userName, startDate, endDate);
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `TataDana_Laporan_${startDate}_${endDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger client-side direct download of PDF report (.pdf)
 */
export function downloadPdfFile(
  transactions: Transaction[],
  userName: string = 'Budi Santoso',
  startDate: string = '2026-10-01',
  endDate: string = '2026-10-31',
  filename?: string
): void {
  const bytes = generatePdfReport(transactions, userName, startDate, endDate);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `TataDana_Laporan_${startDate}_${endDate}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
