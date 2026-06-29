import { useRef, useState } from 'react'
import { Play, Pause, Volume2, Maximize } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  poster?: string
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setPlaying(!playing)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    videoRef.current.requestFullscreen()
  }

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-black shadow-2xl">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        className="w-full aspect-video object-contain"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Volume2 className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
