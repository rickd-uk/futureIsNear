// src/types/index.ts

export interface Story  {
  id: string;
  title: string;
  url: string;
  category: string;
  author: string;
  timestamp: string;
  description?: string | null;
}
