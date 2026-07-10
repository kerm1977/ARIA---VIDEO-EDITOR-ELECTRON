import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

interface FileImporterProps {
  onFileSelect?: (filePath: string) => void;
}

export function FileImporter({ onFileSelect }: FileImporterProps) {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Video',
            extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm']
          }
        ]
      });
      
      if (selected && typeof selected === 'string') {
        onFileSelect?.(selected);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="file-importer">
      <button
        onClick={handleImport}
        disabled={isImporting}
        className="import-btn"
      >
        {isImporting ? 'Importing...' : '📁 Import Video'}
      </button>
    </div>
  );
}
