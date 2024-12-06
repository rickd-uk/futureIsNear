import Papa from 'papaparse';

export interface CSVStory {
  title: string;
  url: string;
  points: string;
  author: string;
  comments: string;
  timestamp: string;
  category: string;
}

export function parseCSV(csvContent: string): Promise<CSVStory[]> {
  return new Promise<CSVStory[]>((resolve, reject) => {
    Papa.parse<CSVStory>(csvContent, {
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

export function validateCSVStory(story: CSVStory): string[] {
  const errors: string[] = [];
  
  if (!story.title) errors.push('Title is required');
  if (!story.url) errors.push('URL is required');
  if (isNaN(Number(story.points))) errors.push('Points must be a number');
  if (!story.author) errors.push('Author is required');
  if (isNaN(Number(story.comments))) errors.push('Comments must be a number');
  if (!story.category) errors.push('Category is required');
  if (isNaN(Date.parse(story.timestamp))) errors.push('Invalid timestamp format');

  return errors;
}
