export const metadata = {
  title: "Profile | FantasyVisionAI",
  description: "View and manage user profiles on FantasyVisionAI",
};

export default function ProfileLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
