// components/TemplateLauncherChip.jsx
import { useState } from 'react';

const templates = [
  { title: 'Cinematic city rain', text: 'wide shot of neon city in rain...' },
  { title: 'Cozy cabin', text: 'warm wooden cabin, flickering fireplace...' },
  { title: 'Spacewalk', text: 'astronaut floating, stars, earth below...' },
];

export default function TemplateLauncherChip({ onSendToPrompt }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-3 rounded-lg ring-1 ring-white/10 bg-white/5 hover:bg-white/10 text-gray-200
                   shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]
                   hover:shadow-[0_0_24px_-6px_rgba(99,102,241,.65)] transition"
        title="Templates"
      >
        Templates
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[380px] p-2 rounded-xl bg-[#0b0d12]/95 ring-1 ring-white/10 backdrop-blur-xl
                     shadow-[0_20px_70px_-20px_rgba(0,0,0,.6)]"
        >
          <div className="grid grid-cols-3 gap-2">
            {templates.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  onSendToPrompt?.({ text: t.text });
                  setOpen(false);
                }}
                className="group text-left rounded-xl p-3 bg-white/[0.04] ring-1 ring-white/10 hover:ring-white/20
                           hover:bg-white/[0.08] transition relative overflow-hidden"
              >
                {/* soft gradient corner accent */}
                <span className="pointer-events-none absolute -top-6 -right-6 w-24 h-24
                                 bg-gradient-to-br from-fuchsia-500/25 via-indigo-500/20 to-cyan-400/20
                                 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition" />
                <div className="text-[11px] text-gray-300 font-medium">{t.title}</div>
                <div className="mt-1 text-[10px] text-gray-400 line-clamp-3">{t.text}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
