import assert from 'node:assert/strict';
import test from 'node:test';
import {
  QUALITY_UPGRADE_DEADLINE_MS,
  QUALITY_UPGRADE_NOTICE_STORAGE_KEY,
  acknowledgeQualityUpgradeNotice,
  getQualityUpgradeCountdown,
  hasAcknowledgedQualityUpgradeNotice,
  shouldShowQualityUpgradeNotice,
} from './qualityUpgradeAnnouncement.ts';

test('countdown returns positive parts before deadline', () => {
  const beforeDeadline = QUALITY_UPGRADE_DEADLINE_MS - 86_400_000;
  const parts = getQualityUpgradeCountdown(beforeDeadline);
  assert.equal(parts.expired, false);
  assert.equal(parts.days, 1);
});

test('countdown expires after deadline', () => {
  const parts = getQualityUpgradeCountdown(QUALITY_UPGRADE_DEADLINE_MS + 1);
  assert.equal(parts.expired, true);
});

test('should show when not acknowledged and before deadline', () => {
  const storage = {
    getItem: () => null,
    setItem: () => undefined,
  };
  assert.equal(shouldShowQualityUpgradeNotice(QUALITY_UPGRADE_DEADLINE_MS - 1000, storage), true);
});

test('should not show after the fixed campaign deadline', () => {
  const storage = {
    getItem: () => null,
    setItem: () => undefined,
  };
  assert.equal(shouldShowQualityUpgradeNotice(QUALITY_UPGRADE_DEADLINE_MS + 1000, storage), false);
});

test('should not show when acknowledged', () => {
  const storage = {
    getItem: (key: string) => (key === QUALITY_UPGRADE_NOTICE_STORAGE_KEY ? '1' : null),
    setItem: () => undefined,
  };
  assert.equal(shouldShowQualityUpgradeNotice(QUALITY_UPGRADE_DEADLINE_MS - 1000, storage), false);
});

test('acknowledge writes storage key', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  acknowledgeQualityUpgradeNotice(storage);
  assert.equal(hasAcknowledgedQualityUpgradeNotice(storage), true);
});
