'use client';

import React, { useState } from 'react';

export default function BulkUpload() {
    const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsUploading(true);
    setStatus('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name);

      const response = await fetch('/api/stories/bulk', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType?.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Unexpected response:', text);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setStatus(result.message || 'Upload successful');
      event.target.value = ''; // Reset file input
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-medium mb-4">Bulk Upload Stories</h2>
      
      <div className="space-y-4">
        <div>
          <label 
            htmlFor="csv-upload" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Choose CSV file
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-orange-50 file:text-orange-700
              hover:file:bg-orange-100
              disabled:opacity-50"
          />
        </div>

        {isUploading && (
          <div className="text-gray-600">Uploading...</div>
        )}

        {status && (
          <div className="text-green-600">{status}</div>
        )}

        {error && (
          <div className="text-red-600 whitespace-pre-wrap">{error}</div>
        )}

        <div className="text-sm text-gray-500">
          <p>CSV should have these columns:</p>
          <code className="text-xs bg-gray-100 p-1 rounded block mt-1">
            title,url,points,author,comments,timestamp,category
          </code>
        </div>
      </div>
    </div>
  );
}
