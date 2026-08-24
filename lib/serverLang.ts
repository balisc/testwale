import { cookies } from 'next/headers';
import type { HomeLang } from './homeCopy';

export async function getServerLang(): Promise<HomeLang> {
  const cookieStore = await cookies();
  return cookieStore.get('language')?.value === 'hi' ? 'hi' : 'en';
}
