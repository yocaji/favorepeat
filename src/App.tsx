import { Button, Field, Radio, RadioGroup } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { FaAngleRight, FaCircle, FaCircleCheck } from 'react-icons/fa6';
import YouTube, { type YouTubePlayer, type YouTubeProps } from 'react-youtube';
import DeleteSectionButton from './DeleteSectionButton.tsx';
import SaveSectionButton from './SaveSectionButton.tsx';
import SectionEditor from './SectionEditor.tsx';
import VideoInput from './VideoInput.tsx';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [videoId, setVideoId] = useState('');
  const [editableVideoId, setEditableVideoId] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:00');
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [editableStartTime, setEditableStartTime] = useState('00:00:00');
  const [editableEndTime, setEditableEndTime] = useState('00:00:00');
  const [editableNote, setEditableNote] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<number>(0);
  const [videos, setVideos] = useLocalStorage<
    { videoId: string; videoTitle: string }[]
  >('videos', []);
  const [sections, setSections] = useLocalStorage<
    {
      id: number;
      startTime: string;
      endTime: string;
      note: string;
    }[]
  >(videoId, []);
  const { opts, setOpts } = useYouTubePlayer({
    videoId,
    activeSectionId,
    startSeconds,
    endSeconds,
    playerRef,
  });

  useEffect(() => {
    setOpts();
  }, [setOpts]);

  useEffect(() => {
    setSections(JSON.parse(localStorage.getItem(videoId) || '[]'));
  }, [videoId]);

  useEffect(() => {
    const [hours, minutes, seconds] = startTime.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setStartSeconds(totalSeconds);
  }, [startTime]);

  useEffect(() => {
    const [hours, minutes, seconds] = endTime.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setEndSeconds(totalSeconds);
  }, [endTime]);

  useEffect(() => {
    if (activeSectionId === 0) {
      clearSectionEditor();
      return;
    }

    const section = sections.find((section) => section.id === activeSectionId);
    if (!section) return;
    seekSection(section);
    setEditableStartTime(section.startTime);
    setEditableEndTime(section.endTime);
    setEditableNote(section.note);
  }, [activeSectionId, sections]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === window.YT.PlayerState.ENDED && playerRef.current) {
      if (activeSectionId > 0) {
        playerRef.current.seekTo(startSeconds, true).catch((error) => {
          console.error('Error seeking to start:', error);
        });
      } else {
        playerRef.current.playVideo().catch((error) => {
          console.error('Error playing video:', error);
        });
      }
    }
  };

  const handleClickStoredVideo = async (
    videoId: string,
    videoTitle: string,
  ) => {
    setEditableVideoId('');
    setVideoId(videoId);
    setVideoTitle(videoTitle);

    setSections(JSON.parse(localStorage.getItem(videoId) || '[]'));
  };

  const handleClickClearVideo = () => {
    setVideoId('');
    clearSection();
    clearSectionEditor();
  };

  const createSection = async (): Promise<{
    id: number;
    startTime: string;
    endTime: string;
    note: string;
  }> => {
    const section = {
      id: sections.length > 0 ? sections[sections.length - 1].id + 1 : 1,
      startTime: editableStartTime,
      endTime: editableEndTime,
      note: editableNote,
    };

    const storedData = [...sections, section];
    setSections(storedData);
    seekSection(storedData[storedData.length - 1]);

    const existingVideos = [...videos];
    const videoEntry = { videoId, videoTitle };
    if (!existingVideos.some((video) => video.videoId === videoId)) {
      existingVideos.push(videoEntry);
      setVideos(existingVideos);
    }

    return section;
  };

  const updateSection = async (section: {
    id: number;
    startTime: string;
    endTime: string;
    note: string;
  }) => {
    const storedData = sections.map((s) => (s.id === section.id ? section : s));
    setSections(storedData);
  };

  const seekSection = (section: {
    id: number;
    startTime: string;
    endTime: string;
  }) => {
    setActiveSectionId(section.id);
    setStartTime(section.startTime);
    setEndTime(section.endTime);
  };

  const clearSection = () => {
    setStartTime('00:00:00');
    setEndTime('00:00:00');
    setActiveSectionId(0);
  };

  const clearSectionEditor = () => {
    setEditableStartTime('00:00:00');
    setEditableEndTime('00:00:00');
    setEditableNote('');
  };

  const deleteSection = (sectionId: number) => {
    if (!window.confirm('Delete this section?')) return;

    const existingSections = sections.filter((s) => s.id !== sectionId);
    setSections(existingSections);

    if (existingSections.length === 0) {
      const updatedVideos = videos.filter((video) => video.videoId !== videoId);
      setVideos(updatedVideos);
      localStorage.removeItem(videoId);
    }
  };

  const handleClickSaveSection = async (section: {
    id: number;
    startTime: string;
    endTime: string;
    note: string;
  }) => {
    if (section.id === 0) {
      const newSection = await createSection();
      seekSection(newSection);
    } else {
      await updateSection(section);
      if (activeSectionId === section.id) seekSection(section);
    }
  };

  const handleClickDeleteSection = (sectionId: number) => {
    deleteSection(sectionId);
    if (sectionId !== activeSectionId) return;
    clearSection();
    clearSectionEditor();
  };

  return (
    <div className={'flex flex-col items-center min-h-dvh'}>
      {!videoId && (
        <div className={'flex-grow px-4 w-full max-w-md bg-slate-50/40'}>
          <h1 className={'flex items-center mt-4 mb-6 justify-center'}>
            <img
              src={'/favorepeat/logomark.svg'}
              alt={"FavoRepeat's logomark"}
              className={'w-7 h-7'}
            />
            <span className={'mx-2 text-3xl'}>FAVOREPEAT</span>
          </h1>
          {videos.length > 0 && (
            <div className={'space-y-2'}>
              {videos.map((video) => (
                <Button
                  key={video.videoId}
                  className={
                    'selector w-full h-11 flex items-center justify-between'
                  }
                  onClick={() =>
                    handleClickStoredVideo(video.videoId, video.videoTitle)
                  }
                >
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`}
                    alt={`${video.videoTitle} thumbnail`}
                    className={'w-22 h-11 flex-none object-cover rounded-l-lg'}
                  />
                  <div className={'mx-2 flex-grow text-left truncate'}>
                    {video.videoTitle}
                  </div>
                  <FaAngleRight
                    className={'w-6 mr-2 flex-none text-slate-400 text-lg'}
                  />
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      {videoId && (
        <>
          <div
            className={'w-full h-full relative bg-slate-500/10'}
            style={{ maxWidth: '448px', maxHeight: '252px' }}
          >
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
            />
          </div>
          <div
            className={
              'w-full max-w-md pt-4 px-4 pb-6 space-y-4 shadow-sm bg-slate-50/60'
            }
          >
            <SectionEditor
              playerRef={playerRef}
              editableStartTime={editableStartTime}
              setEditableStartTime={setEditableStartTime}
              editableEndTime={editableEndTime}
              setEditableEndTime={setEditableEndTime}
              editableNote={editableNote}
              setEditableNote={setEditableNote}
            />
            <div className={'flex justify-center'}>
              <SaveSectionButton
                onClick={() =>
                  handleClickSaveSection({
                    id: activeSectionId,
                    startTime: editableStartTime,
                    endTime: editableEndTime,
                    note: editableNote,
                  })
                }
              />
            </div>
          </div>
          <div
            className={
              'w-full flex-grow max-w-md px-4 py-8 space-y-6 bg-slate-50/40'
            }
          >
            <RadioGroup
              value={activeSectionId}
              onChange={setActiveSectionId}
              className={'space-y-2'}
            >
              {sections.map((section) => (
                <Field key={section.id} className={'relative'}>
                  <Radio
                    value={section.id}
                    className={'flex w-full selector group px-3 py-2'}
                  >
                    <div className={'flex w-full items-center space-x-2'}>
                      <div>
                        <FaCircle
                          className={
                            'block text-slate-500/10 group-data-[checked]:hidden'
                          }
                        />
                        <FaCircleCheck
                          className={
                            'hidden group-data-[checked]:block transition duration-200 text-violet-400'
                          }
                        />
                      </div>
                      <div className={'min-w-0'}>
                        <div>{`${section.startTime} - ${section.endTime}`}</div>
                        <div
                          className={'text-sm text-slate-500 truncate min-w-0'}
                        >
                          {section.note}
                        </div>
                      </div>
                    </div>
                  </Radio>
                  <div className={'absolute top-0 right-0'}>
                    <DeleteSectionButton
                      onClick={() => handleClickDeleteSection(section.id)}
                    />
                  </div>
                </Field>
              ))}
              <Field className={'flex w-full'}>
                <Radio value={0} className={'selector group px-3 py-2'}>
                  <div className={'flex w-full items-center space-x-2'}>
                    <div>
                      <FaCircle
                        className={
                          'block text-slate-500/10 group-data-[checked]:hidden'
                        }
                      />
                      <FaCircleCheck
                        className={
                          'hidden group-data-[checked]:block transition duration-200 text-violet-400'
                        }
                      />
                    </div>
                    <div>New section</div>
                  </div>
                </Radio>
              </Field>
            </RadioGroup>
          </div>
        </>
      )}
      <div className={'w-full max-w-md px-4 py-6 bg-slate-50/60 text-center'}>
        {!videoId && (
          <VideoInput
            editableVideoId={editableVideoId}
            setEditableVideoId={setEditableVideoId}
            setVideoId={setVideoId}
            setVideoTitle={setVideoTitle}
          />
        )}
        {videoId && (
          <Button onClick={handleClickClearVideo} className={'w-full btn'}>
            Close this video
          </Button>
        )}
      </div>
      <footer className={'w-full max-w-md px-4 py-6 bg-slate-50/60 space-y-8'}>
        <div className={'text-xs text-center'}>©FAVOREPEAT</div>
      </footer>
    </div>
  );
}

export default App;
