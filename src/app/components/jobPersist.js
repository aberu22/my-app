// jobPersist.js
const KEY = "activeVideoJob";

export function persistJob(jobId, timeoutMs) {
  try {
    const timeoutAt = Date.now() + Number(timeoutMs || 0);
    localStorage.setItem(KEY, JSON.stringify({ jobId, timeoutAt }));
  } catch {}
}

export function getPersistedJob() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.jobId || !parsed?.timeoutAt) return null;
    if (parsed.timeoutAt <= Date.now()) { // expired
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPersistedJob() {
  try { localStorage.removeItem(KEY); } catch {}
}
