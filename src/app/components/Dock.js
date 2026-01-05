'use client';
import { Plus, Monitor, Image as ImageIcon, Timer, Settings, HelpCircle } from 'lucide-react';

export default function Dock() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center dock-safe-area px-4">
      <div className="glass w-full max-w-4xl rounded-3xl px-4 py-3 flex items-center gap-3">
        <button className="h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/15 grid place-items-center">
          <Plus className="h-5 w-5" />
        </button>

        <input
          className="input-sora flex-1 bg-white/5 border-white/10"
          placeholder="Describe your video…"
        />

        <div className="hidden sm:flex items-center gap-2">
          <Chip icon={<Monitor className="h-4 w-4" />} label="2:3" />
          <Chip icon={<ImageIcon className="h-4 w-4" />} label="480p" />
          <Chip icon={<Timer className="h-4 w-4" />} label="5s" />
          <Chip icon={<Settings className="h-4 w-4" />} />
          <Chip icon={<HelpCircle className="h-4 w-4" />} label="?" />
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <span className="dock-chip glass inline-flex items-center gap-1 text-xs">
      {icon}{label && <span>{label}</span>}
    </span>
  );
}
