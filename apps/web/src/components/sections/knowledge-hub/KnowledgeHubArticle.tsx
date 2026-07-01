import { Reveal } from '@/components/ui/Reveal';
import type { KhArticle } from '@/lib/knowledge-hub';
import { RenderLexical } from '@/lib/renderLexical';
import Link from 'next/link';

export function KnowledgeHubArticle({
  article,
}: {
  article: KhArticle;
}): React.ReactElement {
  return (
    <>
      <Reveal header>
        <Breadcrumb category={article.category?.name} />

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

// NOTE: this light-theme breadcrumb intentionally ends at the category and
// omits the article title (the title is the H1 below). The JSON-LD (built in
// app/knowledge-hub/[slug]/page.tsx via breadcrumbTrail("knowledgeBase", …))
// DOES include the title — Google permits a current-page crumb in markup that
// isn't a visible link. This is the one accepted visible/JSON-LD divergence;
// see docs/superpowers/plans/2026-06-23-breadcrumb-single-source.md.
function Breadcrumb({ category }: { category?: string | null | undefined }): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-medium"
        style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 1.4, letterSpacing: '-0.01em' }}
      >
        <li>
          <Link href="/" className="transition-colors hover:text-cs-purple-1" style={{ color: '#5A5F75' }}>
            Home
          </Link>
        </li>
        <li aria-hidden style={{ color: '#9094A8' }}>
          /
        </li>
        <li>
          <Link
            href="/knowledge-hub"
            className="transition-colors hover:text-cs-purple-1"
            style={{ color: '#5A5F75' }}
          >
            Knowledge Hub
          </Link>
        </li>
        {category && (
          <>
            <li aria-hidden style={{ color: '#9094A8' }}>
              /
            </li>
            <li style={{ color: '#471EC0' }}>{category}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
