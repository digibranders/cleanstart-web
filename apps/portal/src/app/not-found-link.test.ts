import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Viewer } from '@/server/auth/types';

const getViewer = vi.hoisted(() => vi.fn<() => Promise<Viewer | null>>());
vi.mock('@/server/auth/viewer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/auth/viewer')>()),
  getViewer,
}));

import { backLink } from './not-found-link';

const partner = (role: 'partner_admin' | 'technical'): Viewer => ({
  id: 'u1',
  email: 'a@kestrel.example',
  name: 'A',
  kind: 'partner',
  role,
  partnerId: 'p1',
  partnerName: 'Kestrel',
});
const staff = (role: 'partner_manager' | 'marketing'): Viewer => ({
  id: 'u2',
  email: 'f@cleanstart.example',
  name: 'F',
  kind: 'staff',
  role,
  partnerId: null,
  partnerName: null,
  regions: ['india'],
});

describe('not-found back link', () => {
  beforeEach(() => getViewer.mockReset());

  it('links signed-out visitors to sign in', async () => {
    getViewer.mockResolvedValue(null);
    expect(await backLink()).toEqual({ href: '/sign-in', label: 'Back to sign in' });
  });

  it('links a signed-in viewer to their own home', async () => {
    getViewer.mockResolvedValue(partner('partner_admin'));
    expect(await backLink()).toEqual({ href: '/partner/overview', label: 'Back to overview' });
    getViewer.mockResolvedValue(partner('technical'));
    expect(await backLink()).toEqual({ href: '/partner/documents', label: 'Back to documents' });
    getViewer.mockResolvedValue(staff('partner_manager'));
    expect(await backLink()).toEqual({ href: '/admin/overview', label: 'Back to overview' });
    getViewer.mockResolvedValue(staff('marketing'));
    expect(await backLink()).toEqual({ href: '/admin/overview', label: 'Back to overview' });
  });
});

describe('error page', () => {
  it('does not point users at the mock-era walkthrough or demo data', () => {
    const source = readFileSync(join(__dirname, 'error.tsx'), 'utf8');
    expect(source).not.toMatch(/Walkthrough|demo data/u);
  });
});
