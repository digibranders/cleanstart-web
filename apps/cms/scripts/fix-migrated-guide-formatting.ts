#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: repair body formatting on guides migrated from the Knowledge Hub.
 *
 * 48 of the 52 bodies match their Academy source exactly. The four hand-built
 * Knowledge Hub articles do not, and a few Academy pages carry an inline table
 * of contents that duplicates the sidebar one. Fixes, by slug:
 *   - containers-vs-virtual-machines, docker-vs-oci-specification,
 *     container-images-in-cicd, helm: drop the inline "Table of Contents".
 *   - build-stage-security: the 15-item checklist was one giant heading; make it a list.
 *   - supply-chain-incident-response: drop the trailing colon on the "If ..." headings.
 *   - automated-attestation: restore stage order 1 to 5, real tables, lists
 *     instead of run-on label paragraphs, sub-sections one level down, and drop
 *     the empty "Implementation example" headings (their code was never in the source).
 *   - kubernetes-runtime-evidence: real lists for typed bullets, plain paragraphs
 *     for sentence-style headings, sub-sections one level down, no dead links.
 *     Its code samples are also missing from the source; that needs authoring.
 *
 * Previous versions stay in Payload's version history, so any page can be rolled
 * back from the admin. `--dry-run` prints the node-count change per page.
 *
 * In the prod container:
 *   /app/node_modules/.bin/tsx scripts/fix-migrated-guide-formatting.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/fix-migrated-guide-formatting.ts
 * `--only=<slug>` runs one page.
 */
