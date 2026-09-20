/**
 * Professional CSV Formatter & Exporter for EduScore TZ
 * Ensures phone numbers, currency values, dates, and text are formatted
 * properly for Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice Calc.
 */

/**
 * Formats a phone number safely for CSV.
 * Uses Excel formula escaping ="'+255..." to guarantee leading zeros and plus signs
 * are preserved without triggering scientific notation (e.g. 2.55E+11) or #NAME? formula errors.
 */
export const formatCsvPhone = (phone?: string | null): string => {
  if (!phone) return '""';
  const clean = String(phone).trim();
  // Ensure formatted as Excel text formula
  return `="""${clean}"""`;
};

/**
 * Formats a currency amount for display in CSV.
 */
export const formatCsvCurrency = (amount: number | null | undefined, currency: string = 'TZS'): string => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `"${currency} ${num.toLocaleString('en-US')}"`;
};

/**
 * Standard CSV cell value escaping.
 */
export const escapeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If string contains quotes, commas, or line breaks, escape quotes and enclose in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Downloads a CSV string with a UTF-8 Byte Order Mark (BOM)
 * so that spreadsheet applications correctly detect UTF-8 encoding.
 */
export const downloadCsvFile = (csvString: string, filename: string): void => {
  // Prepend UTF-8 BOM
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
