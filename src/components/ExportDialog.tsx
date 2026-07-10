import { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';

interface ExportDialogProps {
  onExport?: (outputPath: string) => void;
  isProcessing?: boolean;
}

export function ExportDialog({ onExport, isProcessing }: ExportDialogProps) {
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('high');

  const handleExport = async () => {
    try {
      const outputPath = await save({
        defaultPath: `video_export.${format}`,
        filters: [
          {
            name: 'Video',
            extensions: [format]
          }
        ]
      });
      
      if (outputPath) {
        onExport?.(outputPath);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  return (
    <div className="export-dialog">
      <h3>Export Settings</h3>
      <div className="export-controls">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="mp4">MP4</option>
          <option value="mkv">MKV</option>
          <option value="webm">WebM</option>
        </select>
        
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
        >
          <option value="low">Low Quality</option>
          <option value="medium">Medium Quality</option>
          <option value="high">High Quality</option>
          <option value="ultra">Ultra Quality (8K)</option>
        </select>
        
        <button
          onClick={handleExport}
          disabled={isProcessing}
          className="export-btn"
        >
          {isProcessing ? 'Exporting...' : '📤 Export Video'}
        </button>
      </div>
    </div>
  );
}
