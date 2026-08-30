/** Fixed campaign deadline — 26 August 2026, 11:59:59 PM IST. */
export const QUALITY_UPGRADE_DEADLINE_MS = new Date('2026-08-26T23:59:59+05:30').getTime();

export const QUALITY_UPGRADE_NOTICE_STORAGE_KEY = 'questionwale_quality_upgrade_notice_v1';

export const QUALITY_UPGRADE_TARGET_DATE_LABEL = 'Target date: 26 August 2026';

export const QUALITY_UPGRADE_COMPLETED_LABEL = 'Quality upgrade completed';

export type QualityUpgradeCountdown = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function padCountdownUnit(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function getQualityUpgradeCountdown(nowMs = Date.now()): QualityUpgradeCountdown {
  const remaining = QUALITY_UPGRADE_DEADLINE_MS - nowMs;

  if (remaining <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { expired: false, days, hours, minutes, seconds };
}

type NoticeStorage = Pick<Storage, 'getItem' | 'setItem'>;
type NoticeReadStorage = Pick<Storage, 'getItem'>;

export function shouldShowQualityUpgradeNotice(
  nowMs = Date.now(),
  storage?: NoticeReadStorage,
): boolean {
  return nowMs < QUALITY_UPGRADE_DEADLINE_MS && !hasAcknowledgedQualityUpgradeNotice(storage);
}

function getBrowserNoticeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Dev/testing: run in the browser console —
 * `localStorage.removeItem('questionwale_quality_upgrade_notice_v1')`
 */
export function hasAcknowledgedQualityUpgradeNotice(storage?: NoticeReadStorage): boolean {
  const store = storage ?? getBrowserNoticeStorage();
  if (!store) return true;
  try {
    return store.getItem(QUALITY_UPGRADE_NOTICE_STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function acknowledgeQualityUpgradeNotice(storage?: NoticeStorage): void {
  const store = storage ?? getBrowserNoticeStorage();
  if (!store) return;
  try {
    store.setItem(QUALITY_UPGRADE_NOTICE_STORAGE_KEY, '1');
  } catch {
    /* ignore quota / privacy mode */
  }
}
