"use client";

import { useAuth } from "@/context/AuthContext";
import { FaGoogle, FaApple, FaGithub } from "react-icons/fa";
import { SiAuth0 } from "react-icons/si";
import { FiMail } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner"; // Assume you have this component

export default function Auth() {
  const { user, login, logout, loading, error } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/create");
    }
  }, [user, router, isRedirecting]);

  const handleLogin = (provider) => {
    setActiveProvider(provider);
    login(provider);
  };

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg font-semibold">Authenticating...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      {/* Left Image Section */}
      <div className="hidden md:block w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/image1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Right Login Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
              Welcome to FantasyVision.AI
            </h1>
            <p className="text-zinc-400">Create magical videos with AI</p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-900/30 text-red-300 p-3 rounded-lg text-sm border border-red-800 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            {user ? (
              <div className="text-center">
                <p className="mb-4 text-zinc-300">
                  You're already signed in as {user.email}
                </p>
                <button
                  onClick={logout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleLogin("google")}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 bg-white/90 hover:bg-white text-zinc-900 font-medium py-3.5 rounded-lg shadow-sm hover:shadow-md transition ${
                    activeProvider === "google" && loading ? "opacity-70" : ""
                  }`}
                >
                  {activeProvider === "google" && loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FaGoogle className="text-lg" />
                  )}
                  Continue with Google
                </button>

                

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-zinc-900 text-zinc-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleLogin("email")}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-lg shadow-sm hover:shadow-md transition ${
                    activeProvider === "email" && loading ? "opacity-70" : ""
                  }`}
                >
                  {activeProvider === "email" && loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FiMail className="text-lg" />
                  )}
                  Continue with Email
                </button>
              </>
            )}
          </div>

          <div className="mt-8 text-center text-xs text-zinc-500">
            <p>
              By signing in, you agree to FantasyVision.AI's{" "}
              <a
                href="#"
                className="text-indigo-400 hover:underline hover:text-indigo-300"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-indigo-400 hover:underline hover:text-indigo-300"
              >
                Privacy Policy
              </a>
              .
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} FantasyVision.AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}