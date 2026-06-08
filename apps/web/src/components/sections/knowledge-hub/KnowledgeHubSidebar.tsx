'use client';

import type { KhArticleLink, KhGroup } from '@/lib/knowledge-hub';
import { EASE_SOFT } from '@/lib/motion';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const SIDEBAR_PANEL = 'Knowledge Hub';

export function KnowledgeHubSidebar({ groups }: { groups: KhGroup[] }): React.ReactElement {
  const pathname = usePathname();
  const activeSlug = pathname.split('/').filter(Boolean).pop() ?? '';
  const reduceMotion = useReducedMotion();

  const hasSlug = (items: KhArticleLink[]): boolean => items.some((a) => a.slug === activeSlug);

  // Which group / subcategory contains the active article.
  const activeGroup = groups.find(
    (g) => hasSlug(g.articles) || g.subcategories.some((s) => hasSlug(s.articles)),
  );
  const activeSubKey = activeGroup
    ? activeGroup.subcategories.find((s) => hasSlug(s.articles))?.slug
    : undefined;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.slug, g.slug === activeGroup?.slug])),
  );
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>(() =>
    activeGroup && activeSubKey ? { [`${activeGroup.slug}/${activeSubKey}`]: true } : {},
  );

  const activeGroupSlug = activeGroup?.slug;
  useEffect(() => {
    if (!activeGroupSlug) return;
    setOpenGroups((prev) => (prev[activeGroupSlug] ? prev : { ...prev, [activeGroupSlug]: true }));
    if (activeSubKey) {
      const key = `${activeGroupSlug}/${activeSubKey}`;
      setOpenSubs((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    }
  }, [activeGroupSlug, activeSubKey]);

  const toggleGroup = (slug: string): void =>
    setOpenGroups((prev) => ({ ...prev, [slug]: !prev[slug] }));
  const toggleSub = (key: string): void => setOpenSubs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <LazyMotion features={domAnimation}>
      <nav aria-label="Knowledge Hub categories" className="flex flex-col">
        <h2
          className="border-b border-[#EDEEF4] pb-4 font-display font-semibold"
          style={{ fontSize: 'var(--fs-h5)', letterSpacing: '-0.02em', color: '#471EC0' }}
        >
          {SIDEBAR_PANEL}
        </h2>

        <div className="mt-3 flex flex-col gap-0.5">
          {groups.map((group) => {
            const open = openGroups[group.slug] ?? false;
            const isActiveGroup = group.slug === activeGroup?.slug;
            return (
              <div key={group.slug}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.slug)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left font-display font-medium transition-colors duration-150 hover:bg-[#F6F5FB]"
                  style={{ fontSize: 'var(--fs-body)', letterSpacing: '-0.01em', color: '#0F1023' }}
                >
                  <span className="flex items-center gap-2.5">
                    <GroupIcon slug={group.slug} color={isActiveGroup ? '#471EC0' : '#9094A8'} />
                    <span>{group.name}</span>
                  </span>
                  <Chevron open={open} />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <m.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.26, ease: EASE_SOFT }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-0.5 pt-0.5 pb-2 pl-2">
                        {/* Legacy groups: articles directly. */}
                        {group.articles.length > 0 && (
                          <ArticleList items={group.articles} activeSlug={activeSlug} />
                        )}

                        {/* Sections: subcategories → articles. */}
                        {group.subcategories.map((sub) => {
                          const key = `${group.slug}/${sub.slug}`;
                          const subOpen = openSubs[key] ?? false;
                          const subActive = sub.articles.some((a) => a.slug === activeSlug);
                          return (
                            <div key={sub.slug}>
                              <button
                                type="button"
                                onClick={() => toggleSub(key)}
                                aria-expanded={subOpen}
                                className="flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left font-display transition-colors duration-150 hover:bg-[#F8F7FC]"
                                style={{
                                  fontSize: 'var(--fs-body-sm)',
                                  letterSpacing: '-0.01em',
                                  color: subActive ? '#471EC0' : '#3A3F55',
                                  fontWeight: subActive ? 600 : 500,
                                }}
                              >
                                <span>{sub.name}</span>
                                <Chevron open={subOpen} small />
                              </button>
                              <AnimatePresence initial={false}>
                                {subOpen && (
                                  <m.div
                                    key="subpanel"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{
                                      duration: reduceMotion ? 0 : 0.24,
                                      ease: EASE_SOFT,
                                    }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pl-2">
                                      <ArticleList items={sub.articles} activeSlug={activeSlug} />
                                    </div>
                                  </m.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>
    </LazyMotion>
  );
}

function ArticleList({
  items,
  activeSlug,
}: {
  items: KhArticleLink[];
  activeSlug: string;
}): React.ReactElement {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.slug === activeSlug;
        return (
          <li key={item.slug}>
            <Link
              href={`/knowledge-hub/${item.slug}`}
              aria-current={active ? 'page' : undefined}
              className={`relative block rounded-[10px] py-2 pl-5 pr-3 transition-colors duration-150 ${
                active ? 'bg-[#F4F2FB]' : 'hover:bg-[#F8F7FC]'
              }`}
              style={{
                fontSize: 'var(--fs-body-sm)',
                lineHeight: 1.4,
                color: active ? '#0F1023' : '#5A5F75',
                fontWeight: active ? 600 : 400,
                boxShadow: active ? 'inset 0 0 0 1px rgba(71,30,192,0.10)' : undefined,
              }}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-1.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                  style={{ background: '#471EC0' }}
                />
              )}
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function GroupIcon({ slug, color }: { slug: string; color: string }): React.ReactElement {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-colors duration-150"
      aria-hidden
    >
      {ICON_PATHS[slug] ?? ICON_PATHS.default}
    </svg>
  );
}

const ICON_PATHS: Record<string, React.ReactElement> = {
  'emerging-standards': (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  'security-features': (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  'compliance-and-certification': (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
    </>
  ),
  'devops-kyverno': (
    <>
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </>
  ),
  default: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
};

function Chevron({ open, small = false }: { open: boolean; small?: boolean }): React.ReactElement {
  const size = small ? 14 : 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#9A9DB0' }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
