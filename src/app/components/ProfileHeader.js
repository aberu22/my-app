export default function ProfileHeader({ profile }) {
  return (
    <div className="flex items-center gap-6 mb-8">
      <div className="h-24 w-24 rounded-full bg-zinc-800 overflow-hidden" />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {profile.displayName}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {profile.bio}
        </p>

        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:opacity-90">
            Follow
          </button>
          <button className="px-4 py-2 rounded-full bg-zinc-800 text-white text-sm hover:bg-zinc-700">
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
