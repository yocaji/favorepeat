import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';
import { FaAngleRight, FaHeart, FaRepeat } from 'react-icons/fa6';
import YouTube, { type YouTubePlayer, type YouTubeProps } from 'react-youtube';

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [videoId, setVideoId] = useState('');
  const [tempVideoId, setTempVideoId] = useState('');
  const [videoHeight, setVideoHeight] = useState('auto');
  const [opts, setOpts] = useState({});
  const [videos, setVideos] = useState<
    { videoId: string; videoTitle: string }[]
  >([]);
  const [sections, setSections] = useState<
    {
      id: number;
      startTime: string;
      endTime: string;
      note: string;
    }[]
  >([]);
  const [activeSectionId, setActiveSectionId] = useState<number>(0);
  const [note, setNote] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:00');
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);

  const formatSeconds = (seconds: number) => {
    return seconds.toString().padStart(2, '0');
  };

  const updateOpts = useCallback(() => {
    let start;
    if (!videoId) {
      start = undefined;
    } else if (activeSectionId === 0) {
      start = playerRef.current?.getCurrentTime();
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
    activeSectionId,
    startSeconds,
    endSeconds,
    videoHeight,
  ]);

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
    const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
    setVideos(storedVideos);
  }, []);

  useEffect(() => {
    updateOpts();
  }, [updateOpts]);

  useEffect(() => {
    const storedSections = JSON.parse(localStorage.getItem(videoId) || '[]');
    setSections(storedSections);
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

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === window.YT.PlayerState.ENDED && playerRef.current) {
      if (activeSectionId > 0) {
        playerRef.current
          .seekTo(startSeconds, true)
          .catch((error) => {
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

  const handleLoadVideo = async (input: string) => {
    const videoId = extractVideoId(input);
    const title: string = await fetchVideoTitle(videoId);
    setVideoTitle(title);
    setVideoId(videoId);
    setTempVideoId('');
  };

  const handleStoredVideoClick = async (
    videoId: string,
    videoTitle: string,
  ) => {
    setTempVideoId('');
    setVideoId(videoId);
    setVideoTitle(videoTitle);

    const storedSections = JSON.parse(localStorage.getItem(videoId) || '[]');
    setSections(storedSections);
  };

  const handleClearVideo = () => {
    setActiveSectionId(0);
    setVideoId('');
    setStartTime('00:00:00');
    setEndTime('00:00:00');
    setNote('');
    const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
    setVideos(storedVideos);
  };

  const setTimeToCurrent = async (
    setTime: React.Dispatch<React.SetStateAction<string>>
  ): Promise<void> => {
    if (playerRef.current) {
      const currentTime = await playerRef.current.getCurrentTime();
      const hours = Math.floor(currentTime / 3600);
      const minutes = Math.floor((currentTime % 3600) / 60);
      const seconds = Math.floor(currentTime % 60);
      setTime(`${hours}:${formatSeconds(minutes)}:${formatSeconds(seconds)}`);
    }
  };

  const saveSection = async () => {
    const section = {
      id:
        activeSectionId === 0
          ? sections.length > 0
            ? sections[sections.length - 1].id + 1
            : 1
          : sections.find((s) => s.id === activeSectionId)?.id,
      startTime,
      endTime,
      note: note,
    };

    const storedData = JSON.parse(localStorage.getItem(videoId) || '[]');
    if (activeSectionId === 0) {
      storedData.push(section);
    } else {
      const sectionIndex = storedData.findIndex(
        (s: { id: number }) => s.id === activeSectionId,
      );
      if (sectionIndex !== -1) {
        storedData[sectionIndex] = section;
      }
    }
    localStorage.setItem(videoId, JSON.stringify(storedData));
    setSections(storedData);
    seekSection(storedData[storedData.length - 1]);

    const existingVideos = JSON.parse(localStorage.getItem('videos') || '[]');
    const videoEntry = { videoId, videoTitle };
    if (
      !existingVideos.some(
        (video: { videoId: string }) => video.videoId === videoId,
      )
    ) {
      existingVideos.push(videoEntry);
      localStorage.setItem('videos', JSON.stringify(existingVideos));
    }
  };

  const seekSection = (section: {
    id: number;
    startTime: string;
    endTime: string;
    note: string;
  }) => {
    setActiveSectionId(section.id);
    setStartTime(section.startTime);
    setEndTime(section.endTime);
    setNote(section.note);
  };

  const clearSection = () => {
    setActiveSectionId(0);
    setStartTime('00:00:00');
    setEndTime('00:00:00');
    setNote('');
  };

  const deleteSection = (id: number) => {
    if (window.confirm('Delete this section?')) {
      const existingSections = JSON.parse(
        localStorage.getItem(videoId) || '[]',
      );
      const sectionIndex = existingSections.findIndex(
        (s: { id: number }) => s.id === id,
      );
      if (sectionIndex !== -1) {
        existingSections.splice(sectionIndex, 1);
        if (existingSections.length === 0) {
          const existingVideos = JSON.parse(
            localStorage.getItem('videos') || '[]',
          );
          const updatedVideos = existingVideos.filter(
            (video: { videoId: string }) => video.videoId !== videoId,
          );
          localStorage.setItem('videos', JSON.stringify(updatedVideos));
          setVideos(updatedVideos);
          localStorage.removeItem(videoId);
          clearSection();
        } else {
          localStorage.setItem(videoId, JSON.stringify(existingSections));
          if (activeSectionId === id) {
            clearSection();
          }
        }
        setSections(existingSections);
      }
    }
  };

  const handleClickSection = (section: {
    id: number;
    startTime: string;
    endTime: string;
    note: string;
  }) => {
    if (activeSectionId === section.id) {
      clearSection();
    } else {
      seekSection(section);
    }
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
              role={'list'}
            >
              {videos.map((video) => (
                <li
                  key={video.videoId}
                  className={
                    'p-3 flex items-center space-x-1 justify-between first:rounded-t last:rounded-b bg-slate-50 hover:bg-white active:bg-white'
                  }
                  onClick={() =>
                    handleStoredVideoClick(video.videoId, video.videoTitle)
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
                onChange={(e) => setTempVideoId(e.target.value)}
                className={'textbox w-full'}
              />
              <button
                type={'button'}
                onClick={() => handleLoadVideo(tempVideoId)}
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
            <div className={'flex-col items-center space-y-2'}>
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`flex-col card ${
                    activeSectionId === section.id
                      ? 'bg-sky-100 border-sky-200 border-3'
                      : ''
                  }`}
                  onClick={() => handleClickSection(section)}
                >
                  <div className={'flex justify-between'}>
                    <div className={'text-md'}>
                      {`${section.startTime} - ${section.endTime}`}
                    </div>
                    <button
                      type={'button'}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      className={'hover:text-slate-500 active:text-slate-500'}
                    >
                      <span className={'sr-only'}>Delete</span>
                      <FaRegTrashAlt />
                    </button>
                  </div>
                  <div className={'text-sm text-gray-600 truncate'}>
                    {section.note}
                  </div>
                </div>
              ))}
            </div>
            <hr className={'my-4 border-gray-300'} />
          </div>
        )}
        {videoId && (
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
        )}
        {videoId && (
          <>
            <hr className={'my-4 border-gray-300'} />
            <button
              type={'button'}
              onClick={handleClearVideo}
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
        <div className={'text-xs'}>©FAVOREPEAT</div>
      </footer>
    </div>
  );
}

export default App;
