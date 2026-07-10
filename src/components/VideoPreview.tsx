import { useRef, useState, useEffect } from 'react';

interface VideoPreviewProps {
  src?: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

export function VideoPreview({ src, currentTime = 0, onTimeUpdate }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (videoRef.current && currentTime !== undefined) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setDuration(videoRef.current.duration || 0);
      onTimeUpdate?.(time);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="video-preview">
      <video
        ref={videoRef}
        src={src}
        className="video-element"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div className="video-controls">
        <button onClick={togglePlay} className="control-btn">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <span className="time-display">
          {currentTime.toFixed(2)} / {duration.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
