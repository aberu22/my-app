"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, provider, db } from "@/lib/firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState("free");
  const [credits, setCredits] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stripePriceId, setStripePriceId] = useState(null);
  const [nextBillingDate, setNextBillingDate] = useState(null);

  const router = useRouter();
  const pathname = usePathname();

  const safeRedirect = (path) => {
    const allowed = ["/", "/create", "/profile", "/pricing"];
    return allowed.includes(path) ? path : "/create";
  };

  const fetchUserMembership = async (userId, email) => {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setMembershipStatus(data.membershipStatus || "free");
      setCredits(data.credits ?? 50);
      setStripePriceId(data.stripePriceId || null);
      setNextBillingDate(data.nextBillingDate || null);
      return data.membershipStatus || "free";
    } else {
      await setDoc(ref, {
        userId,
        email,
        credits: 50,
        membershipStatus: "free",
        isPremium: false,
        nsfwAccess: false,
        createdAt: new Date(),
      });
      return "free";
    }
  };

  const upgradeUserMembership = async (userId, newStatus) => {
    const ref = doc(db, "users", userId);
    await setDoc(
      ref,
      { membershipStatus: newStatus, nsfwAccess: newStatus !== "free" },
      { merge: true }
    );
    setMembershipStatus(newStatus);
  };

  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).catch((err) =>
      console.error("Persistence error:", err.message)
    );
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const ref = doc(db, "users", currentUser.uid);
        const unsubSnap = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setMembershipStatus(data.membershipStatus || "free");
            setCredits(data.credits ?? 50);
            setStripePriceId(data.stripePriceId || null);
            setNextBillingDate(data.nextBillingDate || null);
          }
          setLoading(false);
        });
        return unsubSnap;
      } else {
        setUser(null);
        setMembershipStatus("free");
        setCredits(50);
        setStripePriceId(null);
        setNextBillingDate(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const login = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      await fetchUserMembership(u.uid, u.email);
      router.push(safeRedirect(pathname));
    } catch (e) {
      console.error("Login error:", e.message);
      setError("Login failed. Try again.");
    }
  };

  const logout = async () => {
    if (!auth.currentUser) return;
    try {
      await signOut(auth);
      setUser(null);
      setMembershipStatus("free");
      setCredits(50);
      setStripePriceId(null);
      setNextBillingDate(null);
      router.push("/login");
    } catch (e) {
      console.error("Logout error:", e.message);
      setError("Logout failed. Try again.");
    }
  };

  const getIdToken = async () => {
  if (!user) throw new Error("No user is logged in.");
  return await user.getIdToken(true); // force refresh
};


  return (
    <AuthContext.Provider
      value={{
        user,
        membershipStatus,
        credits,
        setCredits,
        stripePriceId,
        nextBillingDate,
        upgradeUserMembership,
        loading,
        error,
        login,
        logout,
        getIdToken, // ✅ Add this
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
