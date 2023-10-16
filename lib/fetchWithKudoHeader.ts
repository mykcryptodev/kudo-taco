import { env } from '~/env.mjs';

export const fetchWithKudoHeader = async (url: string, options?: globalThis.RequestInit) => {
  const headers = {
    'x-kudo-secret': env.KUDO_SECRET,
  };
  return await fetch(url, { ...options, headers });
}