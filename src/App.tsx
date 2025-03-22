import {useState, useRef, useEffect} from 'react'
import YouTube, {YouTubeProps, YouTubePlayer} from 'react-youtube'

function App() {

  const playerRef = useRef<YouTubePlayer | null>(null)
  const [startMinutes, setStartMinutes] = useState(0)
  const [startSeconds, setStartSeconds] = useState(0)
  const [endMinutes, setEndMinutes] = useState(0)
  const [endSeconds, setEndSeconds] = useState(10)
  const [videoId, setVideoId] = useState("SR_DgMTC_ho")
  const [isEditing, setIsEditing] = useState(false)
  const [tempVideoId, setTempVideoId] = useState(videoId)
  const [videoHeight, setVideoHeight] = useState('auto')

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

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target
  }

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === window.YT.PlayerState.ENDED && playerRef.current) {
      playerRef.current.seekTo(startMinutes * 60 + startSeconds, true).catch((error) => {
        console.error('Error seeking to start:', error)
      })
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
              opts={{playerVars: {start: startMinutes * 60 + startSeconds, end: endMinutes * 60 + endSeconds}, width: '100%', height: videoHeight}}
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
                className={`border rounded p-1 w-full border-gray-300 ${!isEditing ? 'bg-gray-200 text-gray-500' : ''}`}
                disabled={!isEditing}
              />
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="ml-2 p-1 rounded bg-black text-white"
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </div>
          </label>
          <div className="flex space-x-2 mt-2">
            <label className="block w-full">
              Start Time:
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={startMinutes}
                  onChange={(e) => setStartMinutes(Number(e.target.value))}
                  className="border rounded p-1 w-full border-gray-300"
                />
                <input
                  type="number"
                  value={startSeconds}
                  onChange={(e) => setStartSeconds(Number(e.target.value))}
                  className="border rounded p-1 w-full border-gray-300"
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
                  className="border rounded p-1 w-full border-gray-300"
                />
                <input
                  type="number"
                  value={endSeconds}
                  onChange={(e) => setEndSeconds(Number(e.target.value))}
                  className="border rounded p-1 w-full border-gray-300"
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
