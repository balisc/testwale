import { cookies } from 'next/headers';
import type { HomeLang } from './homeCopy';

export async function getServerLang(): Promise<HomeLang> {
  const cookieStore = await cookies();
  const value = cookieStore.get('language')?.value;
  return value === 'hi' ? 'hi' : 'en';
}
