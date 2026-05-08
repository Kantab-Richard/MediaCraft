import { useState, useEffect } from 'react';
import { ProgressData } from '@/types/api';
import { downloadFile } from './utils';

export function useDownloadProgress(downloadId: string | null) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!downloadId) return;

    const apiKey = localStorage.getItem("medicraft_api_key");
    // EventSource doesn't support custom headers natively, 
    // so we pass the key as a query param or use a polyfill.
    // Here we assume the backend handles the key via query param for SSE if needed,
    // or you can use the 'event-source-polyfill' package.
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/download/${downloadId}/progress?apiKey=${apiKey}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        setProgress(data);
      } else if (data.type === 'complete') {
        setProgress({ percentage: 100, status: 'finished' } as any);
        
        // Trigger the actual browser "Save As" dialog
        if (data.fileName) {
          downloadFile(data.fileName);
        }
        
        eventSource.close();
      } else if (data.type === 'error') {
        setError(data.message || "Download failed");
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError("Failed to track progress");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [downloadId]);

  return { progress, error };
}