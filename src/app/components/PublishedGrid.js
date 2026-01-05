export default function PublishedGrid({ username }) {
  // Replace with real fetch later
  const items = [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <div className="text-sm">
          You haven’t published any works yet.
        </div>
        <button className="mt-4 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm">
          Publish from Assets
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* map published items here */}
    </div>
  );
}
