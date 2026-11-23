import Link from 'next/link';
import { HELP_TOPIC_LABEL, type HelpArticle } from '@/lib/help';

const BODY = { margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#3A3748' } as const;
const LIST = { ...BODY, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 } as const;

interface HelpArticleViewProps {
  article: HelpArticle;
  backHref: string;
  contact: { href: string; label: string; note: string } | null;
}

/** One Help article: a back link, the title, then its paragraphs, steps and lists. Server rendered. */
export function HelpArticleView({ article, backHref, contact }: HelpArticleViewProps): React.JSX.Element {
  return (
    <div className="wrap">
      <div className="head">
        <div>
          <Link href={backHref} className="linkbtn">
            Back to Help
          </Link>
          <h1 className="h1" style={{ marginTop: 6 }}>
            {article.title}
          </h1>
          <span className="h1-sub">{HELP_TOPIC_LABEL[article.topic]}</span>
        </div>
      </div>

      <article className="card clip" style={{ maxWidth: 720 }}>
        <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {article.body.map((block, i) => {
            const key = `${article.slug}-${i}`;
            if (block.type === 'p') {
              return (
                <p key={key} style={BODY}>
                  {block.text}
                </p>
              );
            }
            const Tag = block.type === 'steps' ? 'ol' : 'ul';
            return (
              <Tag key={key} style={LIST}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </Tag>
            );
          })}
          {contact ? (
            <p style={BODY}>
              {contact.note} <Link href={contact.href}>{contact.label}</Link>
            </p>
          ) : null}
        </div>
      </article>
    </div>
  );
}
