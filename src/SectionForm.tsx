import type * as React from 'react';

interface SectionFormProps {
  startTime: string;
  setStartTime: React.Dispatch<React.SetStateAction<string>>;
  endTime: string;
  setEndTime: React.Dispatch<React.SetStateAction<string>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  setTimeToCurrent: (
    setTime: React.Dispatch<React.SetStateAction<string>>,
  ) => Promise<void>;
  saveSection: () => void;
  activeSectionId: number;
}

const SectionForm: React.FC<SectionFormProps> = ({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  note,
  setNote,
  setTimeToCurrent,
  saveSection,
  activeSectionId,
}) => {
  return (
    <>
      <div className={'block'}>
        <span className={'text-sm font-bold'}>Start from</span>
        <div className={'flex items-center'}>
          <label htmlFor="startTime" className={'sr-only'}>
            Start Time
          </label>
          <input
            id={'startTime'}
            type={'time'}
            step={'1'}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={'w-full textbox'}
          />
          <button
            type={'button'}
            onClick={() => setTimeToCurrent(setStartTime)}
            className={'ml-2 btn btn-secondary'}
          >
            Now
          </button>
        </div>
      </div>
      <div className={'block mt-2'}>
        <span className={'text-sm font-bold'}>End at</span>
        <div className={'flex items-center'}>
          <label htmlFor="endTime" className={'sr-only'}>
            End Time
          </label>
          <input
            id={'endTime'}
            type={'time'}
            step={'1'}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={'w-full textbox'}
          />
          <button
            type={'button'}
            onClick={() => setTimeToCurrent(setEndTime)}
            className={'ml-2 btn btn-secondary'}
          >
            Now
          </button>
        </div>
      </div>
      <div className={'block mt-2'}>
        <span className={'text-sm font-bold'}>Note</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={'w-full textbox'}
        />
      </div>
      <button
        type={'button'}
        onClick={() => saveSection()}
        className={'mt-4 w-full btn btn-primary'}
      >
        {activeSectionId !== 0 ? 'Update section' : 'Add section'}
      </button>
    </>
  );
};

export default SectionForm;
