import { useState, useCallback } from 'react';
import type { Project, Clip } from '../types';

export function useProject() {
  const [project, setProject] = useState<Project | null>(null);

  const createProject = useCallback((name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      videoTracks: [
        { id: 'v1', type: 'video', clips: [], muted: false, locked: false },
        { id: 'v2', type: 'video', clips: [], muted: false, locked: false },
        { id: 'v3', type: 'video', clips: [], muted: false, locked: false }
      ],
      audioTracks: [
        { id: 'a1', type: 'audio', clips: [], muted: false, locked: false },
        { id: 'a2', type: 'audio', clips: [], muted: false, locked: false },
        { id: 'a3', type: 'audio', clips: [], muted: false, locked: false }
      ],
      duration: 0,
      fps: 30,
      resolution: '1920x1080'
    };
    setProject(newProject);
    return newProject;
  }, []);

  const addClip = useCallback((trackId: string, clip: Clip) => {
    setProject(prev => {
      if (!prev) return prev;
      const updatedTracks = prev.videoTracks.map(t =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      );
      const updatedAudioTracks = prev.audioTracks.map(t =>
        t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
      );
      return {
        ...prev,
        videoTracks: updatedTracks,
        audioTracks: updatedAudioTracks
      };
    });
  }, []);

  const removeClip = useCallback((trackId: string, clipId: string) => {
    setProject(prev => {
      if (!prev) return prev;
      const updatedTracks = prev.videoTracks.map(t =>
        t.id === trackId ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } : t
      );
      const updatedAudioTracks = prev.audioTracks.map(t =>
        t.id === trackId ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } : t
      );
      return {
        ...prev,
        videoTracks: updatedTracks,
        audioTracks: updatedAudioTracks
      };
    });
  }, []);

  return { project, createProject, addClip, removeClip };
}
