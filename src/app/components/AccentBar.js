// components/AccentBar.jsx
export default function AccentBar({ className = '' }) {
  return (
    <div
      className={[
        'h-[2px] w-full',
        'bg-gradient-to-r from-fuchsia-500/70 via-indigo-400/70 to-cyan-400/70',
        'blur-[0.3px] rounded-full',
        className,
      ].join(' ')}
    />
  );
}
