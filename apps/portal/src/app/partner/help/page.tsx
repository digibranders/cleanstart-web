import type { Metadata } from 'next';
import { Help } from '@/components/screens/Help';
import { HELP_ARTICLES } from '@/content/help';
import { PARTNER_CONTACT } from '@/lib/help-contact';
import { articlesFor } from '@/lib/help';
import { ROUTES } from '@/lib/routes';
import { requireCan } from '@/server/auth/viewer';

export const metadata: Metadata = { title: 'Help' };

export default async function Page(): Promise<React.JSX.Element> {
  await requireCan('help.read');
  return <Help articles={articlesFor(HELP_ARTICLES, 'partner')} basePath={ROUTES.partner.help} contact={PARTNER_CONTACT} />;
}
