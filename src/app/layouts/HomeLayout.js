"use client"

import HomeSidebar from "../components/HomeSidebar";

export default function HomeLayout({ children }) {
  return (
    <div className=" bg-black  flex h-screen  text-white">
      {/* 🔥 Sidebar */}
      <HomeSidebar />

      {/* 🔥 Main Content */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
