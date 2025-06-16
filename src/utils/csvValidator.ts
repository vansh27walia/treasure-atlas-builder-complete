
export interface CsvRow {
  'Tracking Number': string;
  'Drop-off Address': string;
  'Name': string;
  'Carrier': string;
  'Dimensions': string;
  'Weight': string;
  'Estimated Delivery': string;
}

export const REQUIRED_HEADERS = [
  'Tracking Number',
  'Drop-off Address',
  'Name',
  'Carrier',
  'Dimensions',
  'Weight',
  'Estimated Delivery'
];

export function validateCsvStructure(csvContent: string): {
  isValid: boolean;
  error?: string;
  headers?: string[];
  rowCount?: number;
} {
  try {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      return {
        isValid: false,
        error: 'CSV file must contain at least a header row and one data row'
      };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Check if all required headers are present in the correct order
    if (headers.length !== REQUIRED_HEADERS.length) {
      return {
        isValid: false,
        error: `CSV must have exactly ${REQUIRED_HEADERS.length} columns. Found ${headers.length} columns.`,
        headers
      };
    }

    for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
      if (headers[i] !== REQUIRED_HEADERS[i]) {
        return {
          isValid: false,
          error: `Column ${i + 1} should be "${REQUIRED_HEADERS[i]}" but found "${headers[i]}"`,
          headers
        };
      }
    }

    return {
      isValid: true,
      headers,
      rowCount: lines.length - 1
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to parse CSV file. Please ensure it is properly formatted.'
    };
  }
}

export function parseCsvToRows(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row as CsvRow;
  });
}

export function generateCsvFromRows(rows: CsvRow[]): string {
  const headers = REQUIRED_HEADERS.join(',');
  const dataRows = rows.map(row => 
    REQUIRED_HEADERS.map(header => `"${row[header] || ''}"`).join(',')
  );
  
  return [headers, ...dataRows].join('\n');
}
