import { ROUTES } from '@/lib/routes';

/** Same pattern as the Program page: the Company page prints the partner manager's name and email. Staff have no such contact. */
export const PARTNER_CONTACT = {
  href: ROUTES.partner.company,
  label: 'Contact your partner manager',
  note: 'Your partner manager is your contact for questions about a deal or the program.',
} as const;
