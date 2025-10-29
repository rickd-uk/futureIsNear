// src/components/CSVUpload.tsx
'use client';

import React, { useState } from 'react';

interface UploadResult {
  success: boolean;
  title: string;
  message: string;
}

interface CSVUploadResponse {
  results: UploadResult[];
  successCount: number;
  failureCount: number;
  totalProcessed: number;
}

interface CSVUploadProps {
  onUploadComplete: () => void;
}

export default function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<CSVUploadResponse | null>(null);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadResults(null);
    setShowResults(false);

    try {
      // Read file content
      const text = await file.text();
      
      // Send to API
      const response = await fetch('/api/stories/upload-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload CSV');
      }

      setUploadResults(data);
      setShowResults(true);
      
      // Refresh the stories list
      onUploadComplete();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Import Stories from CSV</h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload a CSV file with semicolon (;) separator. Format: title;url;category;description;author
          </p>
        </div>
      </div>

      {/* File Upload Input */}
      <div className="flex items-center gap-4">
        <label className="flex-1">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </label>
        {isUploading && (
          <div className="flex items-center gap-2 text-blue-600">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Upload Results Summary */}
      {uploadResults && (
        <div className="mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Upload Complete</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Total Processed:</span>
                    <span className="ml-2 text-blue-900 font-bold">{uploadResults.totalProcessed}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">✓ Success:</span>
                    <span className="ml-2 text-green-900 font-bold">{uploadResults.successCount}</span>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">✗ Failed:</span>
                    <span className="ml-2 text-red-900 font-bold">{uploadResults.failureCount}</span>
                  </div>
                </div>
              </div>
              {uploadResults.results.length > 0 && (
                <button
                  onClick={toggleResults}
                  className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showResults ? 'Hide Details' : 'Show Details'}
                </button>
              )}
            </div>
          </div>

          {/* Detailed Results */}
          {showResults && uploadResults.results.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-md max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadResults.results.map((result, index) => (
                    <tr key={index} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {result.success ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✗ Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                        {result.title || '(No title)'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {result.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CSV Format Help */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium">
          CSV Format Guide
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
          <p className="font-medium mb-2">Your CSV file should have the following format:</p>
          <div className="bg-white p-3 rounded border border-gray-200 font-mono text-xs mb-3">
            title;url;category;description;author<br />
            Story Title 1;https://example.com/story1;Technology;A brief description;John Doe<br />
            Story Title 2;https://example.com/story2;Science;Another description;Jane Smith
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Separator:</strong> Use semicolon (;) to separate columns</li>
            <li><strong>Required fields:</strong> title, url, category</li>
            <li><strong>Optional fields:</strong> description, author</li>
            <li><strong>Header row:</strong> First row can be headers (will be skipped if it contains "title")</li>
            <li><strong>Empty fields:</strong> Leave empty between semicolons for optional fields</li>
          </ul>
        </div>
      </details>
    </div>
  );
}
