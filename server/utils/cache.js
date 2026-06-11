const MIN_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 600;
const DEFAULT_TTL_SECONDS = 300;

const store = new Map();

function normalizeTtlSec(value) {
  const ttlSec = Number(value);

  if (!Number.isFinite(ttlSec)) {
    return DEFAULT_TTL_SECONDS;
  }

  return Math.min(Math.max(ttlSec, MIN_TTL_SECONDS), MAX_TTL_SECONDS);
}

export const defaultTtlSec = normalizeTtlSec(process.env.CACHE_TTL);

function cloneData(data) {
  return structuredClone(data);
}

export function getCache(key) {
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    return null;
  }

  return cloneData(entry.data);
}

export function getStaleCache(key) {
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  return cloneData(entry.data);
}

export function setCache(key, data, ttlSec = defaultTtlSec) {
  const normalizedTtlSec = normalizeTtlSec(ttlSec);
  const entry = {
    data: cloneData(data),
    expiresAt: Date.now() + normalizedTtlSec * 1000,
  };

  store.set(key, entry);
  return cloneData(entry.data);
}

export function clearCache(key) {
  if (key) {
    store.delete(key);
    return;
  }

  store.clear();
}
