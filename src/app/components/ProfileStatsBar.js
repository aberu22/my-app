export default function ProfileStatsBar({ stats }) {
  const items = [
    ["Published", stats.published],
    ["Likes", stats.likes],
    ["Followers", stats.followers],
    ["Following", stats.following],
  ];

  return (
    <div className="flex gap-6 border-b border-zinc-800 pb-6 mb-6">
      {items.map(([label, value]) => (
        <div key={label}>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs text-zinc-400 uppercase tracking-wide">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
