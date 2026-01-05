'use client'
import { Play, Pause, Square, Image as ImageIcon, Scissors, Settings, Maximize2 } from 'lucide-react'
import { useRef, useState } from 'react'

export default function VideoBoard({ video, className = '' }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) } else { el.pause(); setPlaying(false) }
  }

  return (
    <section className={`grid grid-cols-12 gap-4 items-start ${className}`}>
      {/* Left tools rail */}
      <aside className="col-span-12 lg:col-span-3">
        <div className="surface-2 p-3 rounded-2xl min-h-[120px] flex items-start justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="hint">Creation:</span>
            <button className="badge-sora">All ▾</button>
          </div>
        </div>
      </aside>

      {/* Center: video player */}
      <div className="col-span-12 lg:col-span-7">
        <div className="relative bg-black/70 rounded-3xl overflow-hidden border border-white/10">
          {/* toolbar (top-left) */}
          <div className="absolute left-3 top-3 z-10 glass rounded-xl px-2 py-2 grid grid-flow-col auto-cols-max gap-2">
            <IconBtn icon={<Scissors className="h-4 w-4" />} />
            <IconBtn icon={<ImageIcon className="h-4 w-4" />} />
            <IconBtn icon={<Settings className="h-4 w-4" />} />
            <IconBtn icon={<Maximize2 className="h-4 w-4" />} />
          </div>

          {/* action cluster (top-right) */}
          <div className="absolute right-3 top-3 z-10">
            <div className="glass rounded-xl px-3 py-2 text-sm">•••</div>
          </div>

          {/* the video */}
          <video
            ref={ref}
            src={video.src}
            poster={video.poster}
            preload="metadata"
            className="w-full h-[360px] md:h-[440px] lg:h-[520px] object-cover"
            onClick={toggle}
          />

          {/* controls bar (bottom) */}
          <div className="absolute left-0 right-0 bottom-0 p-3">
            <div className="glass rounded-2xl px-3 py-2 flex items-center gap-3">
              <button onClick={toggle} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/15 grid place-items-center">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="relative h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/6 bg-white/60" />
              </div>
              <span className="tnum text-xs opacity-80">00:01 / 00:05</span>
              <Square className="h-4 w-4 opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: task panel */}
      <aside className="col-span-12 lg:col-span-2">
        <div className="surface-2 rounded-2xl p-4 space-y-4">
          <div className="text-sm opacity-80">Text to video</div>
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <span className="dock-chip glass text-xs">Wan2.5</span>
              <span className="dock-chip glass text-xs">720p</span>
              <span className="dock-chip glass text-xs">16:9</span>
            </div>
            <div className="text-xs opacity-60">Creation Time</div>
            <div className="text-xs opacity-80">02 Oct 2025 16:16:00</div>
          </div>

          <div className="flex gap-2">
            <button className="btn-sora flex-1">Use</button>
            <button className="btn-sora-ghost flex-1">Rerun</button>
          </div>
        </div>
      </aside>
    </section>
  )
}

function IconBtn({ icon }) {
  return (
    <button className="h-8 w-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
      {icon}
    </button>
  )
}
