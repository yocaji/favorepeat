import { useState, useRef } from 'react'
import './App.css'
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
      <h1>Kaelipse</h1>
      <div>
        <YouTube
          videoId={videoId}
          opts={{ playerVars: { start, end } }}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
        <div>
          <label>
            Video ID:
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
            />
          </label>
          <label>
            Start:
            <input
              type="number"
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
            />
          </label>
          <label>
            End:
            <input
              type="number"
              value={end}
              onChange={(e) => setEnd(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </>
  )
}

export default App
