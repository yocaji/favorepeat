import { Button, Field, Input, Label, Textarea } from '@headlessui/react';
import type React from 'react';
import type { YouTubePlayer } from 'react-youtube';

interface SectionFormProps {
  playerRef: React.RefObject<YouTubePlayer | null>;
  editableStartTime: string;
  setEditableStartTime: React.Dispatch<React.SetStateAction<string>>;
  editableEndTime: string;
  setEditableEndTime: React.Dispatch<React.SetStateAction<string>>;
  editableNote: string;
  setEditableNote: React.Dispatch<React.SetStateAction<string>>;
}

const padToTwoDigits = (seconds: number) => {
  return seconds.toString().padStart(2, '0');
};

const setTimeToCurrent = async (
  setTime: React.Dispatch<React.SetStateAction<string>>,
  playerRef: React.RefObject<YouTubePlayer | null>,
): Promise<void> => {
  if (playerRef.current) {
    const currentTime = await playerRef.current.getCurrentTime();
    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = Math.floor(currentTime % 60);
    setTime(
      `${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}:${padToTwoDigits(seconds)}`,
    );
  }
};

const SectionEditor: React.FC<SectionFormProps> = ({
  editableNote,
  setEditableNote,
  playerRef,
  editableStartTime,
  setEditableStartTime,
  editableEndTime,
  setEditableEndTime,
}) => {
  return (
    <>
      <div className={'flex justify-between space-x-3'}>
        <Field className={'block w-1/2'}>
          <Label className={'text-sm font-bold'}>Start from</Label>
          <div className={'flex items-stretch'}>
            <Input
              type={'time'}
              step={'1'}
              value={editableStartTime}
              onChange={(e) => setEditableStartTime(e.target.value)}
              className={'w-full textbox text-lg rounded-l-lg rounded-r-none'}
            />
            <Button
              onClick={() => setTimeToCurrent(setEditableStartTime, playerRef)}
              className={'btn btn-mono-2 rounded-l-none rounded-r-lg'}
            >
              Now
            </Button>
          </div>
        </Field>
        <Field className={'block w-1/2'}>
          <Label className={'text-sm font-bold'}>End at</Label>
          <div className={'flex items-stretch'}>
            <Input
              type={'time'}
              step={'1'}
              value={editableEndTime}
              onChange={(e) => setEditableEndTime(e.target.value)}
              className={'w-full textbox text-lg rounded-l-lg rounded-r-none'}
            />
            <Button
              onClick={() => setTimeToCurrent(setEditableEndTime, playerRef)}
              className={'btn btn-mono-2 rounded-l-none rounded-r-lg'}
            >
              Now
            </Button>
          </div>
        </Field>
      </div>
      <Field className={'block'}>
        <Label className={'sr-only'}>Note</Label>
        <Textarea
          name={'note'}
          value={editableNote}
          onChange={(e) => setEditableNote(e.target.value)}
          className={'w-full textbox'}
        />
      </Field>
    </>
  );
};

export default SectionEditor;
