import { useCallback, useEffect, useRef, useState } from 'react';
import { FaAngleRight, FaHeart, FaRepeat } from 'react-icons/fa6';
import YouTube, { type YouTubePlayer, type YouTubeProps } from 'react-youtube';
import CancelSectionButton from './CancelSectionButton.tsx';
import DeleteSectionButton from './DeleteSectionButton.tsx';
import SaveSectionButton from './SaveSectionButton.tsx';
import SectionEditor from './SectionEditor.tsx';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [videoId, setVideoId] = useState('');
  const [tempVideoId, setEditableVideoId] = useState('');
  const [videoHeight, setVideoHeight] = useState('auto');
  const [opts, setOpts] = useState({});
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
  const [activeSectionId, setActiveSectionId] = useState<number>(0);
  const [videoTitle, setVideoTitle] = useState('');
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:00');
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [expandedSectionId, setExpandedSectionId] = useState<number | null>(
    null,
  );
  const [editableStartTime, setEditableStartTime] = useState('00:00:00');
  const [editableEndTime, setEditableEndTime] = useState('00:00:00');
  const [editableNote, setEditableNote] = useState('');

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
  }, [videoId, activeSectionId, startSeconds, endSeconds, videoHeight]);

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

  useEffect(() => {
    updateOpts();
  }, [updateOpts]);

  useEffect(() => {
    setSections(JSON.parse(localStorage.getItem(videoId) || '[]'));
  }, [setSections, videoId]);

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
    setExpandedSectionId(null);
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
    setExpandedSectionId(section.id);

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

  const handleClickUpdateSection = async (section: {
    id: number;
    startTime: string;
    endTime: string;
    note: string;
  }) => {
    await updateSection(section);
    if (activeSectionId === section.id) seekSection(section);
  };

  const handleClickCreateSection = async () => {
    const section = await createSection();
    seekSection({
      id: section.id,
      startTime: section.startTime,
      endTime: section.endTime,
    });
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
    setExpandedSectionId(0);
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

  const handleClickPlaySection = (section: {
    id: number;
    startTime: string;
    endTime: string;
  }) => {
    seekSection(section);
  };

  const handleClickCancelSection = () => {
    if (activeSectionId > 0) clearSection();
  };

  const handleClickAddSection = () => {
    clearSectionEditor();
    setExpandedSectionId(0);
  };

  const handleClickDeleteSection = (sectionId: number) => {
    deleteSection(sectionId);
    clearSection();
    clearSectionEditor();
    setExpandedSectionId(null);
  };

  const handleClickCloseSectionEditor = () => {
    setExpandedSectionId(null);
    clearSectionEditor();
  };

  const handleClickEditSection = (section: {
    id: number;
    startTime: string;
    endTime: string;
    note: string;
  }) => {
    setExpandedSectionId(section.id);
    setEditableStartTime(section.startTime);
    setEditableEndTime(section.endTime);
    setEditableNote(section.note);
  };

  return (
    <div className={'flex flex-col items-center min-h-dvh'}>
      {!videoId && (
        <h1 className={'flex items-center mt-4'}>
          <FaHeart className={'text-xl text-rose-600'} />
          <span className={'mx-2 text-xl font-bold'}>FAVOREPEAT</span>
          <FaRepeat className={'text-xl text-cyan-600'} />
        </h1>
      )}
      {videoId && (
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
      )}
      <div className={'m-4 px-3 w-full max-w-md'}>
        {!videoId && videos.length > 0 && (
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
        {!videoId && (
          <div className={'mt-4'}>
            <label htmlFor="videoId" className={'text-sm font-bold'}>
              Video ID or URL
            </label>
            <div className={'flex items-center'}>
              <input
                id="videoId"
                type="text"
                value={tempVideoId}
                onChange={(e) => setEditableVideoId(e.target.value)}
                className={'textbox w-full'}
              />
              <button
                type={'button'}
                onClick={() => handleClickLoadVideo(tempVideoId)}
                className={'ml-2 btn btn-primary'}
              >
                Load
              </button>
            </div>
          </div>
        )}
        {videoId && sections.length > 0 && (
          <div className={'mt-2'}>
            <h2 className={'text-sm font-bold'}>Select section</h2>
            <ul
              className={
                'divide-y divide-gray-200 rounded border border-gray-300'
              }
            >
              {sections.map((section) => (
                <li
                  key={section.id}
                  className={
                    'p-3 flex-col items-center space-x-2 justify-between first:rounded-t last:rounded-b bg-slate-50 hover:bg-white active:bg-white'
                  }
                >
                  <div className={'flex justify-between'}>
                    <div>
                      <div className={'text-base'}>
                        {`${section.startTime} - ${section.endTime}`}
                      </div>
                      <div className={'text-sm text-gray-600 truncate'}>
                        {section.note}
                      </div>
                    </div>
                    <div className={'flex space-x-2'}>
                      {expandedSectionId === section.id ? (
                        <button
                          type={'button'}
                          className={'btn btn-secondary'}
                          onClick={handleClickCloseSectionEditor}
                        >
                          Close
                        </button>
                      ) : (
                        <button
                          type={'button'}
                          className={'btn btn-secondary'}
                          onClick={() => handleClickEditSection(section)}
                        >
                          Edit
                        </button>
                      )}
                      {section.id === activeSectionId ? (
                        <CancelSectionButton
                          onClick={handleClickCancelSection}
                        />
                      ) : (
                        <button
                          type={'button'}
                          className={'btn btn-primary'}
                          onClick={() => handleClickPlaySection(section)}
                        >
                          Play
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedSectionId === section.id && (
                    <div>
                      <SectionEditor
                        playerRef={playerRef}
                        editableStartTime={editableStartTime}
                        setEditableStartTime={setEditableStartTime}
                        editableEndTime={editableEndTime}
                        setEditableEndTime={setEditableEndTime}
                        editableNote={editableNote}
                        setEditableNote={setEditableNote}
                      />
                      <div
                        className={'mt-4 w-full flex justify-between space-x-2'}
                      >
                        <SaveSectionButton
                          onClick={() =>
                            handleClickUpdateSection({
                              id: section.id,
                              startTime: editableStartTime,
                              endTime: editableEndTime,
                              note: editableNote,
                            })
                          }
                        />
                        <DeleteSectionButton
                          onClick={() => handleClickDeleteSection(section.id)}
                        />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {videoId && (
          <>
            <button
              type={'button'}
              className={'mt-2 w-full btn btn-primary'}
              onClick={handleClickAddSection}
            >
              Add section
            </button>
            {expandedSectionId === 0 && (
              <div className={'flex-col card mt-2'}>
                <SectionEditor
                  playerRef={playerRef}
                  editableStartTime={editableStartTime}
                  setEditableStartTime={setEditableStartTime}
                  editableEndTime={editableEndTime}
                  setEditableEndTime={setEditableEndTime}
                  editableNote={editableNote}
                  setEditableNote={setEditableNote}
                />
                <div className={'mt-4 w-full flex justify-between space-x-2'}>
                  <SaveSectionButton onClick={handleClickCreateSection} />
                </div>
              </div>
            )}
          </>
        )}
        {videoId && (
          <>
            <hr className={'my-4 border-gray-300'} />
            <button
              type={'button'}
              onClick={handleClickClearVideo}
              className={
                'w-full flex items-center justify-center btn btn-secondary'
              }
            >
              Close this video
            </button>
          </>
        )}
      </div>
      <footer
        className={
          'w-full text-center py-4 bg-slate-200 mt-auto border-t border-slate-300'
        }
      >
        <div className={'text-sm'}>©FAVOREPEAT</div>
      </footer>
    </div>
  );
}

export default App;