import { getPayload } from 'payload';
import type { Payload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

interface Node {
  type: string;
  tag?: string;
  children?: Node[];
  text?: string;
  [key: string]: unknown;
}
interface Body {
  root: Node & { children: Node[] };
}

const text = (n: Node): string =>
  n.type === 'text' ? (n.text ?? '') : (n.children ?? []).map(text).join('');

const textNode = (value: string, bold = false): Node => ({
  type: 'text', text: value, mode: 'normal', style: '', detail: 0, format: bold ? 1 : 0, version: 1,
});
const paragraphOf = (children: Node[]): Node => ({
  type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1, textStyle: '', textFormat: 0,
});
const paragraph = (value: string): Node => paragraphOf([textNode(value)]);
const list = (items: Node[][]): Node => ({
  type: 'list', tag: 'ul', listType: 'bullet', start: 1, direction: 'ltr', format: '', indent: 0, version: 1,
  children: items.map((children, i) => ({
    type: 'listitem', value: i + 1, children, direction: 'ltr', format: '', indent: 0, version: 1,
  })),
});
const cell = (value: string, header: boolean): Node => ({
  type: 'tablecell', headerState: header ? 2 : 0, colSpan: 1, rowSpan: 1, children: [paragraph(value)],
  direction: 'ltr', format: '', indent: 0, version: 1,
});
const table = (rows: string[][]): Node => ({
  type: 'table', direction: 'ltr', format: '', indent: 0, version: 1,
  children: rows.map((row, r) => ({
    type: 'tablerow', direction: 'ltr', format: '', indent: 0, version: 1,
    children: row.map((value) => cell(value, r === 0)),
  })),
});

const isHeading = (n: Node, value?: string): boolean =>
  n.type === 'heading' && (value === undefined || text(n).trim() === value);
const level = (n: Node): number => Number((n.tag ?? 'h2').slice(1));

/** "Label: sentence. Label2: sentence." as a bullet list with bold labels. */
const labelled = (source: string, labels: string[], sep: string): Node => {
  const hits = labels.map((label) => ({ label, at: source.indexOf(label) }));
  if (hits.some((h) => h.at < 0)) throw new Error(`label missing in: ${source.slice(0, 60)}`);
  hits.sort((a, b) => a.at - b.at);
  return list(
    hits.map((h, i) => {
      const end = hits[i + 1]?.at ?? source.length;
      const rest = source.slice(h.at + h.label.length, end).replace(/^[:\s]+/, '').trim();
      return [textNode(h.label + (sep === ':' ? ':' : ''), true), textNode(` ${rest}`)];
    }),
  );
};

const removeInlineToc = (nodes: Node[]): Node[] => {
  const at = nodes.findIndex((n) => isHeading(n, 'Table of Contents'));
  if (at < 0 || nodes[at + 1]?.type !== 'list') throw new Error('inline TOC not found');
  return [...nodes.slice(0, at), ...nodes.slice(at + 2)];
};

const fixBuildStage = (nodes: Node[]): Node[] =>
  nodes.flatMap((n) => {
    if (!(isHeading(n) && text(n).startsWith('[ ]'))) return [n];
    const items = text(n).split('[ ]').map((s) => s.trim()).filter(Boolean);
    return [list(items.map((i) => [textNode(i)]))];
  });

const fixIncident = (nodes: Node[]): Node[] =>
  nodes.map((n) =>
    isHeading(n) && n.tag === 'h4' && text(n).trim().endsWith(':')
      ? { ...n, children: [textNode(text(n).trim().slice(0, -1))] }
      : n,
  );

const AA_ORDER = [
  'What this article covers', 'Understanding attestations', 'Why attestations prevent tampering',
  'SLSA compliance levels', 'Pipeline architecture overview', 'Core components',
  'Recommended technology stack', 'Stage 1: Source code attestation',
  'Stage 2: Build provenance attestation', 'Stage 3: Test and security attestation',
  'Stage 4: SBOM attestation', 'Stage 5: Deployment attestation', 'Verification and policy enforcement',
  'Optimization strategies', 'Performance impact and optimization', 'Implementation roadmap',
  'Common challenges and solutions', 'Notes / Tips', 'Related articles', 'References',
];
const AA_H3 = new Set([
  'Adding VEX documents', 'Critical requirements', 'SBOM best practices', 'Manual verification',
  'Automated policy enforcement with OPA', 'Kubernetes admission control with Kyverno',
  'Phase 1: Infrastructure setup (Month 1)', 'Phase 2: Pilot implementation (Months 2-3)',
  'Phase 3: Organization-wide rollout (Months 4-5)', 'Phase 4: Enforcement (Month 6)',
]);

const fixAutomatedAttestation = (input: Node[]): Node[] => {
  // 1. Demote sub-sections, then drop headings with nothing under them.
  const demoted = input.map((n) =>
    isHeading(n) && AA_H3.has(text(n).trim()) ? { ...n, tag: 'h3' } : n,
  );
  // The code under each "Implementation example" never made it into the source, so the
  // heading would sit empty; the stage's own paragraph carries the content.
  const kept = demoted.filter((n) => !isHeading(n, 'Implementation example'));

  // 2. Flat cell paragraphs and run-on label paragraphs become real structures.
  const body: Node[] = [];
  for (let i = 0; i < kept.length; i += 1) {
    const n = kept[i] as Node;
    const t = text(n).trim();
    const under = (h: string): boolean => text(kept[i - 1] ?? { type: 'x' }).trim() === h;
    if (n.type === 'paragraph' && t === 'Component' && under('Recommended technology stack')) {
      body.push(table([
        ['Component', 'Recommendation', 'Why'],
        ['Attestation Format', 'in-toto', 'SLSA standard format'],
        ['Signing', 'Sigstore', 'Keyless signing reduces operational overhead'],
        ['Verification', 'slsa-verifier', 'Policy-aware validation'],
        ['Policy enforcement', 'Open Policy Agent', 'Maximum flexibility'],
      ]));
      while (i + 1 < kept.length && !isHeading(kept[i + 1] as Node)) i += 1; // swallow the flat cells
      continue;
    }
    if (n.type === 'paragraph' && t === 'Typical overhead per pipeline stage') {
      body.push(n);
      body.push(table([
        ['Stage', 'Without Attestation', 'With Attestation', 'Overhead'],
        ['Build', '3m 45s', '4m 10s', '+25s (11%)'],
        ['Test', '2m 30s', '2m 45s', '+15s (10%)'],
        ['Package', '1m 15s', '1m 35s', '+20s (27%)'],
        ['Deploy', '45s', '55s', '+10s (22%)'],
        ['Total', '8m 15s', '9m 25s', '+1m 10s (14%)'],
      ]));
      while (i + 1 < kept.length && !isHeading(kept[i + 1] as Node)) i += 1;
      continue;
    }
    if (t.startsWith('Attestation Generators:')) {
      body.push(labelled(t, ['Attestation Generators', 'Signing Infrastructure', 'Attestation Storage', 'Verification Layer'], ':'));
    } else if (t.startsWith('Immutable Build Environment:')) {
      body.push(labelled(t, ['Immutable Build Environment', 'Hermetic Builds', 'Build Service Identity'], ':'));
    } else if (t.startsWith('Parallel attestation generation:')) {
      body.push(labelled(t, ['Parallel attestation generation', 'Cached signing credentials', 'Batched transparency log submissions', 'Async verification post-deployment'], ':'));
    } else if (t.startsWith('Attestations become stale')) {
      const cs = ['Attestations become stale in long-running pipelines', 'Private dependencies break hermetic builds', 'Key management complexity', 'Verification performance at scale'];
      body.push(labelled(t, cs, ''));
    } else {
      body.push(n);
    }
  }

  // 3. Split into H2 sections and put them back in reading order.
  const sections = new Map<string, Node[]>();
  let current = '';
  for (const n of body) {
    if (isHeading(n) && level(n) === 2) current = text(n).trim();
    const bucket = sections.get(current) ?? [];
    bucket.push(n);
    sections.set(current, bucket);
  }
  const unknown = [...sections.keys()].filter((k) => k !== '' && !AA_ORDER.includes(k));
  if (unknown.length > 0 || sections.has('')) throw new Error(`unplaced sections: ${unknown.join(', ')}`);
  return AA_ORDER.flatMap((h) => {
    const s = sections.get(h);
    if (!s) throw new Error(`missing section: ${h}`);
    return s;
  });
};

const RT_H2 = new Set([
  'What this article covers', 'Understanding eBPF for Kubernetes Monitoring', 'Prerequisites',
  'Types of Runtime Evidence You Can Collect', 'Step 1: Deploy Falco for Security Monitoring',
  'Step 2: Deploy Cilium/Hubble for Network Visibility', 'Step 3: Deploy Tetragon for Process Monitoring',
  'Step 4: Store and Analyze Evidence', 'Step 5: Create Custom eBPF Program (Advanced)',
  'Security Considerations', 'Performance Optimization', 'Real-World Use Cases', 'Troubleshooting',
  'Notes / Tips', 'Related Articles',
]);

const fixRuntimeEvidence = (input: Node[]): Node[] => {
  const out: Node[] = [];
  for (const n of input) {
    const t = text(n).trim();
    if (isHeading(n)) {
      if (t.endsWith(':') && !t.startsWith('1.') && !/^\d\./.test(t)) {
        out.push(paragraphOf([textNode(t, true)])); // "Why eBPF for Kubernetes:" and friends are lead-ins, not headings
        continue;
      }
      out.push(RT_H2.has(t) ? n : { ...n, tag: 'h3' });
      continue;
    }
    if (n.type === 'paragraph' && t.startsWith('•')) {
      const items = t.split('•').map((s) => s.trim()).filter(Boolean);
      const last = out[out.length - 1];
      const entries = items.map((i) => [textNode(i)]);
      if (last?.type === 'list') last.children = [...(last.children ?? []), ...list(entries).children as Node[]];
      else out.push(list(entries));
      continue;
    }
    if (n.type === 'list' && t.includes('[Kubernetes Security Best Practices](#)')) {
      out.push(list((n.children ?? []).map((li) => [textNode(text(li).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'))])));
      continue;
    }
    out.push(n);
  }
  return out;
};

const FIXES: Record<string, (nodes: Node[]) => Node[]> = {
  'containers-vs-virtual-machines': removeInlineToc,
  'docker-vs-oci-specification': removeInlineToc,
  'container-images-in-cicd': removeInlineToc,
  helm: removeInlineToc,
  'build-stage-security': fixBuildStage,
  'supply-chain-incident-response': fixIncident,
  'automated-attestation': fixAutomatedAttestation,
  'kubernetes-runtime-evidence': fixRuntimeEvidence,
};

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes('--dry-run');
  const payload: Payload = await getPayload({ config: payloadConfig });
  const touched: string[] = [];
  const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
  for (const [slug, fix] of Object.entries(FIXES)) {
    if (only && slug !== only) continue;
    const res = await payload.find({
      collection: 'guides', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true,
    });
    const doc = res.docs[0] as unknown as { id: number; body: Body; _status: string } | undefined;
    if (!doc) throw new Error(`guide not found: ${slug}`);
    const before = doc.body.root.children;
    const after = fix(structuredClone(before));
    log(`${dryRun ? 'would  ' : 'fix    '} ${slug}: ${before.length} -> ${after.length} top-level nodes`);
    if (dryRun) continue;
    await payload.update({
      collection: 'guides',
      id: doc.id,
      data: { body: { ...doc.body, root: { ...doc.body.root, children: after } } } as never,
      overrideAccess: true,
      context: { skipPublishWebhooks: true },
    });
    touched.push(`/guide/${slug}`);
  }
  if (dryRun || touched.length === 0) return;
  const purge = await revalidateWeb(payload, { paths: touched });
  log(`purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err);
    process.exit(1);
  });
