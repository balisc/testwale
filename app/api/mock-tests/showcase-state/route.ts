import { getAuthUserFromCookies } from '@/lib/authCookies';
import { mockErrorResponse, mockJson } from '@/lib/mockTests/http';
import { getMockShowcaseUserState } from '@/lib/mockTests/showcaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) {
      return mockJson({ ok: true, authenticated: false, userState: null });
    }
    return mockJson({
      ok: true,
      authenticated: true,
      userState: await getMockShowcaseUserState(user.id),
    });
  } catch (error) {
    return mockErrorResponse(error);
  }
}
