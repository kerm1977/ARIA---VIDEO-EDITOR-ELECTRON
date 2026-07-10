import type { Track } from '../types';

interface TrackProps {
  track: Track;
  onClipClick?: (clipId: string) => void;
}

export function Track({ track, onClipClick }: TrackProps) {
  const trackColor = track.type === 'video' ? 'bg-blue-500' : 'bg-green-500';
  
  return (
    <div className={`track ${trackColor} ${track.muted ? 'opacity-50' : ''}`}>
      <div className="track-header">
        <span className="track-name">{track.id}</span>
        <div className="track-controls">
          <button className="track-btn" title="Mute">
            {track.muted ? '🔇' : '🔊'}
          </button>
          <button className="track-btn" title="Lock">
            {track.locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>
      <div className="track-content">
        {track.clips.map(clip => (
          <div
            key={clip.id}
            className="clip"
            style={{
              left: `${clip.startTime}px`,
              width: `${clip.duration}px`
            }}
            onClick={() => onClipClick?.(clip.id)}
          >
            <span className="clip-name">{clip.file}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
