

import { useEffect, useState } from "react";

const KEY = "ageVerified18";

export function useAgeGate() {
  const [checked, setChecked] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const v = typeof window !== "undefined" && localStorage.getItem(KEY) === "true";
    setVerified(!!v);
    setChecked(true);
  }, []);

  const confirm = () => {
    localStorage.setItem(KEY, "true");
    // also set a cookie so middleware/edge can read it if desired
    document.cookie = `${KEY}=true; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setVerified(true);
  };

  const revoke = () => {
    localStorage.removeItem(KEY);
    document.cookie = `${KEY}=; path=/; max-age=0; samesite=lax`;
    setVerified(false);
  };

  return { checked, verified, confirm, revoke };
}
