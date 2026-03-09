import Papa from 'papaparse';

export interface CSVLink {
  title: string;
  url: string;
  points: string;
  author: string;
  comments: string;
  timestamp: string;
  category: string;
}

export function parseCSV(csvContent: string): Promise<CSVLink[]> {
  return new Promise<CSVLink[]>((resolve, reject) => {
    Papa.parse<CSVLink>(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
          return;
        }
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

export function validateCSVLink(link: CSVLink): string[] {
  const errors: string[] = [];

  if (!link.title) errors.push('Title is required');
  if (!link.url) errors.push('URL is required');
  if (isNaN(Number(link.points))) errors.push('Points must be a number');
  if (!link.author) errors.push('Author is required');
  if (isNaN(Number(link.comments))) errors.push('Comments must be a number');
  if (!link.category) errors.push('Category is required');
  if (isNaN(Date.parse(link.timestamp))) errors.push('Invalid timestamp format');

  return errors;
}
