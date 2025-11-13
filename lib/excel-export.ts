import * as XLSX from 'xlsx';
import { OCRResult } from './types';

export interface TableData {
  headers: string[];
  rows: any[][];
}

export function exportToExcel(tables: TableData[], filename: string = 'ocr-extraction.xlsx'): void {
  const workbook = XLSX.utils.book_new();

  tables.forEach((table, index) => {
    // Create worksheet from array of arrays
    const worksheetData = [
      table.headers,
      ...table.rows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = table.headers.map((_, colIndex) => {
      const maxLength = Math.max(
        table.headers[colIndex].length,
        ...table.rows.map(row => String(row[colIndex] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    const sheetName = tables.length > 1 ? `Table ${index + 1}` : 'Data';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  // Write file
  XLSX.writeFile(workbook, filename);
}

export function parseOCRResponse(response: string): TableData[] {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response);

    if (parsed.tables && Array.isArray(parsed.tables)) {
      return parsed.tables.map((table: any) => ({
        headers: table.headers || [],
        rows: table.rows || [],
      }));
    }

    // If it's a single table object
    if (parsed.headers && parsed.rows) {
      return [{
        headers: parsed.headers,
        rows: parsed.rows,
      }];
    }

    // Fallback: try to extract table from markdown or plain text
    return extractTableFromText(response);
  } catch (e) {
    // If JSON parsing fails, try to extract table from text
    return extractTableFromText(response);
  }
}

function extractTableFromText(text: string): TableData[] {
  // Try to find markdown tables
  const markdownTableRegex = /\|(.+)\|\n\|([-:|\s]+)\|\n((?:\|.+\|\n?)+)/g;
  const matches = Array.from(text.matchAll(markdownTableRegex));

  if (matches.length > 0) {
    return matches.map(match => {
      const headerRow = match[1].split('|').map(h => h.trim()).filter(h => h);
      const dataRows = match[3].split('\n')
        .filter(row => row.trim())
        .map(row => row.split('|').map(cell => cell.trim()).filter((_, i) => i > 0 && i <= headerRow.length));

      return {
        headers: headerRow,
        rows: dataRows,
      };
    });
  }

  // Fallback: create a simple table with the text as content
  return [{
    headers: ['Content'],
    rows: text.split('\n').filter(line => line.trim()).map(line => [line.trim()]),
  }];
}

export function exportOCRResults(results: OCRResult[], filename: string = 'ocr-results.xlsx'): void {
  const allTables: TableData[] = [];

  results.forEach((result, index) => {
    if (result.data) {
      try {
        const tables = parseOCRResponse(result.data);
        allTables.push(...tables);
      } catch (e) {
        console.error(`Failed to parse OCR result ${index}:`, e);
      }
    }
  });

  if (allTables.length === 0) {
    throw new Error('No valid table data to export');
  }

  exportToExcel(allTables, filename);
}
