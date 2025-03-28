import { useCallback, useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import { FaRegTrashAlt } from 'react-icons/fa';
import YouTube, { type YouTubeProps, type YouTubePlayer } from 'react-youtube';

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [startHours, setStartHours] = useState(0);
  const [startMinutes, setStartMinutes] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endHours, setEndHours] = useState(0);
  const [endMinutes, setEndMinutes] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
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
      startHours: number;
      startMinutes: number;
      startSeconds: number;
      endHours: number;
      endMinutes: number;
      endSeconds: number;
      note: string;
    }[]
  >([]);
  const [tempStartHours, setTempStartHours] = useState(0);
  const [tempStartMinutes, setTempStartMinutes] = useState(0);
  const [tempStartSeconds, setTempStartSeconds] = useState(0);
  const [tempEndHours, setTempEndHours] = useState(0);
  const [tempEndMinutes, setTempEndMinutes] = useState(0);
  const [tempEndSeconds, setTempEndSeconds] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<number>(0);
  const [note, setNote] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const formatSeconds = (seconds: number) => {
    return seconds.toString().padStart(2, '0');
  };

  const updateOpts = useCallback(() => {
    const currentTime = playerRef.current?.getCurrentTime();
    setOpts({
      playerVars: {
        autoplay: activeSectionId > 0 ? 1 : 0,
        start: !videoId
          ? undefined
          : activeSectionId > 0
            ? startHours * 3600 + startMinutes * 60 + startSeconds
            : currentTime,
        end:
          activeSectionId > 0
            ? endHours * 3600 + endMinutes * 60 + endSeconds
            : undefined,
      },
      width: '100%',
      height: Number.parseInt(videoHeight) > 252 ? '252px' : videoHeight,
    });
  }, [
    videoId,
    activeSectionId,
    startHours,
    startMinutes,
    startSeconds,
    endHours,
    endMinutes,
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

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === window.YT.PlayerState.ENDED && playerRef.current) {
      if (activeSectionId > 0) {
        playerRef.current
          .seekTo(startHours * 3600 + startMinutes * 60 + startSeconds, true)
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
    const storedSections = JSON.parse(localStorage.getItem(videoId) || '[]');
    setSections(storedSections);
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
    setStartHours(0);
    setStartMinutes(0);
    setStartSeconds(0);
    setEndHours(0);
    setEndMinutes(0);
    setEndSeconds(0);
    setTempStartHours(0);
    setTempStartMinutes(0);
    setTempStartSeconds(0);
    setTempEndHours(0);
    setTempEndMinutes(0);
    setTempEndSeconds(0);
    setNote('');
    const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
    setVideos(storedVideos);
  };

  const setTimeToCurrent = async (
    setHours: React.Dispatch<React.SetStateAction<number>>,
    setMinutes: React.Dispatch<React.SetStateAction<number>>,
    setSeconds: React.Dispatch<React.SetStateAction<number>>,
  ): Promise<void> => {
    if (playerRef.current) {
      const currentTime = await playerRef.current.getCurrentTime();
      setHours(Math.floor(currentTime / 3600));
      setMinutes(Math.floor((currentTime % 3600) / 60));
      setSeconds(Math.floor(currentTime % 60));
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
      startHours: tempStartHours,
      startMinutes: tempStartMinutes,
      startSeconds: tempStartSeconds,
      endHours: tempEndHours,
      endMinutes: tempEndMinutes,
      endSeconds: tempEndSeconds,
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

  const setSection = (section: {
    id: number;
    startHours: number;
    startMinutes: number;
    startSeconds: number;
    endHours: number;
    endMinutes: number;
    endSeconds: number;
  }) => {
    setStartHours(section.startHours);
    setStartMinutes(section.startMinutes);
    setStartSeconds(section.startSeconds);
    setEndHours(section.endHours);
    setEndMinutes(section.endMinutes);
    setEndSeconds(section.endSeconds);
  };

  const seekSection = (section: {
    id: number;
    startHours: number;
    startMinutes: number;
    startSeconds: number;
    endHours: number;
    endMinutes: number;
    endSeconds: number;
    note: string;
  }) => {
    setSection(section);
    setActiveSectionId(section.id);
    setTempStartHours(section.startHours);
    setTempStartMinutes(section.startMinutes);
    setTempStartSeconds(section.startSeconds);
    setTempEndHours(section.endHours);
    setTempEndMinutes(section.endMinutes);
    setTempEndSeconds(section.endSeconds);
    setNote(section.note);
  };

  const clearSection = () => {
    setActiveSectionId(0);
    setTempStartHours(0);
    setTempStartMinutes(0);
    setTempStartSeconds(0);
    setTempEndHours(0);
    setTempEndMinutes(0);
    setTempEndSeconds(0);
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
    startHours: number;
    startMinutes: number;
    startSeconds: number;
    endHours: number;
    endMinutes: number;
    endSeconds: number;
    note: string;
  }) => {
    if (activeSectionId === section.id) {
      clearSection();
    } else {
      seekSection(section);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!videoId && (
        <h1 className="text-center text-xl font-bold">BY THE REPEAT</h1>
      )}
      {videoId && (
        <div
          className="w-full h-full relative"
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
      <div className="m-4 px-3 w-full max-w-md">
        {!videoId && videos.length > 0 && (
          <div>
            <h2 className="text-sm font-bold">Stored Videos</h2>
            <div className="flex-col space-y-2">
              {videos.map((video) => (
                <button
                  type={'button'}
                  key={video.videoId}
                  className="card"
                  onClick={() =>
                    handleStoredVideoClick(video.videoId, video.videoTitle)
                  }
                >
                  <div className="truncate">{video.videoTitle}</div>
                  <div className="text-xs text-gray-600">{video.videoId}</div>
                </button>
              ))}
            </div>
            <hr className="my-4 border-gray-300" />
          </div>
        )}
        {!videoId && (
          <div>
            <label htmlFor="videoId" className="text-sm font-bold">
              Video ID or URL
            </label>
            <div className="flex items-center">
              <input
                id="videoId"
                type="text"
                value={tempVideoId}
                onChange={(e) => setTempVideoId(e.target.value)}
                className="textbox w-full"
              />
              <button
                type={'button'}
                onClick={() => handleLoadVideo(tempVideoId)}
                className="ml-2 btn btn-primary"
              >
                Load
              </button>
            </div>
          </div>
        )}
        {videoId && sections.length > 0 && (
          <div className="mt-2">
            <h2 className="text-sm font-bold">Sections</h2>
            <div className="flex-col items-center space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`flex-col card ${
                    activeSectionId === section.id ? 'bg-slate-200' : ''
                  }`}
                  onClick={() => handleClickSection(section)}
                >
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-bold mr-2">{section.id}</span>
                      {section.startHours}:{formatSeconds(section.startMinutes)}
                      :{formatSeconds(section.startSeconds)}-{section.endHours}:
                      {formatSeconds(section.endMinutes)}:
                      {formatSeconds(section.endSeconds)}
                    </div>
                    <button
                      type={'button'}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      className="text-slate-800 hover:text-slate-500 active:text-slate-500"
                    >
                      <span className="sr-only">Delete</span>
                      <FaRegTrashAlt />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {section.note}
                  </div>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-300" />
          </div>
        )}
        {videoId && (
          <>
            <div className="block">
              <span className="text-sm font-bold">Start from</span>
              <div className="flex items-center">
                <label htmlFor="startHours" className="sr-only">
                  Start Hours
                </label>
                <input
                  id="startHours"
                  type="tel"
                  value={tempStartHours}
                  onChange={(e) => setTempStartHours(Number(e.target.value))}
                  className="w-full textbox"
                />
                <span className="mx-1">:</span>
                <label htmlFor="startMinutes" className="sr-only">
                  Start Minutes
                </label>
                <input
                  id="startMinutes"
                  type="tel"
                  value={formatSeconds(tempStartMinutes)}
                  onChange={(e) => setTempStartMinutes(Number(e.target.value))}
                  className="w-full textbox"
                />
                <span className="mx-1">:</span>
                <label htmlFor="startSeconds" className="sr-only">
                  Start Seconds
                </label>
                <input
                  id="startSeconds"
                  type="tel"
                  value={formatSeconds(tempStartSeconds)}
                  onChange={(e) => setTempStartSeconds(Number(e.target.value))}
                  className="w-full textbox"
                />
                <button
                  type={'button'}
                  onClick={() =>
                    setTimeToCurrent(
                      setTempStartHours,
                      setTempStartMinutes,
                      setTempStartSeconds,
                    )
                  }
                  className="ml-2 btn btn-secondary"
                >
                  Now
                </button>
              </div>
            </div>
            <div className="block mt-2">
              <span className="text-sm font-bold">End at</span>
              <div className="flex items-center">
                <label htmlFor="endHours" className="sr-only">
                  End Hours
                </label>
                <input
                  id="endHours"
                  type="tel"
                  value={tempEndHours}
                  onChange={(e) => setTempEndHours(Number(e.target.value))}
                  className="w-full textbox"
                />
                <span className="mx-1">:</span>
                <label htmlFor="endMinutes" className="sr-only">
                  End Minutes
                </label>
                <input
                  id="endMinutes"
                  type="tel"
                  value={formatSeconds(tempEndMinutes)}
                  onChange={(e) => setTempEndMinutes(Number(e.target.value))}
                  className="w-full textbox"
                />
                <span className="mx-1">:</span>
                <label htmlFor="endSeconds" className="sr-only">
                  End Seconds
                </label>
                <input
                  id="endSeconds"
                  type="tel"
                  value={formatSeconds(tempEndSeconds)}
                  onChange={(e) => setTempEndSeconds(Number(e.target.value))}
                  className="w-full textbox"
                />
                <button
                  type={'button'}
                  onClick={() =>
                    setTimeToCurrent(
                      setTempEndHours,
                      setTempEndMinutes,
                      setTempEndSeconds,
                    )
                  }
                  className="ml-2 btn btn-secondary"
                >
                  Now
                </button>
              </div>
            </div>
            <div className="block mt-2">
              <span className="text-sm font-bold">Note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full textbox"
              />
            </div>
            <button
              type={'button'}
              onClick={() => saveSection()}
              className="mt-4 w-full btn btn-primary"
            >
              {activeSectionId !== 0 ? 'Update Section' : 'Add Section'}
            </button>
          </>
        )}
        {videoId && (
          <>
            <hr className="my-4 border-gray-300" />
            <button
              type={'button'}
              onClick={handleClearVideo}
              className="w-full flex items-center justify-center btn btn-secondary"
            >
              Close this video
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
