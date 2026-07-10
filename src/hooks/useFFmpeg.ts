import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { VideoMetadata, ProxySettings } from '../types';

export function useFFmpeg() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const getVideoMetadata = useCallback(async (filePath: string): Promise<VideoMetadata> => {
    const metadata = await invoke<VideoMetadata>('get_video_metadata', { path: filePath });
    return metadata;
  }, []);

  const generateProxy = useCallback(async (
    filePath: string,
    settings: ProxySettings
  ): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const proxyPath = await invoke<string>('generate_proxy', {
        path: filePath,
        settings
      });
      setProgress(100);
      return proxyPath;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const exportVideo = useCallback(async (
    project: any,
    outputPath: string
  ): Promise<void> => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      await invoke('export_video', {
        project,
        outputPath
      });
      setProgress(100);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    progress,
    getVideoMetadata,
    generateProxy,
    exportVideo
  };
}
