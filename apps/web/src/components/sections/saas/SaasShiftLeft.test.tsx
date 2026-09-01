import { existsSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SaasShiftLeft } from './SaasShiftLeft';

function toText(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderSection(): string {
  return renderToStaticMarkup(<SaasShiftLeft />);
}

describe('SaasShiftLeft', () => {
  it('keeps the supplied heading and supporting paragraph exact', () => {
    const html = renderSection();
    const headingMarkup = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '';
    const paragraphMarkup = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';

    expect(toText(headingMarkup)).toBe('Move Beyond Shift Left');
    expect(toText(paragraphMarkup)).toBe(
      'Modern applications require security to be built into the software components developers use, not added after applications are created.',
    );
  });

  it('renders structurally distinct desktop and mobile Verified Core diagrams', () => {
    const html = renderSection();
    const mobile = html.slice(html.indexOf('data-verified-core="mobile"'));

    expect(html).toContain('data-verified-core="desktop"');
    expect(html).toContain('data-verified-core="mobile"');
    expect(html).not.toContain('data-cleanroom-reactor=');
    expect(html).not.toContain('data-reactor-chamber=');
    expect(html).not.toContain('Unverified Components');
    expect(mobile).toContain('data-late-review-path="return"');
    expect(mobile).toContain('data-verified-source="verified-components"');
    expect(mobile).toMatch(
      /data-core-stage="code"[\s\S]*data-core-stage="build"[\s\S]*data-core-stage="test"[\s\S]*data-core-stage="deploy"/,
    );
    expect(mobile).toContain('data-security-review="closed"');
    expect(mobile).toContain('data-security-review="open"');
    expect(mobile).toContain('data-release-exit="approved"');
  });

  it('carries one verified core through every delivery stage', () => {
    const html = renderSection();

    expect(html).toContain('data-verified-source="verified-components"');
    expect(html).toContain('data-trust-ribbon="continuous"');
    expect(html).toMatch(
      /data-core-stage="code"[\s\S]*data-core-stage="build"[\s\S]*data-core-stage="test"[\s\S]*data-core-stage="deploy"/,
    );
  });

  it('contrasts an open release with a closed late-review return', () => {
    const html = renderSection();

    expect(html).toContain('data-security-review="open"');
    expect(html).toContain('data-release-exit="approved"');
    expect(html).toContain('data-release-arrow="forward"');
    expect(html).toContain('data-security-review="closed"');
    expect(html).toContain('data-late-review-path="return"');
  });

  it('exposes both exact source sequences once and hides duplicate visuals', () => {
    const html = renderSection();

    expect(html.match(/aria-label="Code, Build, Test, Deploy, Security Review"/g)).toHaveLength(
      1,
    );
    expect(
      html.match(
        /aria-label="Verified Components, Code, Build, Test, Deploy, Security Review"/g,
      ),
    ).toHaveLength(1);
    expect(html).toMatch(/data-verified-core="desktop"[^>]*aria-hidden="true"/);
    expect(html).toMatch(/data-verified-core="mobile"[^>]*aria-hidden="true"/);
    expect(html).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(html).not.toMatch(/preserveAspectRatio=.none./);
  });

  it('provides a complete reduced-motion state for the Verified Core', () => {
    const stylesheetPath = new URL('./SaasVerifiedCore.module.css', import.meta.url);
    const stylesheet = existsSync(stylesheetPath) ? readFileSync(stylesheetPath, 'utf8') : '';

    expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)');
    expect(stylesheet).toMatch(
      /\.verifiedPulse,\s*\.returnPulse,\s*\.scannerBeam,\s*\.releaseCheck\s*{\s*animation: none !important;/,
    );
  });

  it('keeps the trust ribbon cyan-to-mint and animates the approved release state', () => {
    const stylesheet = readFileSync(
      new URL('./SaasVerifiedCore.module.css', import.meta.url),
      'utf8',
    );
    const trustRibbonRule = stylesheet.match(/\.trustRibbon\s*{([\s\S]*?)\n {2}}/)?.[1] ?? '';

    expect(trustRibbonRule).toContain('#7fe3ff 0%');
    expect(trustRibbonRule).not.toContain('#9a51ff');
    expect(stylesheet).toMatch(/\.releaseCheck\s*{[\s\S]*animation: releaseApproval/);
    expect(stylesheet).toContain('@keyframes releaseApproval');
  });
});
