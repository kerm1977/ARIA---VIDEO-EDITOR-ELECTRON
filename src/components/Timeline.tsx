import type { Project } from '../types';
import { Track } from './Track';

interface TimelineProps {
  project: Project | null;
  onClipClick?: (clipId: string) => void;
}

export function Timeline({ project, onClipClick }: TimelineProps) {
  if (!project) {
    return (
      <div className="timeline timeline-empty">
        <p>No project loaded</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <div className="timeline-info">
          <span>Duration: {project.duration}s</span>
          <span>FPS: {project.fps}</span>
          <span>Resolution: {project.resolution}</span>
        </div>
      </div>
      
      <div className="timeline-tracks">
        <div className="video-tracks">
          <h4>Video Tracks</h4>
          {project.videoTracks.map(track => (
            <Track key={track.id} track={track} onClipClick={onClipClick} />
          ))}
        </div>
        
        <div className="audio-tracks">
          <h4>Audio Tracks</h4>
          {project.audioTracks.map(track => (
            <Track key={track.id} track={track} onClipClick={onClipClick} />
          ))}
        </div>
      </div>
    </div>
  );
}
