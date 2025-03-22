import {useState, useRef, useEffect} from 'react'
import YouTube, {YouTubeProps, YouTubePlayer} from 'react-youtube'

function App() {

  const playerRef = useRef<YouTubePlayer | null>(null)
  const [startMinutes, setStartMinutes] = useState(2)
  const [startSeconds, setStartSeconds] = useState(0)
  const [endMinutes, setEndMinutes] = useState(2)
  const [endSeconds, setEndSeconds] = useState(5)
  const [videoId, setVideoId] = useState("SR_DgMTC_ho")
  const [isEditing, setIsEditing] = useState(false)
  const [tempVideoId, setTempVideoId] = useState(videoId)
  const [videoHeight, setVideoHeight] = useState('auto')
  const [isRepeating, setIsRepeating] = useState(false)
  const [opts, setOpts] = useState({})

  useEffect(() => {
    const updateVideoHeight = () => {
      const width = window.innerWidth
      const height = (width * 9) / 16
      setVideoHeight(`${height}px`)
    }

    updateVideoHeight()
    window.addEventListener('resize', updateVideoHeight)

    return () => {
      window.removeEventListener('resize', updateVideoHeight)
    }
  }, [])

  useEffect(() => {
    const fetchOpts = async () => {
      const currentTime = await playerRef.current?.getCurrentTime();
      setOpts({
        playerVars: {
          start: isRepeating ? startMinutes * 60 + startSeconds : currentTime,
          end: isRepeating ? endMinutes * 60 + endSeconds : undefined
        },
        width: '100%',
        height: videoHeight
      });
    };

    fetchOpts();
  }, [isRepeating, startMinutes, startSeconds, endMinutes, endSeconds, videoHeight]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target
  }

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === window.YT.PlayerState.ENDED && playerRef.current) {
      if (isRepeating) {
        playerRef.current.seekTo(startMinutes * 60 + startSeconds, true).catch((error) => {
          console.error('Error seeking to start:', error)
        })
      } else {
        playerRef.current.playVideo().catch((error) => {
          console.error('Error playing video:', error)
        })
      }
    }
  }

  const handleSave = () => {
    setVideoId(tempVideoId)
    setIsEditing(false)
  }

  return (
    <>
      <h1 className="text-center text-xl font-bold">BY THE REPEAT</h1>
      <div className="flex flex-col items-center">
        <div className="w-full relative" style={{paddingBottom: '56.25%'}}>
          <div className="absolute top-0 left-0 w-full h-full">
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
            />
          </div>
        </div>
        <div className="m-4">
          <label className="block">
            Video ID:
            <div className="flex items-center">
              <input
                type="text"
                value={tempVideoId}
                onChange={(e) => setTempVideoId(e.target.value)}
                className={"border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"}
                disabled={!isEditing}
              />
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="ml-2 p-2 rounded bg-black text-white"
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </div>
          </label>
          <div className="flex space-x-2 mt-2">
            <label className="block w-full">
              <input
                type="checkbox"
                checked={isRepeating}
                onChange={(e) => setIsRepeating(e.target.checked)}
                className="ml-2"
              /> Repeat
            </label>
          </div>
          <hr className="my-4 border-gray-300"/>
          <div className="flex space-x-2 mt-2">
            <label className="block w-full">
              Start Time:
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={startMinutes}
                  onChange={(e) => setStartMinutes(Number(e.target.value))}
                  className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  disabled={!isRepeating}
                />
                <span>:</span>
                <input
                  type="number"
                  value={startSeconds}
                  onChange={(e) => setStartSeconds(Number(e.target.value))}
                  className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  disabled={!isRepeating}
                />
              </div>
            </label>
          </div>
          <div className="flex space-x-2 mt-2">
            <label className="block w-full">
              End Time:
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={endMinutes}
                  onChange={(e) => setEndMinutes(Number(e.target.value))}
                  className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  disabled={!isRepeating}
                />
                <span>:</span>
                <input
                  type="number"
                  value={endSeconds}
                  onChange={(e) => setEndSeconds(Number(e.target.value))}
                  className="border rounded p-2 w-full border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  disabled={!isRepeating}
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
