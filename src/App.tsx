import { useState, useRef } from 'react'
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube'

function App() {

  const playerRef = useRef<YouTubePlayer | null>(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(10)
  const [videoId, setVideoId] = useState("SR_DgMTC_ho")

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target
  }

const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
      if (event.data === window.YT.PlayerState.ENDED && playerRef.current) {
        playerRef.current.seekTo(start, true).catch((error) => {
          console.error('Error seeking to start:', error)
        })
      }
    }

  return (
    <>
      <h1 className="text-center text-xl font-bold">BY THE REPEAT</h1>
      <div className="flex flex-col items-center">
        <div className="w-full">
          <YouTube
            videoId={videoId}
            opts={{ playerVars: { start, end }, width: '100%', height: 'auto' }}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
          />
        </div>
        <div className="mt-4">
          <label className="block">
            Video ID:
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="border rounded p-1 w-full"
            />
          </label>
          <label className="block mt-2">
            Start:
            <input
              type="number"
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
              className="border rounded p-1 w-full"
            />
          </label>
          <label className="block mt-2">
            End:
            <input
              type="number"
              value={end}
              onChange={(e) => setEnd(Number(e.target.value))}
              className="border rounded p-1 w-full"
            />
          </label>
        </div>
      </div>
    </>
  )
}

export default App
