import {
  Button,
  Field,
  Input,
  Label,
  Radio,
  RadioGroup,
} from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';
import { FaAngleRight, FaHeart, FaRepeat } from 'react-icons/fa6';
import YouTube, { type YouTubePlayer, type YouTubeProps } from 'react-youtube';
import DeleteSectionButton from './DeleteSectionButton.tsx';
import SaveSectionButton from './SaveSectionButton.tsx';
import SectionEditor from './SectionEditor.tsx';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [videoId, setVideoId] = useState('');
  const [tempVideoId, setEditableVideoId] = useState('');
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
  const [videoTitle, setVideoTitle] = useState('');
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:00');
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [editableStartTime, setEditableStartTime] = useState('00:00:00');
  const [editableEndTime, setEditableEndTime] = useState('00:00:00');
  const [editableNote, setEditableNote] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<number>(0);

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
      seekSection({
        id: 0,
        startTime: '00:00:00',
        endTime: '00:00:00',
      });
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
        <>
          <h1 className={'flex items-center mt-4'}>
            <FaHeart className={'text-xl text-rose-600'} />
            <span className={'mx-2 text-xl font-bold'}>FAVOREPEAT</span>
            <FaRepeat className={'text-xl text-cyan-600'} />
          </h1>
          <div className={'m-4 px-3 w-full max-w-md'}>
            {videos.length > 0 && (
              <div>
                <h2 className={'text-sm font-bold'}>Select video</h2>
                <ul
                  className={
                    'divide-y divide-gray-200 rounded border border-gray-300'
                  }
                >
                  {videos.map((video) => (
                    <li
                      key={video.videoId}
                      className={
                        'p-3 flex items-center space-x-2 justify-between first:rounded-t last:rounded-b bg-slate-50 hover:bg-white active:bg-white'
                      }
                      onClick={() =>
                        handleClickStoredVideo(video.videoId, video.videoTitle)
                      }
                    >
                      <div className={'truncate'}>{video.videoTitle}</div>
                      <FaAngleRight className={'text-slate-400'} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Field className={'mt-4'}>
              <Label className={'text-sm font-bold'}>Video ID or URL</Label>
              <div className={'flex items-center'}>
                <Input
                  value={tempVideoId}
                  onChange={(e) => setEditableVideoId(e.target.value)}
                  className={'textbox w-full'}
                />
                <Button
                  onClick={() => handleClickLoadVideo(tempVideoId)}
                  className={'ml-2 btn btn-primary'}
                >
                  Load
                </Button>
              </div>
            </Field>
          </div>
        </>
      )}
      {videoId && (
        <>
          <div
            className={'w-full h-full relative'}
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
              'w-full max-w-md pt-4 px-4 pb-6 space-y-4 shadow-sm bg-slate-100'
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
            className={'w-full flex-grow max-w-md pt-4 px-4 space-y-6 bg-slate-500/10'}
            id={'section'}
          >
            {sections.length > 0 && (
              <div className={'mt-6'}>
                <RadioGroup
                  value={activeSectionId}
                  onChange={setActiveSectionId}
                  className={
                    'divide-y divide-gray-200 rounded border border-gray-300'
                  }
                >
                  {sections.map((section) => (
                    <Field key={section.id} className={'flex'}>
                      <Radio
                        value={section.id}
                        className={
                          'w-full py-4 px-5 cursor-pointer first:rounded-t-lg ' +
                          'bg-slate-100 hover:bg-white active:bg-white data-[checked]:bg-white ' +
                          'border-2 border-transparent data-[checked]:border-sky-500/30'
                        }
                      >
                        <div className={'text-base cursor-pointer'}>
                          {`${section.startTime} - ${section.endTime}`}
                        </div>
                        <div className={'text-sm text-gray-600 truncate'}>
                          {section.note}
                        </div>
                      </Radio>
                      <DeleteSectionButton
                        onClick={() => handleClickDeleteSection(section.id)}
                      />
                    </Field>
                  ))}
                  <Field
                    key={0}
                    className={
                      'w-full py-4 px-5 cursor-pointer rounded-b-lg ' +
                      'bg-slate-100 hover:bg-white active:bg-white data-[checked]:bg-white ' +
                      'border-2 border-transparent data-[checked]:border-sky-500/30'
                    }
                  >
                    <Radio value={0}>
                      <div>Add section</div>
                    </Radio>
                  </Field>
                </RadioGroup>
              </div>
            )}
            <div className={'flex justify-center'}>
              <Button
                onClick={handleClickClearVideo}
                className={'w-1/2 btn btn-secondary'}
              >
                Close this video
              </Button>
            </div>
          </div>
        </>
      )}
      <footer
        className={'w-full max-w-md text-center py-4 bg-slate-100/50 mt-auto'}
      >
        <div className={'text-sm'}>©FAVOREPEAT</div>
      </footer>
    </div>
  );
}

export default App;
