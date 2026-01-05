"use client";

import { useAuth } from "@/context/AuthContext";
import { FaGoogle } from "react-icons/fa";
import { FiMail } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SignupPage() {
  const { user, login, loading, error } = useAuth();
  const router = useRouter();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);

  // If already logged in, redirect
  useEffect(() => {
    if (user && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/create");
    }
  }, [user, isRedirecting, router]);

  const handleSignup = (provider) => {
    setActiveProvider(provider);
    login(provider); // IMPORTANT: login("google") should create user doc + 50 credits if new
  };

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg font-semibold">Creating your account...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      {/* Left video section */}
      <div className="hidden md:block w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/image1.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Right signup panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
              Join FantasyVision.AI
            </h1>
            <p className="text-zinc-400">
              Sign up in one click — get <span className="text-zinc-200 font-semibold">50 free credits</span>.
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-900/30 text-red-300 p-3 rounded-lg text-sm border border-red-800">
                {error}
              </div>
            )}

            {/* Google Signup */}
            <button
              onClick={() => handleSignup("google")}
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
              Sign up with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900 text-zinc-400">Or</span>
              </div>
            </div>

            {/* Email Signup */}
            <button
              onClick={() => handleSignup("email")}
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
              Sign up with Email
            </button>

            {/* Link to login */}
            <p className="text-center text-sm text-zinc-400 mt-6">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-indigo-400 hover:underline hover:text-indigo-300"
              >
                Log in
              </button>
            </p>
          </div>

          <div className="mt-8 text-center text-xs text-zinc-500">
            <p>
              By signing up, you agree to FantasyVision.AI&apos;s{" "}
              <a className="text-indigo-400 hover:underline hover:text-indigo-300" href="#">
                Terms of Service
              </a>{" "}
              and{" "}
              <a className="text-indigo-400 hover:underline hover:text-indigo-300" href="#">
                Privacy Policy
              </a>
              .
            </p>
            <p className="mt-2">© {new Date().getFullYear()} FantasyVision.AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
