'use client';
import { useState } from 'react';

const itemBase =
  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition';

const SectionTitle = ({ children }) => (
  <div className="px-3 pt-6 pb-2 text-[13px] font-semibold text-gray-400">{children}</div>
);

// Simple inline icons to avoid extra deps (swap with your icon set if you want)
const Icon = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  Explore: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    </svg>
  ),
  Images: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M21 17l-6-6-5 5-3-3-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Videos: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M21 8v8l-4-2.5V10.5L21 8z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M8 21h8M12 17v4M6 4h12v3a6 6 0 01-12 0V4zM6 7H4a3 3 0 003 3M18 7h2a3 3 0 01-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  Heart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M12.1 20s-7.1-4.6-9-8.3C1.8 9.1 3.3 6 6.6 6c2.2 0 3.5 1.6 3.5 1.6S11.4 6 13.6 6c3.3 0 4.8 3.1 3.5 5.7-1.9 3.7-9 8.3-9 8.3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Folder: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M3 7h6l2 2h10v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  Star: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M12 3l2.7 5.6L21 10l-4.5 4.1L17.4 21 12 17.9 6.6 21l1-6.9L3 10l6.3-1.4L12 3z" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  PlusFolder: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M3 8h6l2 2h10v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

export default function Sidebar({ onNavigate, active = 'Explore' }) {
  const [open, setOpen] = useState(false); // for mobile

  const NavItem = ({ icon: I, label, kbd }) => (
    <button
      onClick={() => {
        onNavigate?.(label);
        setOpen(false);
      }}
      className={[
        itemBase,
        active === label ? 'bg-white/10 text-white ring-1 ring-white/15' : '',
      ].join(' ')}
    >
      <I />
      <span className="flex-1 text-left">{label}</span>
      {kbd && (
        <span className="rounded-lg px-1.5 py-0.5 text-[10px] text-gray-300 bg-white/5 ring-1 ring-white/10">
          {kbd}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sm:hidden fixed left-3 top-3 z-40 rounded-xl bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/15"
        onClick={() => setOpen((v) => !v)}
      >
        Menu
      </button>

      <aside
        className={[
          'fixed z-30 top-0 left-0 h-full w-72 bg-black/90 backdrop-blur',
          'ring-1 ring-white/10 border-r border-white/5',
          'px-2 py-4 flex flex-col gap-2',
          'transition-transform sm:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full sm:translate-x-0',
        ].join(' ')}
      >
        {/* Search */}
      

        {/* Primary */}
        <NavItem icon={Icon.Explore} label="Explore" />
        <NavItem icon={Icon.Images} label="Images" />
        <NavItem icon={Icon.Videos} label="Videos" />
        <NavItem icon={Icon.Trophy} label="Top" />
        <NavItem icon={Icon.Heart} label="Likes" />

        {/* Divider */}
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Library */}
        <SectionTitle>Library</SectionTitle>
        <NavItem icon={Icon.Folder} label="My media" />
        <NavItem icon={Icon.Star} label="Favorites" />
        <NavItem icon={Icon.Upload} label="Uploads" />
        <NavItem icon={Icon.Trash} label="Trash" />
        <NavItem icon={Icon.PlusFolder} label="New folder" />
      </aside>
    </>
  );
}
