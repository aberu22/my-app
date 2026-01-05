'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // <-- adjust to your init path

import {
  Image as ImageIcon, // kept in case you use it elsewhere
  User,
  Settings,
  LogOut,
  Sparkles,
  Folder as FolderIcon,
  Crown,
} from 'lucide-react';

/* --------------------------- styles / utilities --------------------------- */

const itemBase =
  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition';

const SectionTitle = ({ children, hidden }) => (
  <div
    className={[
      'px-3 pt-6 pb-2 text-[13px] font-semibold text-gray-400 transition-opacity',
      hidden ? 'opacity-0 pointer-events-none select-none h-0 p-0 !m-0' : '',
    ].join(' ')}
  >
    {children}
  </div>
);

/* --------------------------------- Icons --------------------------------- */
/** 
 * All icons accept { active } to subtly fill/thicken when their route is active.
 * Decorative SVGs are aria-hidden and unfocusable for better a11y.
 */
const strokeW = (active, base = 1.4, thick = 1.8) => (active ? thick : base);

const Icon = {
  Explore: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <path
        d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z"
        stroke="currentColor"
        strokeWidth={strokeW(active)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  ),
  Images: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth={strokeW(active, 1.6, 2)} />
      <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth={strokeW(active)} />
      <path d="M21 17l-6-6-5 5-3-3-4 4" stroke="currentColor" strokeWidth={strokeW(active, 1.6, 2)} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Home: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"
        stroke="currentColor"
        strokeWidth={strokeW(active)}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  ),
  Videos: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth={strokeW(active, 1.6, 2)} />
      <path d="M21 8v8l-4-2.5V10.5L21 8z" stroke="currentColor" strokeWidth={strokeW(active, 1.6, 2)} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Heart: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <path
        d="M12.1 20s-7.1-4.6-9-8.3C1.8 9.1 3.3 6 6.6 6c2.2 0 3.5 1.6 3.5 1.6S11.4 6 13.6 6c3.3 0 4.8 3.1 3.5 5.7-1.9 3.7-9 8.3-9 8.3z"
        stroke="currentColor"
        strokeWidth={strokeW(active, 1.6, 2)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  ),
  Folder: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <path
        d="M3 7h6l2 2h10v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        stroke="currentColor"
        strokeWidth={strokeW(active, 1.6, 2)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  ),
  Star: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <path
        d="M12 3l2.7 5.6L21 10l-4.5 4.1L17.4 21 12 17.9 6.6 21l1-6.9L3 10l6.3-1.4L12 3z"
        stroke="currentColor"
        strokeWidth={strokeW(active)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  ),

  FaceSwap: ({ active }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    className="opacity-90"
    aria-hidden="true"
    focusable="false"
  >
    {/* Left face */}
    <path
      d="M8.5 8.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 18c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Right face */}
    <path
      d="M15.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.5 17.5c.3-1.9 1.9-3.5 4-3.5 1.2 0 2.3.5 3.1 1.3"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Swap arrows */}
    <path
      d="M9 11h6m0 0-2-2m2 2-2 2"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
),
FaceSwap: ({ active }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    className="opacity-90"
    aria-hidden="true"
    focusable="false"
  >
    {/* Left face */}
    <path
      d="M8.5 8.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 18c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Right face */}
    <path
      d="M15.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.5 17.5c.3-1.9 1.9-3.5 4-3.5 1.2 0 2.3.5 3.1 1.3"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Swap arrows */}
    <path
      d="M9 11h6m0 0-2-2m2 2-2 2"
      stroke="currentColor"
      strokeWidth={strokeW(active, 1.6, 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
),

Pricing: ({ active }) => (
  <Crown
    size={18}
    className="opacity-90"
    strokeWidth={active ? 2 : 1.6}
  />
),


 
  Trash: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12"
        stroke="currentColor"
        strokeWidth={strokeW(active, 1.6, 2)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  PlusFolder: ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true" focusable="false">
      <path
        d="M3 8h6l2 2h10v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
        stroke="currentColor"
        strokeWidth={strokeW(active, 1.6, 2)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.1 : 0}
      />
      <path
        d="M12 12v4M10 14h4"
        stroke="currentColor"
        strokeWidth={strokeW(active, 1.6, 2)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Chevron: ({ collapsed }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-90" fill="none" aria-hidden="true" focusable="false">
      <path
        d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ------------------------------ Component ------------------------------ */

export default function CreateSidebar({ onNavigate }) {
  const [open, setOpen] = useState(false);          // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop rail
  const pathname = usePathname();
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  /* ------------------------------ auth wiring ------------------------------ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          setUserDoc(snap.exists() ? snap.data() : null);
        } catch (_) {
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }
    });
    return () => unsub();
  }, []);

  /* ----------------------- collapse persistence & UX ----------------------- */
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard
    const saved = localStorage.getItem('sb_collapsed');
    if (saved != null) setCollapsed(saved === '1');
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard
    localStorage.setItem('sb_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  // close popover on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [profileOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileOpen(false);
      setOpen(false);
      router.push('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleLogin = () => {
    setOpen(false);
    router.push('/login'); // or your provider flow
  };

  function NavItem({ icon: I, label, href = '#', kbd }) {
    const isActive =
      href === '/'
        ? pathname === '/'
        : pathname === href || pathname?.startsWith(href + '/');

    return (
      <Link
        href={href}
        prefetch={false}
        onClick={() => {
          onNavigate?.(label);
          setOpen(false);
        }}
        className={[
          itemBase,
          isActive ? 'bg-white/10 text-white ring-1 ring-white/15' : '',
          collapsed ? 'justify-center' : '',
        ].join(' ')}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? label : undefined}
      >
        <I active={isActive} />
        <span
          className={[
            'flex-1 text-left transition-all duration-200',
            collapsed
              ? 'w-0 opacity-0 -translate-x-2 pointer-events-none'
              : 'w-auto opacity-100 translate-x-0',
          ].join(' ')}
        >
          {label}
        </span>
        {!collapsed && kbd && (
          <span className="rounded-lg px-1.5 py-0.5 text-[10px] text-gray-300 bg-white/5 ring-1 ring-white/10">
            {kbd}
          </span>
        )}
      </Link>
    );
  }

  const asideWidth = collapsed ? 'w-[68px]' : 'w-72';

  const displayEmail = user?.email ?? '';
  const displayName =
    userDoc?.displayName || user?.displayName || displayEmail.split('@')[0] || 'User';
  const planLabel = userDoc?.plan ? userDoc.plan[0].toUpperCase() + userDoc.plan.slice(1) : null;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sm:hidden fixed left-3 top-3 z-40 rounded-xl bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/15"
        onClick={() => setOpen((v) => !v)}
      >
        Menu
      </button>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-20 bg-black/50 sm:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={[
          'fixed z-30 top-0 left-0 h-full bg-black/90 backdrop-blur',
          'ring-1 ring-white/10 border-r border-white/5',
          'px-2 py-4 flex flex-col gap-2',
          'transition-all duration-300 sm:translate-x-0',
          asideWidth,
          open ? 'translate-x-0' : '-translate-x-full sm:translate-x-0',
        ].join(' ')}
      >
        {/* Collapse/expand toggle (desktop) */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mb-2 self-end rounded-xl bg-white/5 p-2 ring-1 ring-white/10 hover:bg-white/10 hidden sm:inline-flex"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <Icon.Chevron collapsed={collapsed} />
        </button>

        {/* Search placeholder */}
        <div className={['mx-1 mb-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-2 transition-all duration-200', collapsed ? 'px-2 py-2' : ''].join(' ')} />

        {/* Primary */}
        <NavItem icon={Icon.Explore} label="Explore" href="/" />
        <NavItem icon={Icon.Images} label="Images" href="/create" />
        <NavItem icon={Icon.Videos} label="Videos" href="/studio/text-to-video" />
        <NavItem icon={Icon.Folder} label="Account" href="/account/billing" />
        <NavItem icon={Icon.Home} label="Home" href="/home" />
       <NavItem icon={Icon.Pricing} label="Pricing" href="/pricing" />

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Library */}
        <SectionTitle hidden={collapsed}>Library</SectionTitle>
        <NavItem icon={Icon.Folder} label="My Assets" href="/asset" />
        <NavItem icon={Icon.Star} label="Studio" href="/tools" />
        <NavItem icon={Icon.FaceSwap} label="Faceswap" href="/faceswap" />
        <NavItem icon={Icon.Trash} label="Trash" href="/trash" />
        <NavItem icon={Icon.PlusFolder} label="Profile" href="/profile/username" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile / Auth */}
        <div className="relative" ref={profileRef}>
          {!user ? (
            // Signed out: Login button
            <button
              onClick={handleLogin}
              className={[
                'w-full',
                'flex items-center gap-3 px-3 py-2 rounded-xl',
                'text-sm text-black bg-white hover:bg-zinc-200',
              ].join(' ')}
            >
              <User className="h-4 w-4" />
              {!collapsed && <span>Log in</span>}
            </button>
          ) : (
            // Signed in: avatar row that opens menu
            <>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className={[
                  'w-full',
                  'flex items-center gap-3 px-3 py-2 rounded-xl',
                  'text-sm text-gray-200 hover:bg-white/5',
                  'ring-1 ring-white/10',
                  collapsed ? 'justify-center' : '',
                ].join(' ')}
                title={collapsed ? displayName : undefined}
              >
                {/* avatar circle */}
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800">
                    <User className="h-4 w-4 text-zinc-300" />
                  </div>
                )}
                {!collapsed && (
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] text-white/90">{displayName}</span>
                    {planLabel && <span className="text-[11px] text-emerald-300/90">{planLabel}</span>}
                  </div>
                )}
              </button>

              {/* Menu panel */}
              {profileOpen && (
                <div
                  className={[
                    'absolute bottom-12 left-0',
                    'w-[260px] overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/95 shadow-2xl',
                    collapsed ? 'translate-x-2' : 'translate-x-0',
                  ].join(' ')}
                >
                  {/* email header */}
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-300">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800">
                      <User className="h-3.5 w-3.5 text-zinc-300" />
                    </div>
                    <span className="truncate">{displayEmail}</span>
                  </div>

                  <div className="h-px bg-zinc-800/70" />

                 


                  <button
                    onClick={() => { router.push('/pricing'); setProfileOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-zinc-100 hover:bg-zinc-800/70"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade plan
                  </button>

                  <button
                    onClick={() => { router.push('/orders'); setProfileOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-zinc-100 hover:bg-zinc-800/70"
                  >
                    <FolderIcon className="h-4 w-4" />
                    Orders
                  </button>

                  <button
                    onClick={() => { router.push('/personalization'); setProfileOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-zinc-100 hover:bg-zinc-800/70"
                  >
                    <Sparkles className="h-4 w-4" />
                    Personalization
                  </button>

                  <button
                    onClick={() => { router.push('/settings'); setProfileOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-zinc-100 hover:bg-zinc-800/70"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>

                  <div className="h-px bg-zinc-800/70" />

                  <button
                    onClick={() => { router.push('/help'); setProfileOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-zinc-100 hover:bg-zinc-800/70"
                  >
                    {/* using Sparkles as a placeholder for Help; swap to HelpCircle if you prefer */}
                    <Sparkles className="h-4 w-4" />
                    Help
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-rose-300 hover:bg-zinc-800/70"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
