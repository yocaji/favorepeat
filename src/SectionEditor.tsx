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
      <div className={'flex justify-between'}>
        <div className={'block w-1/2 mr-2'}>
          <span className={'text-sm font-bold'}>Start from</span>
          <div className={'flex items-center'}>
            <label htmlFor="startTime" className={'sr-only'}>
              Start Time
            </label>
            <input
              id={'startTime'}
              type={'time'}
              step={'1'}
              value={editableStartTime}
              onChange={(e) => setEditableStartTime(e.target.value)}
              className={'w-full textbox text-lg'}
            />
          </div>
          <button
            type={'button'}
            onClick={() => setTimeToCurrent(setEditableStartTime, playerRef)}
            className={'mt-2 btn btn-secondary w-full'}
          >
            Now
          </button>
        </div>
        <div className={'block w-1/2 ml-2'}>
          <span className={'text-sm font-bold'}>End at</span>
          <div className={'flex items-center'}>
            <label htmlFor="endTime" className={'sr-only'}>
              End Time
            </label>
            <input
              id={'endTime'}
              type={'time'}
              step={'1'}
              value={editableEndTime}
              onChange={(e) => setEditableEndTime(e.target.value)}
              className={'w-full textbox text-lg'}
            />
          </div>
          <button
            type={'button'}
            onClick={() => setTimeToCurrent(setEditableEndTime, playerRef)}
            className={'mt-2 btn btn-secondary w-full'}
          >
            Now
          </button>
        </div>
      </div>
      <div className={'block mt-2'}>
        <span className={'text-sm font-bold'}>Note</span>
        <textarea
          value={editableNote}
          onChange={(e) => setEditableNote(e.target.value)}
          className={'w-full textbox'}
        />
      </div>
    </>
  );
};

export default SectionEditor;
