/**
 * TataDana Indonesian Fintech Formatters & Parsers
 * Standard Timezone: Asia/Jakarta (WIB)
 */

/**
 * Format number into standard Indonesian Rupiah string: e.g. "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absVal).replace(/\s+/g, ' ');

  // Standardize "Rp " format
  const normalized = formatted.replace(/^Rp\s*/, 'Rp ');
  return isNegative ? `-${normalized}` : normalized;
}

/**
 * Format date into Asia/Jakarta (WIB) with Indonesian day & month names
 */
export function formatTanggalWIB(dateInput: Date | string | number = new Date()): {
  hari: string;
  tanggal: string;
  jam: string;
  fullFormatted: string;
  shortFormatted: string;
} {
  let d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) {
    d = new Date();
  }
  
  const optionsTz: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
  };

  const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulanListLong = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const bulanListShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const formatter = new Intl.DateTimeFormat('id-ID', {
    ...optionsTz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  let dayName = '';
  let day = '';
  let month = '';
  let year = '';
  let hour = '';
  let minute = '';

  for (const p of parts) {
    if (p.type === 'weekday') dayName = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'year') year = p.value;
    if (p.type === 'hour') hour = p.value;
    if (p.type === 'minute') minute = p.value;
  }

  const hari = dayName || hariList[d.getDay()];
  const tanggal = `${day} ${month} ${year}`;
  const jam = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} WIB`;

  // Find month index for short form
  const monthIdx = bulanListLong.findIndex(m => m.toLowerCase() === month.toLowerCase());
  const shortMonth = monthIdx >= 0 ? bulanListShort[monthIdx] : month;
  const shortTanggal = `${day} ${shortMonth} ${year}`;

  return {
    hari,
    tanggal,
    jam,
    fullFormatted: `📅 ${hari}, ${tanggal} — ${jam}`,
    shortFormatted: `📅 ${hari}, ${shortTanggal} ${jam}`,
  };
}

/**
 * Helper to convert Indonesian words into numeric value
 * Examples: "seratus ribu" -> 100000, "lima puluh ribu" -> 50000
 */
export function parseIndonesianWordsToNumber(text: string): number {
  if (!text) return 0;
  const s = text.toLowerCase().trim();

  // Handle special word "setengah juta" -> 500000
  if (s.includes('setengah juta')) return 500000;
  if (s.includes('setengah ratus ribu') || s.includes('setengah juta')) return 500000;

  const basicWords: { [key: string]: number } = {
    'nol': 0, 'kosong': 0,
    'satu': 1, 'se': 1, 'dua': 2, 'tiga': 3, 'empat': 4,
    'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9,
    'sepuluh': 10, 'sebelas': 11, 'dua belas': 12, 'tiga belas': 13,
    'empat belas': 14, 'lima belas': 15, 'enam belas': 16,
    'tujuh belas': 17, 'delapan belas': 18, 'sembilan belas': 19,
    'seratus': 100, 'seribu': 1000, 'sejuta': 1000000,
  };

  // Find if text contains words like juta / ribu / ratus / puluh
  const hasJuta = /\bjuta\b/.test(s);
  const hasRibu = /\bribu\b/.test(s);

  if (!hasJuta && !hasRibu && !Object.keys(basicWords).some(w => s.includes(w))) {
    return 0;
  }

  // Tokenize
  const words = s.split(/[\s-]+/);
  let total = 0;
  let currentGroup = 0;
  let currentNum = 0;
  let matchedWord = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w === 'juta') {
      const multiplier = (currentGroup + currentNum) || 1;
      total += multiplier * 1000000;
      currentGroup = 0;
      currentNum = 0;
      matchedWord = true;
    } else if (w === 'ribu') {
      const multiplier = (currentGroup + currentNum) || 1;
      total += multiplier * 1000;
      currentGroup = 0;
      currentNum = 0;
      matchedWord = true;
    } else if (w === 'ratus') {
      currentGroup += (currentNum || 1) * 100;
      currentNum = 0;
      matchedWord = true;
    } else if (w === 'puluh') {
      currentGroup += (currentNum || 1) * 10;
      currentNum = 0;
      matchedWord = true;
    } else if (w === 'belas') {
      currentGroup += 10 + currentNum;
      currentNum = 0;
      matchedWord = true;
    } else if (basicWords[w] !== undefined) {
      if (w === 'seratus') {
        currentGroup += 100;
      } else if (w === 'seribu') {
        currentGroup += 1000;
      } else if (w === 'sejuta') {
        total += 1000000;
      } else if (w === 'sepuluh') {
        currentGroup += 10;
      } else if (w.endsWith('belas')) {
        currentGroup += basicWords[w];
      } else {
        currentNum = basicWords[w];
      }
      matchedWord = true;
    }
  }

  total += currentGroup + currentNum;
  return matchedWord && total > 0 ? total : 0;
}

/**
 * Robust parsing of Indonesian casual currency representations:
 * - "15rb" -> 15000
 * - "15ribu" -> 15000
 * - "15k" -> 15000
 * - "1.5jt" / "1,5jt" / "1.5 juta" / "2,5jt" -> 1500000 / 2500000
 * - "500k" -> 500000
 * - "2jt 500rb" -> 2500000
 * - "seratus ribu" -> 100000
 * - "lima puluh ribu" -> 50000
 * - "bensin 35k dari mandiri" -> 35000
 * - "gaji 10jt masuk bca" -> 10000000
 */
export function parseIndonesianCurrency(text: string): number {
  if (!text) return 0;
  const str = text.toLowerCase().trim();

  // 1. Check composite unit regex like "2jt 500rb", "1.5jt", "500k", "25rb", "10jt"
  let total = 0;
  let matchedAbbreviation = false;

  // Regex to extract juta: e.g. 1.5jt, 1,5jt, 2.5jt, 10jt, 2 juta
  const jtRegex = /(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/g;
  let jtMatch: RegExpExecArray | null;
  while ((jtMatch = jtRegex.exec(str)) !== null) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    total += Math.round(val * 1000000);
    matchedAbbreviation = true;
  }

  // Regex to extract ribu / k: e.g. 15rb, 15ribu, 500k, 35k, 250 ribu
  const rbRegex = /(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/g;
  let rbMatch: RegExpExecArray | null;
  while ((rbMatch = rbRegex.exec(str)) !== null) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    total += Math.round(val * 1000);
    matchedAbbreviation = true;
  }

  if (matchedAbbreviation && total > 0) {
    return total;
  }

  // 2. Check full words: "seratus ribu", "lima puluh ribu", "dua puluh lima ribu", "sepuluh ribu"
  // Isolate word candidates
  const wordMatch = str.match(/\b(seratus|seribu|sejuta|sepuluh|setengah|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|puluh|belas|ratus|ribu|juta)(?:\s+(?:seratus|seribu|sejuta|sepuluh|setengah|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|puluh|belas|ratus|ribu|juta))*\b/i);
  if (wordMatch) {
    const wordVal = parseIndonesianWordsToNumber(wordMatch[0]);
    if (wordVal > 0) {
      return wordVal;
    }
  }

  // 3. Plain numbers with Rp prefix or standard dot separators:
  // e.g. "Rp 50.000", "Rp. 25.000", "50000", "25.000"
  const rpRegex = /(?:rp\.?\s*)(\d{1,3}(?:\.\d{3})+|\d+)/i;
  const rpMatch = str.match(rpRegex);
  if (rpMatch) {
    const cleanNum = rpMatch[1].replace(/\./g, '');
    const num = parseInt(cleanNum, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 4. Dot separated numbers without Rp: e.g. "25.000", "1.500.000"
  const dotNumRegex = /\b(\d{1,3}(?:\.\d{3})+)\b/;
  const dotMatch = str.match(dotNumRegex);
  if (dotMatch) {
    const cleanNum = dotMatch[1].replace(/\./g, '');
    const num = parseInt(cleanNum, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 5. Standalone plain integer >= 1000 (to avoid confusing with items/dates)
  const plainNumRegex = /\b(\d{4,9})\b/;
  const plainMatch = str.match(plainNumRegex);
  if (plainMatch) {
    const num = parseInt(plainMatch[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return 0;
}

/**
 * Generate ASCII progress bar using filled block █ and light shade ░
 * e.g. [████████░░░░] 67%
 */
export function generateProgressBar(percentage: number, length: number = 16): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledBlocks = Math.round((clamped / 100) * length);
  const emptyBlocks = Math.max(0, length - filledBlocks);
  
  const filled = '█'.repeat(filledBlocks);
  const empty = '░'.repeat(emptyBlocks);

  return `${filled}${empty}`;
}

/**
 * Generate budget warning message based on percentage
 */
export function formatBudgetWarning(percentage: number, categoryName: string): string | null {
  if (percentage >= 100) {
    return `🚨 Alert: Anggaran Melebihi Batas!\nAnggaran ${categoryName} sudah melebihi 100%! Rem pengeluaranmu ya.`;
  }
  if (percentage >= 80) {
    return `⚠️ Peringatan: Anggaran ${categoryName} sudah ${percentage.toFixed(0)}%! Berhematlah!`;
  }
  return null;
}
