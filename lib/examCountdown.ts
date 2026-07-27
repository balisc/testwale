const IST = 'Asia/Kolkata';

/** End of exam day in IST — countdown target for YYYY-MM-DD. */
export function getExamCountdownTargetMs(examDate: string): number | null {
  const trimmed = examDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return new Date(`${trimmed}T23:59:59+05:30`).getTime();
}

export type ExamCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
};

export function getExamCountdownParts(examDate: string, nowMs = Date.now()): ExamCountdownParts | null {
  const target = getExamCountdownTargetMs(examDate);
  if (target == null) return null;

  const remaining = target - nowMs;
  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const totalMinutes = Math.floor(remaining / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, expired: false };
}

export function validateExamDateInput(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  const target = getExamCountdownTargetMs(trimmed);
  if (target == null) return false;

  const todayIst = new Date().toLocaleDateString('en-CA', { timeZone: IST });
  const todayStart = new Date(`${todayIst}T00:00:00+05:30`).getTime();
  const pickedStart = new Date(`${trimmed}T00:00:00+05:30`).getTime();

  return pickedStart >= todayStart;
}

export function minExamDateInput(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST });
}
