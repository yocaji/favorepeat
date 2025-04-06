import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { YouTubePlayer } from 'react-youtube';

interface UseYouTubePlayerProps {
  videoId: string;
  activeSectionId: number;
  startSeconds: number;
  endSeconds: number;
  playerRef: React.MutableRefObject<YouTubePlayer | null>;
}

export const useYouTubePlayer = ({
  videoId,
  activeSectionId,
  startSeconds,
  endSeconds,
  playerRef,
}: UseYouTubePlayerProps) => {
  const [videoHeight, setVideoHeight] = useState('auto');
  const [opts, setOpts] = useState({});

  const updateOpts = useCallback(async () => {
    let start: number | undefined;
    if (!videoId) {
      start = undefined;
    } else if (activeSectionId === 0) {
      start = await playerRef.current?.getCurrentTime();
    } else {
      start = startSeconds;
    }

    setOpts({
      playerVars: {
        autoplay: activeSectionId > 0 ? 1 : 0,
        start: start,
        end: activeSectionId > 0 ? endSeconds : undefined,
      },
      width: '100%',
      height: Number.parseInt(videoHeight) > 252 ? '252px' : videoHeight,
    });
  }, [
    videoId,
    startSeconds,
    endSeconds,
    videoHeight,
    activeSectionId,
    playerRef,
  ]);

  useEffect(() => {
    updateOpts();
  }, []);

  useEffect(() => {
    const updateVideoHeight = () => {
      const width = window.innerWidth;
      const height = (width * 9) / 16;
      setVideoHeight(`${height}px`);
    };

    updateVideoHeight();
    window.addEventListener('resize', updateVideoHeight);

    return () => {
      window.removeEventListener('resize', updateVideoHeight);
    };
  }, []);

  return { opts, setOpts: updateOpts };
};
