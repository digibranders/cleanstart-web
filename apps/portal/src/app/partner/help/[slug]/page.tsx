import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HelpArticleView } from '@/components/screens/HelpArticleView';
import { HELP_ARTICLES } from '@/content/help';
import { articlesFor, findArticle } from '@/lib/help';
import { PARTNER_CONTACT } from '@/lib/help-contact';
import { ROUTES } from '@/lib/routes';
import { requireCan } from '@/server/auth/viewer';

type Props = { params: Promise<{ slug: string }> };

const visible = articlesFor(HELP_ARTICLES, 'partner');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: findArticle(visible, slug)?.title ?? 'Help' };
}

export default async function Page({ params }: Props): Promise<React.JSX.Element> {
  await requireCan('help.read');
  const article = findArticle(visible, (await params).slug);
  if (!article) notFound();
  return <HelpArticleView article={article} backHref={ROUTES.partner.help} contact={PARTNER_CONTACT} />;
}
