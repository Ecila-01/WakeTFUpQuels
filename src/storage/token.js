import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'SINK_QR_TOKEN';

export async function getToken() {
  return AsyncStorage.getItem(KEY);
}

export async function setToken(token) {
  return AsyncStorage.setItem(KEY, token);
}

export function makeToken() {
  return 'SINK-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/** Creates token if missing, otherwise returns saved token */
export async function ensureToken() {
  const existing = await getToken();
  if (existing) return existing;

  const t = makeToken();
  await setToken(t);
  return t;
}