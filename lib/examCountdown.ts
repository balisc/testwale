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
  today: boolean;
};

export function getExamCountdownParts(examDate: string, nowMs = Date.now()): ExamCountdownParts | null {
  const target = getExamCountdownTargetMs(examDate);
  if (target == null) return null;

  const currentDate = new Date(nowMs).toLocaleDateString('en-CA', { timeZone: IST });
  const toUtcDay = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year!, month! - 1, day!);
  };
  const calendarDays = Math.round((toUtcDay(examDate) - toUtcDay(currentDate)) / 86_400_000);
  if (calendarDays < 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true, today: false };
  }

  const remaining = Math.max(0, target - nowMs);
  const totalMinutes = Math.floor(remaining / 60_000);
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    days: calendarDays,
    hours,
    minutes,
    expired: false,
    today: calendarDays === 0,
  };
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
