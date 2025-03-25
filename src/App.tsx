import { useCallback, useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import YouTube, { type YouTubeProps, type YouTubePlayer } from 'react-youtube';
import { FaRegTrashAlt } from "react-icons/fa";

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [startHours, setStartHours] = useState(0);
  const [startMinutes, setStartMinutes] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endHours, setEndHours] = useState(0);
  const [endMinutes, setEndMinutes] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [videoId, setVideoId] = useState('');
  const [tempVideoId, setTempVideoId] = useState(videoId);
  const [videoHeight, setVideoHeight] = useState('auto');
  const [isRepeating, setIsRepeating] = useState(false);
  const [opts, setOpts] = useState({});
  const [sections, setSections] = useState<
    {
      key: number;
      startHours: number;
      startMinutes: number;
      startSeconds: number;
      endHours: number;
      endMinutes: number;
      endSeconds: number;
      videoId: string;
      note: string;
      videoTitle: string;
    }[]
  >([]);
  const [tempStartHours, setTempStartHours] = useState(0);
  const [tempStartMinutes, setTempStartMinutes] = useState(0);
  const [tempStartSeconds, setTempStartSeconds] = useState(0);
  const [tempEndHours, setTempEndHours] = useState(0);
  const [tempEndMinutes, setTempEndMinutes] = useState(0);
  const [tempEndSeconds, setTempEndSeconds] = useState(0);
  const [activeSectionKey, setActiveSectionKey] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const formatSeconds = (seconds: number) => {
    return seconds.toString().padStart(2, '0');
  };

  const updateOpts = useCallback(() => {
    const currentTime = playerRef.current?.getCurrentTime();
    setOpts({
      playerVars: {
        start: isRepeating
          ? startHours * 3600 + startMinutes * 60 + startSeconds
          : currentTime,
        end: isRepeating
          ? endHours * 3600 + endMinutes * 60 + endSeconds
          : undefined,
      },
      width: '100%',
      height: Number.parseInt(videoHeight) > 252 ? '252px' : videoHeight,
    });
  }, [
    isRepeating,
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
    updateOpts();
  }, [updateOpts]);

  useEffect(() => {
    const savedSections = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !Number.isNaN(Number(key))) {
        const section = JSON.parse(localStorage.getItem(key) || '{}');
        savedSections.push({ key: Number(key), ...section });
      }
    }
    savedSections.sort((a, b) => a.key - b.key);
    setSections(savedSections);
  }, []);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === window.YT.PlayerState.ENDED && playerRef.current) {
      if (isRepeating) {
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
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`
      );
      const data = await response.json();
      if (data.items.length > 0) {
        console.log('Video title:', data.items[0].snippet.title);
        return data.items[0].snippet.title;
      }
    } catch (error) {
      console.error('Error fetching video title:', error);
    }
  };

  const handleLoadVideo = async () => {
    const title = await fetchVideoTitle(tempVideoId);
    setVideoTitle(title);
    setVideoId(tempVideoId);
  };

  const handleClearVideo = () => {
    setIsRepeating(false);
    setActiveSectionKey(null);
    setVideoId('');
    setTempVideoId('');
    setStartHours(0);
    setStartMinutes(0);
    setStartSeconds(0);
    setEndHours(0);
    setEndMinutes(0);
    setEndSeconds(0);
    setTempStartMinutes(0);
    setTempStartSeconds(0);
    setTempEndMinutes(0);
    setTempEndSeconds(0);
    setNote('');
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
      startHours: tempStartHours,
      startMinutes: tempStartMinutes,
      startSeconds: tempStartSeconds,
      endHours: tempEndHours,
      endMinutes: tempEndMinutes,
      endSeconds: tempEndSeconds,
      note: note,
    };
    const sectionData = {
      videoId,
      videoTitle,
      startHours: section.startHours,
      startMinutes: section.startMinutes,
      startSeconds: section.startSeconds,
      endHours: section.endHours,
      endMinutes: section.endMinutes,
      endSeconds: section.endSeconds,
      note: section.note,
    };

    if (activeSectionKey === null) {
      const keys = Object.keys(localStorage)
        .map(Number)
        .filter((key) => !Number.isNaN(key));
      const maxKey = keys.length > 0 ? Math.max(...keys) : -1;
      const newKey = maxKey + 1;
      localStorage.setItem(`${newKey}`, JSON.stringify(sectionData));
      const newSection = { key: newKey, ...section, videoId, videoTitle };
      setSections((prevSections) => [...prevSections, newSection]);
      loadSection(newSection);
    } else {
      localStorage.setItem(`${activeSectionKey}`, JSON.stringify(sectionData));
      setSections((prevSections) =>
        prevSections.map((sec) =>
          sec.key === activeSectionKey
            ? { key: activeSectionKey, ...section, videoId, videoTitle }
            : sec,
        ),
      );
    }
  };

  const setSection = (section: {
    startHours: number;
    startMinutes: number;
    startSeconds: number;
    endHours: number;
    endMinutes: number;
    endSeconds: number;
    videoId: string;
  }) => {
    setIsRepeating(true);
    setStartHours(section.startHours);
    setStartMinutes(section.startMinutes);
    setStartSeconds(section.startSeconds);
    setEndHours(section.endHours);
    setEndMinutes(section.endMinutes);
    setEndSeconds(section.endSeconds);
    setVideoId(section.videoId);
    setTempVideoId(section.videoId);
  };

  const loadSection = (section: {
    startHours: number;
    startMinutes: number;
    startSeconds: number;
    endHours: number;
    endMinutes: number;
    endSeconds: number;
    videoId: string;
    key: number;
    note: string;
    videoTitle: string;
  }) => {
    setSection(section);
    setActiveSectionKey(section.key);
    setTempStartHours(section.startHours);
    setTempStartMinutes(section.startMinutes);
    setTempStartSeconds(section.startSeconds);
    setTempEndHours(section.endHours);
    setTempEndMinutes(section.endMinutes);
    setTempEndSeconds(section.endSeconds);
    setNote(section.note);
    setVideoTitle(section.videoTitle);
  };

  const clearSection = () => {
    setIsRepeating(false);
    setActiveSectionKey(null);
    playerRef.current?.pauseVideo();
    setTempStartHours(0);
    setTempStartMinutes(0);
    setTempStartSeconds(0);
    setTempEndHours(0);
    setTempEndMinutes(0);
    setTempEndSeconds(0);
    setNote('');
  };

  const deleteSection = (key: number) => {
    if (window.confirm('Delete this section?')) {
      localStorage.removeItem(`${key}`);
      setSections((prevSections) =>
        prevSections.filter((section) => section.key !== key),
      );
    }
  };

  return (
    <>
      <h1 className="text-center text-xl font-bold">BY THE REPEAT</h1>
      <div className="flex flex-col items-center">
        <div
          className="w-full relative"
          style={{ maxWidth: '448px', maxHeight: '252px' }}
        >
          <div className="w-full h-full">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
            />
          </div>
        </div>
        <div className="m-4 px-3 w-full max-w-md">
          <div className="block">
            <label htmlFor="videoId" className="text-sm font-bold">
              Video ID
            </label>
            <div className="flex items-center">
              <input
                id="videoId"
                type="text"
                value={tempVideoId}
                onChange={(e) => setTempVideoId(e.target.value)}
                className={
                  'border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500'
                }
                disabled={videoId !== ''}
              />
              <button
                type={'button'}
                onClick={videoId ? handleClearVideo : handleLoadVideo}
                className="ml-2 p-2 rounded bg-black text-white"
              >
                {videoId ? 'Clear' : 'Load'}
              </button>
            </div>
          </div>
          {videoId && (
            <div className="mt-2">
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
                    className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  />
                  <span className="mx-1">:</span>
                  <label htmlFor="startMinutes" className="sr-only">
                    Start Minutes
                  </label>
                  <input
                    id="startMinutes"
                    type="tel"
                    value={formatSeconds(tempStartMinutes)}
                    onChange={(e) =>
                      setTempStartMinutes(Number(e.target.value))
                    }
                    className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  />
                  <span className="mx-1">:</span>
                  <label htmlFor="startSeconds" className="sr-only">
                    Start Seconds
                  </label>
                  <input
                    id="startSeconds"
                    type="tel"
                    value={formatSeconds(tempStartSeconds)}
                    onChange={(e) =>
                      setTempStartSeconds(Number(e.target.value))
                    }
                    className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
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
                    className="ml-2 p-2 rounded bg-black text-white"
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
                    className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
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
                    className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
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
                    className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
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
                    className="ml-2 p-2 rounded bg-black text-white"
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
                  className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                />
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  type={'button'}
                  onClick={() => saveSection()}
                  className="p-2 w-full rounded bg-black text-white disabled:bg-gray-600 disabled:text-gray-400"
                >
                  Save Section
                </button>
                <button
                  type={'button'}
                  onClick={() => clearSection()}
                  className="p-2 w-full rounded bg-black text-white disabled:bg-gray-600 disabled:text-gray-400"
                >
                  Reset Section
                </button>
              </div>
            </div>
          )}
          {sections.length > 0 && (
            <div className="mt-5">
              <hr className="my-2 border-gray-300" />
              <h2 className="mt-5 text-sm font-bold">Sections</h2>
              {sections.map((section) => (
                <div
                  key={section.key}
                  className={`p-2 flex items-center rounded ${activeSectionKey === section.key ? 'bg-gray-100' : ''}`}
                  onClick={() => loadSection(section)}
                >
                  <input
                    type="radio"
                    name="section"
                    checked={activeSectionKey === section.key}
                    onChange={() => loadSection(section)}
                  />
                  <div className="flex-1 overflow-hidden mx-2">
                      <div className="text-xs truncate">{section.videoTitle}</div>
                      <div className="text-xs text-gray-500">
                        {section.startHours}:
                        {formatSeconds(section.startMinutes)}:
                        {formatSeconds(section.startSeconds)}-{section.endHours}
                        :{formatSeconds(section.endMinutes)}:
                        {formatSeconds(section.endSeconds)}
                      </div>
                    {section.note && (
                      <div className="mt-1 text-sm text-gray-600 truncate">
                        {section.note}
                      </div>
                    )}
                  </div>
                  <button
                    type={'button'}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSection(section.key);
                    }}
                    className="p-2 border rounded border-gray-300 bg-white"
                  >
                    <span className="sr-only">Delete</span>
                    <FaRegTrashAlt />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
