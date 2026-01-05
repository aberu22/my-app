"use client"
import CreateSidebar from "../components/CreateSidebar";

export default function HomeLayout({ children }) {
  return (
    <div className=" bg-black  flex h-screen  text-white">
      {/* 🔥 Sidebar */}
      <CreateSidebar />

      {/* 🔥 Main Content */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
