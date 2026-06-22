'use client';

import {
  type GraphNode,
  type OrganizationConfig,
  composeGraph,
  lintGraph,
  lintNode,
  organizationSchema,
  primaryType,
  validateOverride,
  webSiteSchema,
} from '@cleanstart/schema';
import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

interface OrgGroup {
  name?: string | null;
  legalName?: string | null;
  url?: string | null;
  sameAs?: { url?: string | null }[] | null;
}
interface NewsGroup {
  enabled?: boolean | null;
  foundingDate?: string | null;
  slogan?: string | null;
  masthead?: string | null;
  ethicsPolicy?: string | null;
  correctionsPolicy?: string | null;
  factCheckingPolicy?: string | null;
  actionableFeedbackPolicy?: string | null;
  unnamedSourcesPolicy?: string | null;
  diversityPolicy?: string | null;
  ownershipFundingInfo?: string | null;
  coveragePolicy?: string | null;
}

const clean = (v: string | null | undefined): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

const HealthBadge = ({ errors, warnings }: { errors: number; warnings: number }): ReactElement => {
  const { color, label } =
    errors > 0
      ? { color: 'var(--theme-error-500, #c33)', label: `✕ ${errors} err` }
      : warnings > 0
        ? { color: 'var(--theme-warning-500, #a70)', label: `⚠ ${warnings} warn` }
        : { color: 'var(--theme-success-500, #0a7)', label: '✓ healthy' };
  return (
    <span style={{ fontSize: '0.72em', fontWeight: 600, color, border: `1px solid ${color}`, borderRadius: 10, padding: '0.05rem 0.5rem', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
};

/**
 * Right-rail viewer of the SITE-WIDE @graph this global emits on every page —
 * Organization/WebSite composed from the fields on this form plus any global
 * override, with rich-result health + an in-app validate. Composed live from
 * the form values, so it reflects unsaved edits (logo URL is omitted here;
 * the live build resolves it from the uploaded media).
 */
export const GlobalSchemaView = (): ReactElement => {
  const { value: org } = useField<OrgGroup>({ path: 'organizationJsonLd' });
  const { value: news } = useField<NewsGroup>({ path: 'newsMediaOrganization' });
  const { value: override } = useField<unknown>({ path: 'additionalSchema' });
  const [validation, setValidation] = useState<null | { ok: boolean; messages: string[] }>(null);

  const blocks = useMemo(() => {
    const cfg: OrganizationConfig = {};
    const nm = clean(org?.name);
    if (nm) cfg.name = nm;
    const ln = clean(org?.legalName);
    if (ln) cfg.legalName = ln;
    const ur = clean(org?.url);
    if (ur) cfg.url = ur;
    const sameAs = (org?.sameAs ?? []).map((r) => clean(r?.url)).filter((u): u is string => u != null);
    if (sameAs.length) cfg.sameAs = sameAs;
    if (news?.enabled) {
      cfg.newsMedia = {};
      const n = cfg.newsMedia;
      const map: [keyof NewsGroup, keyof NonNullable<OrganizationConfig['newsMedia']>][] = [
        ['foundingDate', 'foundingDate'], ['slogan', 'slogan'], ['masthead', 'masthead'],
        ['ethicsPolicy', 'ethicsPolicy'], ['correctionsPolicy', 'correctionsPolicy'],
        ['factCheckingPolicy', 'factCheckingPolicy'], ['actionableFeedbackPolicy', 'actionableFeedbackPolicy'],
        ['unnamedSourcesPolicy', 'unnamedSourcesPolicy'], ['diversityPolicy', 'diversityPolicy'],
        ['ownershipFundingInfo', 'ownershipFundingInfo'], ['coveragePolicy', 'coveragePolicy'],
      ];
      for (const [src, dst] of map) {
        const v = clean(news[src] as string | null | undefined);
        if (v) n[dst] = v;
      }
    }
    const auto = [organizationSchema(cfg), webSiteSchema({ ...(cfg.name ? { name: cfg.name } : {}), ...(cfg.url ? { url: cfg.url } : {}) })] as GraphNode[];
    const graph = composeGraph({ auto, override: override ?? undefined });
    return graph['@graph'];
  }, [org, news, override]);

  const lint = useMemo(() => lintGraph(blocks), [blocks]);

  const runValidation = (): void => {
    const messages: string[] = [];
    if (override != null) {
      const r = validateOverride(override);
      if (!r.ok) {
        if (r.issues.length > 0) for (const i of r.issues) messages.push(`${i.path ? `${i.path}: ` : ''}${i.message}`);
        else if (r.message) messages.push(r.message);
      }
    }
    for (const n of lint.nodes) for (const e of n.errors) messages.push(`${n.type}: missing required “${e.field}”`);
    setValidation({ ok: messages.length === 0, messages });
  };

  return (
    <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85em' }}>Site-wide schema ({blocks.length})</span>
        <HealthBadge errors={lint.errorCount} warnings={lint.warningCount} />
        <button
          type="button"
          onClick={runValidation}
          style={{ marginLeft: 'auto', fontSize: '0.78em', fontWeight: 600, color: 'var(--theme-success-500, #0a7)', background: 'none', border: '1px solid var(--theme-success-500, #0a7)', borderRadius: 6, cursor: 'pointer', padding: '0.25rem 0.6rem' }}
        >
          ✔ Validate
        </button>
      </div>
      <p style={{ fontSize: '0.72em', color: '#888', margin: 0 }}>
        Emitted on every page. Reflects unsaved edits; logo resolves at build.
      </p>
      {validation ? (
        <div style={{ border: `1px solid ${validation.ok ? 'var(--theme-success-500,#0a7)' : 'var(--theme-error-500,#c33)'}`, borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.76em' }}>
          {validation.ok ? (
            <span style={{ color: 'var(--theme-success-500,#0a7)', fontWeight: 600 }}>✓ Valid — no errors.</span>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--theme-error-500,#c33)' }}>
              {validation.messages.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {blocks.map((b, i) => {
          const nlint = lintNode(b);
          const dot = nlint.errors.length > 0 ? 'var(--theme-error-500,#c33)' : nlint.warnings.length > 0 ? 'var(--theme-warning-500,#a70)' : 'var(--theme-success-500,#0a7)';
          return (
            <details key={`${primaryType(b)}-${i}`} style={{ border: '1px solid #2a2a2a', borderRadius: 6, padding: '0.4rem 0.6rem' }}>
              <summary style={{ cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ color: dot, fontSize: '0.9em', lineHeight: 1 }}>●</span>
                <code style={{ fontWeight: 600 }}>{primaryType(b)}</code>
              </summary>
              <pre style={{ fontFamily: 'monospace', fontSize: '0.78em', whiteSpace: 'pre-wrap', margin: '0.4rem 0 0' }}>
                {JSON.stringify(b, null, 2)}
              </pre>
            </details>
          );
        })}
      </div>
    </div>
  );
};
