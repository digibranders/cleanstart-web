import { describe, expect, it } from 'vitest';
import { ICONS } from '@/components/icon-paths';
import { NOTIFICATION_KINDS } from './domain';
import { isAppLink, notificationIcon, notificationWhen } from './notification-view';

describe('notificationIcon', () => {
  it('has a real icon for every notification kind', () => {
    for (const kind of NOTIFICATION_KINDS) expect(Object.keys(ICONS)).toContain(notificationIcon(kind));
  });
  it('uses the mock\'s icons where the mock had one', () => {
    expect(notificationIcon('access_requested')).toBe('team');
    expect(notificationIcon('registration_expiring')).toBe('hg');
    expect(notificationIcon('application_new')).toBe('bld');
    expect(notificationIcon('registration_rejected')).toBe('warn');
  });
});

describe('notificationWhen', () => {
  const today = '2026-11-06';
  it('says Today, a number of days ago for the first week, then the date', () => {
    expect(notificationWhen('2026-11-06T09:30:00.000Z', today)).toBe('Today');
    expect(notificationWhen('2026-11-05T23:59:00.000Z', today)).toBe('1 day ago');
    expect(notificationWhen('2026-11-03T08:00:00.000Z', today)).toBe('3 days ago');
    expect(notificationWhen('2026-10-31T08:00:00.000Z', today)).toBe('6 days ago');
    expect(notificationWhen('2026-10-30T08:00:00.000Z', today)).toBe('30 Oct');
  });
});

describe('isAppLink', () => {
  it('accepts paths inside the app only', () => {
    expect(isAppLink('/partner/deals/123')).toBe(true);
    expect(isAppLink('//evil.example/x')).toBe(false);
    expect(isAppLink('https://evil.example')).toBe(false);
    expect(isAppLink('javascript:alert(1)')).toBe(false);
    expect(isAppLink(null)).toBe(false);
  });
});
