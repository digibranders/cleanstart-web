import { Reveal } from '@/components/ui/Reveal';
import type { KhArticle } from '@/lib/knowledge-hub';
import { RenderLexical } from '@/lib/renderLexical';

export function KnowledgeHubArticle({
  article,
}: {
  article: KhArticle;
}): React.ReactElement {
  return (
    <>
      <Reveal header>
        {article.category?.name && <CategoryBadge>{article.category.name}</CategoryBadge>}

        <h1
          className="font-display font-semibold mt-4"
          style={{
            fontSize: 'var(--fs-h2)',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#0F1023',
          }}
        >
          {article.title}
        </h1>
      </Reveal>

      {article.abstract && (
        <Reveal header delay={0.15} y={20}>
          <p
            className="mt-6 font-medium"
            style={{
              fontSize: 'var(--fs-body)',
              lineHeight: 1.5,
              letterSpacing: '-0.01em',
              color: '#3A3F55',
            }}
          >
            {article.abstract}
          </p>
        </Reveal>
      )}

      {article.videoUrl && (
        <Reveal header delay={0.2} y={20}>
          <div className="mt-10">
            <p
              className="mb-3 font-medium uppercase tracking-[0.08em] text-cs-purple-1"
              style={{ fontSize: 'var(--fs-eyebrow)' }}
            >
              Watch the Lesson
            </p>
            <div className="overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '16 / 9' }}>
              {/* biome-ignore lint/a11y/useMediaCaption: Academy lesson videos ship without a caption track. */}
              <video
                controls
                preload="metadata"
                playsInline
                className="h-full w-full"
                src={article.videoUrl}
              />
            </div>
          </div>
        </Reveal>
      )}

      <div className="article-body mt-12">
        <RenderLexical content={article.body} />
      </div>
    </>
  );
}

function CategoryBadge({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        fontSize: 'var(--fs-body-sm)',
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        color: '#471EC0',
      }}
    >
      <span style={{ color: '#5A5F75', marginRight: '6px' }}>Category:</span>
      {children}
    </span>
  );
}
