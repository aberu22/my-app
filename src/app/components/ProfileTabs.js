export default function ProfileTabs() {
  const tabs = ["All", "Images", "Videos", "Likes"];

  return (
    <div className="flex gap-6 mb-6 text-sm text-zinc-400">
      {tabs.map((tab) => (
        <button
          key={tab}
          className="hover:text-white transition border-b-2 border-transparent hover:border-white pb-2"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
