import { Button, Field, Input, Label } from '@headlessui/react';
import type React from 'react';

interface VideoInputProps {
  editableVideoId: string;
  setEditableVideoId: (value: string) => void;
  setVideoId: (value: string) => void;
  setVideoTitle: (value: string) => void;
}

const VideoInput: React.FC<VideoInputProps> = ({
  editableVideoId,
  setEditableVideoId,
  setVideoId,
  setVideoTitle,
}) => {
  const fetchVideoTitle = async (videoId: string) => {
    try {
      const apiKey = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`,
      );
      if (response.status !== 200) {
        console.error(
          `Error fetching video title: ${response.status} ${response.statusText}`,
        );
        return 'Anonymous';
      }
      const data = await response.json();
      if (data.items.length > 0) {
        return data.items[0].snippet.title;
      }
    } catch (error) {
      console.error('Error fetching video title:', error);
    }
  };

  const extractVideoId = (input: string): string => {
    const urlPattern =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|watch\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = input.match(urlPattern);
    return match ? match[1] : input;
  };

  const handleClickLoadVideo = async (input: string) => {
    const videoId = extractVideoId(input);
    const title: string = await fetchVideoTitle(videoId);
    setVideoTitle(title);
    setVideoId(videoId);
    setEditableVideoId('');
  };

  return (
    <Field>
      <Label className={'text-sm font-bold'}>Video ID or URL</Label>
      <Input
        value={editableVideoId}
        onChange={(e) => setEditableVideoId(e.target.value)}
        className={'textbox w-full mt-1 rounded-lg'}
      />
      <Button
        onClick={() => handleClickLoadVideo(editableVideoId)}
        className={'btn w-full mt-3'}
        disabled={!editableVideoId}
      >
        Load new video
      </Button>
    </Field>
  );
};

export default VideoInput;
