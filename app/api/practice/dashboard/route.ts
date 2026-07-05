import { NextResponse } from 'next/server';
import { getUserProgressDashboardForUser, practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);

  const dashboard = await getUserProgressDashboardForUser(user!.id);
  if (!dashboard) {
    return practiceErrorResponse('dashboard_failed', 500);
  }

  return NextResponse.json(dashboard);
}
