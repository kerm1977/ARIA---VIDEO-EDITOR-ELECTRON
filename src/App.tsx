import { useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { Timeline } from './components/Timeline';
import { VideoPreview } from './components/VideoPreview';
import { ProxyManager } from './components/ProxyManager';
import { FileImporter } from './components/FileImporter';
import { ExportDialog } from './components/ExportDialog';
import { useProject } from './hooks/useProject';
import { useFFmpeg } from './hooks/useFFmpeg';
import type { Clip, ProxySettings } from './types';
import './App.css';

function App() {
  const { project, createProject, addClip } = useProject();
  const { isProcessing, generateProxy, exportVideo } = useFFmpeg();
  const [currentVideo, setCurrentVideo] = useState<string | undefined>();
  const [currentTime, setCurrentTime] = useState(0);

  const handleFileSelect = async (filePath: string) => {
    setCurrentVideo(filePath);
    if (!project) {
      createProject('New Project');
    }
    
    const clip: Clip = {
      id: Date.now().toString(),
      file: filePath,
      startTime: 0,
      duration: 10,
      offset: 0,
      isProxy: false
    };
    
    addClip('v1', clip);
  };

  const handleGenerateProxy = async (settings: ProxySettings) => {
    if (currentVideo) {
      const proxyPath = await generateProxy(currentVideo, settings);
      console.log('Proxy generated:', proxyPath);
    }
  };

  const handleExport = async (outputPath: string) => {
    if (project) {
      await exportVideo(project, outputPath);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>ARIA - Video Editor</h1>
        <ThemeToggle />
      </header>

      <main className="app-main">
        <div className="left-panel">
          <div className="panel-section">
            <h2>Import</h2>
            <FileImporter onFileSelect={handleFileSelect} />
          </div>
          
          <div className="panel-section">
            <h2>Proxy</h2>
            <ProxyManager 
              onGenerateProxy={handleGenerateProxy}
              isProcessing={isProcessing}
            />
          </div>
          
          <div className="panel-section">
            <h2>Export</h2>
            <ExportDialog 
              onExport={handleExport}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        <div className="center-panel">
          <VideoPreview 
            src={currentVideo}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
          />
        </div>

        <div className="right-panel">
          <Timeline project={project} />
        </div>
      </main>
    </div>
  );
}

export default App;
