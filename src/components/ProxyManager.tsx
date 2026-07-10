import { useState } from 'react';
import type { ProxySettings } from '../types';

interface ProxyManagerProps {
  onGenerateProxy?: (settings: ProxySettings) => void;
  isProcessing?: boolean;
}

export function ProxyManager({ onGenerateProxy, isProcessing }: ProxyManagerProps) {
  const [settings, setSettings] = useState<ProxySettings>({
    enabled: true,
    resolution: '1280x720',
    codec: 'h264',
    bitrate: '2M'
  });

  const handleGenerate = () => {
    onGenerateProxy?.(settings);
  };

  return (
    <div className="proxy-manager">
      <h3>Proxy Settings</h3>
      <div className="proxy-controls">
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          />
          Enable Proxies
        </label>
        
        <select
          value={settings.resolution}
          onChange={(e) => setSettings({ ...settings, resolution: e.target.value })}
        >
          <option value="1280x720">720p</option>
          <option value="1920x1080">1080p</option>
          <option value="2560x1440">1440p</option>
        </select>
        
        <select
          value={settings.codec}
          onChange={(e) => setSettings({ ...settings, codec: e.target.value })}
        >
          <option value="h264">H.264</option>
          <option value="h265">H.265</option>
          <option value="vp9">VP9</option>
        </select>
        
        <select
          value={settings.bitrate}
          onChange={(e) => setSettings({ ...settings, bitrate: e.target.value })}
        >
          <option value="1M">1 Mbps</option>
          <option value="2M">2 Mbps</option>
          <option value="5M">5 Mbps</option>
          <option value="10M">10 Mbps</option>
        </select>
        
        <button
          onClick={handleGenerate}
          disabled={isProcessing}
          className="generate-btn"
        >
          {isProcessing ? 'Generating...' : 'Generate Proxy'}
        </button>
      </div>
    </div>
  );
}
