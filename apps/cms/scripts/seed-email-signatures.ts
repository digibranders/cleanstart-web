#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot ETL: import the legacy standalone signature files into the CMS.
 *
 * Source is the `cleanstart-email-signatures` repo checked out beside this one.
 * All 20 files are the same table markup differing only in name / job title /
 * email / phone, so the import derives ONE `signatureTemplates` row plus one
 * `emailSignatures` row per person.
 *
 * The only differences between the files that were not whitespace are drift
 * nobody intended: 8 of the 20 carry `padding-right: 6px` where the other 12
 * carry `8px`, plus a few stray `line-height` declarations. The majority shape
 * wins; pass `--source <file>` to pick a different canonical file.
 *
 * VERIFY: after building the template the script re-renders every person from
 * it and diffs the result against their original file (whitespace-normalised).
 * Any mismatch is reported and, unless `--force`, aborts before writing.
 *
 * SAFETY: idempotent — matches existing rows on `slug` and updates in place.
 * `--dry-run` previews without writing.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/seed-email-signatures.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-email-signatures.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import {
  buildTokenValues,
  renderSignature,
  unknownTokens,
} from '../src/payload/lib/email-signature/render.ts';
import { SIGNATURE_GROUPS } from '../src/payload/collections/EmailSignatures.ts';
import { slugify } from '../src/payload/lib/slugify.ts';

const TEMPLATE_SLUG = 'cleanstart-standard-2026';
const TEMPLATE_NAME = 'CleanStart Standard 2026';
const DEFAULT_SOURCE = 'Nilesh-Jain.html';

/**
 * Top-level `.html` files in the source folder that are NOT employee
 * signatures and must never be imported:
 *   - index.html                   the old directory page, replaced by /email-signatures
 *   - cleanstart-hitachi-event.html a one-off event mailer (and broken: it
 *                                   references image.png / logo.png relatively,
 *                                   neither of which exists)
 *
 * Subdirectories are never scanned, which also excludes `old signs/` (16
 * superseded files, including three Vijendra size variants), `emailer/`
 * (campaign banner strips — a different content type), `assets/`, `scripts/`
 * and the repo's own dotfolders.
 */
const NON_SIGNATURE_FILES = new Set(['index.html', 'cleanstart-hitachi-event.html']);

/**
 * HR roster of 2026-07-28 — the authoritative record for everyone on it.
 * Applied over the values parsed from each signature file by `applyRoster`.
 */
type RosterEntry = { name: string; jobTitle: string; email: string; mobile: string };

const ROSTER: readonly RosterEntry[] = [
  { name: 'Gaurav Solanki', jobTitle: 'Product Manager', email: 'gaurav.solanki@cleanstart.com', mobile: '9879204334' },
  { name: 'Khushboo Agarwal', jobTitle: 'Project Coordinator', email: 'khushboo.agarwal@cleanstart.com', mobile: '8264100573' },
  { name: 'Abhishek Negi', jobTitle: 'Sr. Software Engineer - Python', email: 'abhishek.negi@cleanstart.com', mobile: '6355037994' },
  { name: 'Anil Raj', jobTitle: 'Sr. DevOps Engineer', email: 'anil.raj@cleanstart.com', mobile: '6300318042' },
  { name: 'Abhishek Nagar', jobTitle: 'Sr. Systems Engineer', email: 'abhishek.nagar@cleanstart.com', mobile: '9537741830' },
  { name: 'Biplab Paul', jobTitle: 'Senior Product Marketing Manager', email: 'biplab.paul@cleanstart.com', mobile: '9632441133' },
  { name: 'Michael Noah', jobTitle: 'Senior Business Development Executive', email: 'michael.noah@cleanstart.com', mobile: '7019296617' },
  { name: 'Gandharv Rawat', jobTitle: 'Digital Marketing Manager', email: 'gandharv.rawat@cleanstart.com', mobile: '9945601123' },
  { name: 'Ishan Singh', jobTitle: 'Community Marketing Manager', email: 'ishan.singh@cleanstart.com', mobile: '9740161155' },
  { name: 'Rishi Chandnani', jobTitle: 'Marketing Content Specialist', email: 'rishi.chandnani@cleanstart.com', mobile: '8140421564' },
  { name: 'Pooja Lacchwani', jobTitle: 'HR Manager', email: 'pooja.lachhwani@cleanstart.com', mobile: '9274122269' },
  { name: 'Sourashmi Roy', jobTitle: 'Legal Executive', email: 'sourashmi.roy@cleanstart.com', mobile: '9464860989' },
  { name: 'Jaishree Bansal', jobTitle: 'Talent Acquisition Specialist', email: 'jaishree.bansal@cleanstart.com', mobile: '9904123338' },
  { name: 'Bhavik Nabhani', jobTitle: 'Cyber Security Analyst', email: 'bhavik.nabhani@cleanstart.com', mobile: '7990113989' },
  { name: 'Nooreen Siddique', jobTitle: 'Support Engineer', email: 'nooreen.siddique@cleanstart.com', mobile: '8745875598' },
  { name: 'Meet Prajapati', jobTitle: 'Associate DevOps Engineer', email: 'meet.prajapati@cleanstart.com', mobile: '7698001031' },
  { name: 'Nikhil Patil', jobTitle: 'Delivery Engineer', email: 'nikhil.patil@cleanstart.com', mobile: '9380271206' },
  { name: 'Abhishek Pandey', jobTitle: 'Linux System Administrator', email: 'abhishekh.pandey@cleanstart.com', mobile: '8999437014' },
  { name: 'Saurabh Pal', jobTitle: 'Linux System Administrator', email: 'saurabh.pal@cleanstart.com', mobile: '9877332318' },
  { name: 'Kunal Khambalkar', jobTitle: 'Linux System Administrator', email: 'kunal.kambalkar@cleanstart.com', mobile: '8149779185' },
  { name: 'Anirvedh Banoth', jobTitle: 'Linux System Administrator', email: 'anirvedh.banoth@cleanstart.com', mobile: '7569403528' },
  { name: 'Tejas Savaliya', jobTitle: 'Software Engineer', email: 'tejas.savaliya@cleanstart.com', mobile: '9979328599' },
  { name: 'Kenil Chandani', jobTitle: 'Associate Software Engineer', email: 'kenil.chandani@cleanstart.com', mobile: '7624071146' },
  { name: 'Dev Suthar', jobTitle: 'Associate Software Engineer - CDP', email: 'dev.suthar@cleanstart.com', mobile: '9106602577' },
  { name: 'Khushi Trivedi', jobTitle: 'Developer Advocate', email: 'khushi.trivedi@cleanstart.com', mobile: '9111536466' },
  { name: 'Shruti Pancholi', jobTitle: 'People Operations & Talent Acquisition Specialist', email: 'shruti.pancholi@cleanstart.com', mobile: '9624118661' },
];

const ROSTER_BY_EMAIL: ReadonlyMap<string, RosterEntry> = new Map(
  ROSTER.map((entry) => [entry.email.toLowerCase(), entry]),
);

/**
 * Applies the HR roster over what was parsed out of the signature file.
 *
 * The roster is the later, authoritative record and covers both brand-new
 * hires and six people who were already in the original set, so it wins on
 * every field it carries — name, job title and phone. Joined on email, which
 * diffed identically across all 26 rows and is the one field that cannot
 * plausibly differ between the two sources.
 *
 * `slug` follows the roster name. Safe because nothing references
 * `/email-signatures/<slug>` yet: the directory has never been seeded and the
 * legacy signatures are standalone files, not links.
 *
 * `phoneDisplay` is left as the file formats it — the roster gives a bare
 * 10-digit mobile, and the file's grouping is the presentation choice.
 */
const applyRoster = (person: ParsedSignature): ParsedSignature => {
  const entry = ROSTER_BY_EMAIL.get(person.email.toLowerCase());
  if (!entry) return person;
  return {
    ...person,
    name: entry.name,
    slug: slugify(entry.name),
    jobTitle: entry.jobTitle,
    phoneE164: `+91${entry.mobile}`,
  };
};

/**
 * People whose signature exists but who have not started yet. Imported
 * deactivated so they do not appear on the public directory and their URL does
 * not resolve until HR ticks `active` on their first day.
 */
const NOT_YET_STARTED: ReadonlySet<string> = new Set([
  // Roster (2026-07-28) marks Shruti Pancholi as "Will join next week".
  'shruti-pancholi',
]);

/**
 * Directory groupings. Anyone absent here is reported and left for manual
 * assignment rather than guessed into a bucket. Keys are the slug as written
 * after the roster is applied.
 */
const GROUP_BY_SLUG: Readonly<Record<string, (typeof SIGNATURE_GROUPS)[number]>> = {
  // Executive Leadership
  'nilesh-jain': 'Executive Leadership',
  'biswajit-de': 'Executive Leadership',
  'vijendra-katiyar': 'Executive Leadership',
  // Sales & Regional Leadership
  'adrian-lee': 'Sales & Regional Leadership',
  'anil-dhoot': 'Sales & Regional Leadership',
  'arjun-d-j': 'Sales & Regional Leadership',
  'michael-noah': 'Sales & Regional Leadership',
  // Marketing & Communications
  'biplab-paul': 'Marketing & Communications',
  'gandharv-rawat': 'Marketing & Communications',
  'ishan-singh': 'Marketing & Communications',
  'pallavi-puri': 'Marketing & Communications',
  'rishi-chandnani': 'Marketing & Communications',
  'khushi-trivedi': 'Marketing & Communications',
  // HR & People Operations
  'pooja-lacchwani': 'HR & People Operations',
  'jaishree-bansal': 'HR & People Operations',
  'shruti-pancholi': 'HR & People Operations',
  // Account Management & Sales Operations
  'sidhika-mirajkar': 'Account Management & Sales Operations',
  'uttam-kaul': 'Account Management & Sales Operations',
  'mark-tharakan': 'Account Management & Sales Operations',
  'nafisul-zaman': 'Account Management & Sales Operations',
  'mrinaal-duggal': 'Account Management & Sales Operations',
  'monali-lalwani': 'Account Management & Sales Operations',
  // Engineering & Technical Solutions
  'dhanush-vm': 'Engineering & Technical Solutions',
  'abhishek-negi': 'Engineering & Technical Solutions',
  'anil-raj': 'Engineering & Technical Solutions',
  'abhishek-nagar': 'Engineering & Technical Solutions',
  'meet-prajapati': 'Engineering & Technical Solutions',
  'tejas-savaliya': 'Engineering & Technical Solutions',
  'kenil-chandani': 'Engineering & Technical Solutions',
  'dev-suthar': 'Engineering & Technical Solutions',
  'nikhil-patil': 'Engineering & Technical Solutions',
  'nooreen-siddique': 'Engineering & Technical Solutions',
  'bhavik-nabhani': 'Engineering & Technical Solutions',
  // Product & Program Management
  'gaurav-solanki': 'Product & Program Management',
  'khushboo-agarwal': 'Product & Program Management',
  // Infrastructure & Systems — all four are Linux System Administrators
  'abhishek-pandey': 'Infrastructure & Systems',
  'saurabh-pal': 'Infrastructure & Systems',
  'kunal-khambalkar': 'Infrastructure & Systems',
  'anirvedh-banoth': 'Infrastructure & Systems',
  // Legal
  'sourashmi-roy': 'Legal',
};

type ParsedSignature = {
  file: string;
  slug: string;
  name: string;
  jobTitle: string;
  email: string;
  phoneE164: string;
  phoneDisplay: string;
  bodyHtml: string;
};

/**
 * Reduces markup to what a mail client actually renders, so the parity check
 * compares meaning rather than formatting. Used only for verification — never
 * for the HTML that gets stored.
 *
 * Two source quirks it deliberately absorbs:
 *  - Prettier reflow left a trailing space before `>` in some files (`" >`).
 *  - Several source files carry a raw, unescaped `&` in job titles
 *    ("Co-founder & CEO"), which is invalid HTML. The renderer emits the
 *    correct `&amp;`, so entities are decoded on both sides before comparing.
 */
const normalise = (html: string): string =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/\s*=\s*"/g, '="')
    .replace(/\s+>/g, '>')
    // Decode the full entity set the renderer emits, not just &amp; — a name
    // like O'Brien or a title containing a quote renders as &#39;/&quot; and
    // would otherwise read as a mismatch and abort the import.
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

/** Everything between <body> and </body> — the part a mail client keeps. */
const extractBody = (html: string): string => {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match?.[1]) throw new Error('No <body> found');
  return match[1];
};

const firstMatch = (html: string, pattern: RegExp, label: string): string => {
  const match = html.match(pattern);
  if (!match?.[1]) throw new Error(`Could not extract ${label}`);
  return match[1].trim();
};

const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();

const parseSignature = (file: string, raw: string): ParsedSignature => {
  const body = extractBody(raw);
  const flat = normalise(body);

  // Name is the only 16px/700 #056cf2 paragraph; job title is the 13px one
  // that follows it. Both are matched on their inline style, which is the
  // one thing the drift never touched.
  const name = decodeEntities(
    firstMatch(
      flat,
      /font-size:\s*16px;\s*font-weight:\s*700;\s*color:\s*#056cf2[^>]*>\s*([^<]+)</i,
      'name',
    ),
  );
  const jobTitle = decodeEntities(
    firstMatch(flat, /font-size:\s*13px;\s*font-weight:\s*400[^>]*>\s*([^<]+)</i, 'job title'),
  );
  const email = decodeEntities(firstMatch(flat, /href="mailto:([^"]+)"/i, 'email'));
  const phoneE164 = decodeEntities(firstMatch(flat, /href="tel:([^"]+)"/i, 'phone href')).replace(
    /[\s()-]/g,
    '',
  );
  const phoneDisplay = decodeEntities(
    firstMatch(flat, /href="tel:[^"]+"[^>]*>([^<]+)</i, 'phone display'),
  );

  return {
    file,
    slug: slugify(path.basename(file, '.html')),
    name,
    jobTitle,
    email,
    phoneE164,
    phoneDisplay,
    bodyHtml: body,
  };
};

/**
 * Bottom-aligns the left column with the right.
 *
 * Both columns ship `vertical-align: top`, so each ends at its own natural
 * content height: the tagline finished 5.3px above the social icons, which
 * reads as a wonky baseline across the whole signature. Switching the logo
 * column to bottom alignment pins the tagline to the row's bottom edge — the
 * same edge the social row already sits on, since the taller right column is
 * what sets the row height.
 *
 * The `valign` attribute is set alongside the CSS because Outlook's Word
 * rendering engine honours the presentational attribute more reliably than
 * `vertical-align` on a `<td>`.
 */
const LEFT_COLUMN_TOP_ALIGNED = `<td
                style="
                  width: 210px;
                  padding: 0 15px 0 0;
                  vertical-align: top;
                "
              >`;

const LEFT_COLUMN_BOTTOM_ALIGNED = `<td
                valign="bottom"
                style="
                  width: 210px;
                  padding: 0 15px 0 0;
                  vertical-align: bottom;
                "
              >`;

const alignColumnBottoms = (html: string): string => {
  if (!html.includes(LEFT_COLUMN_TOP_ALIGNED)) {
    throw new Error(
      'Could not find the left column <td> to bottom-align — the canonical file markup has changed.',
    );
  }
  return html.replace(LEFT_COLUMN_TOP_ALIGNED, LEFT_COLUMN_BOTTOM_ALIGNED);
};

/** Replaces this person's values in the canonical file with `{{tokens}}`. */
const buildTemplate = (source: ParsedSignature): string => {
  let html = source.bodyHtml;

  const substitutions: [string, string][] = [
    [`mailto:${source.email}`, 'mailto:{{email}}'],
    [`tel:${source.phoneE164}`, 'tel:{{phoneHref}}'],
    [source.email, '{{email}}'],
    [source.phoneDisplay, '{{phone}}'],
    [source.name, '{{name}}'],
    [source.jobTitle, '{{jobTitle}}'],
  ];

  for (const [needle, token] of substitutions) {
    if (!html.includes(needle)) {
      throw new Error(`Canonical file ${source.file} does not contain "${needle}" verbatim`);
    }
    html = html.split(needle).join(token);
  }

  return html;
};

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const sourceArgIndex = process.argv.indexOf('--source');
  const sourceFile =
    sourceArgIndex >= 0 ? (process.argv[sourceArgIndex + 1] ?? DEFAULT_SOURCE) : DEFAULT_SOURCE;

  const dirArgIndex = process.argv.indexOf('--dir');
  const sourceDir = path.resolve(
    dirArgIndex >= 0
      ? (process.argv[dirArgIndex + 1] ?? '')
      : path.join(import.meta.dirname, '../../../cleanstart-email-signatures'),
  );

  console.log(`Source directory: ${sourceDir}`);
  console.log(`Canonical template file: ${sourceFile}`);
  console.log(dryRun ? 'MODE: dry-run (no writes)\n' : 'MODE: write\n');

  // `withFileTypes` + `isFile()` keeps this to regular files in the top level
  // only — directories (old signs/, emailer/, assets/) are never descended
  // into, so nothing outside the current employee set can be picked up.
  const entries = readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name)
    .sort();

  const files = entries.filter((f) => !NON_SIGNATURE_FILES.has(f));
  const skipped = entries.filter((f) => NON_SIGNATURE_FILES.has(f));

  for (const file of skipped) {
    console.log(`  SKIP (not a signature)  ${file}`);
  }
  console.log(`Importing ${files.length} signature file(s); skipped ${skipped.length}.`);

  if (files.length === 0) throw new Error(`No signature files found in ${sourceDir}`);

  const parsed: ParsedSignature[] = [];
  for (const file of files) {
    try {
      parsed.push(parseSignature(file, readFileSync(path.join(sourceDir, file), 'utf8')));
    } catch (error) {
      console.error(`  PARSE FAIL  ${file}: ${(error as Error).message}`);
    }
  }
  console.log(`Parsed ${parsed.length}/${files.length} signature files.`);

  const canonical = parsed.find((p) => p.file === sourceFile);
  if (!canonical) throw new Error(`Canonical file ${sourceFile} not among parsed files`);

  // Parity is checked against the faithful tokenisation of the source file;
  // the bottom-alignment fix is applied afterwards so a deliberate improvement
  // never shows up as 20 "failures" and masks a real extraction bug.
  const verbatimHtml = buildTemplate(canonical);
  const templateHtml = alignColumnBottoms(verbatimHtml);
  const unknown = unknownTokens(templateHtml);
  if (unknown.length > 0) throw new Error(`Template has unknown tokens: ${unknown.join(', ')}`);
  console.log(`Built template from ${sourceFile} (${templateHtml.length} chars).\n`);

  // ── Verify: re-render everyone and diff against their original file ──
  let mismatches = 0;
  for (const person of parsed) {
    const rendered = renderSignature({ templateHtml: verbatimHtml, values: buildTokenValues(person) });
    if (normalise(rendered) !== normalise(person.bodyHtml)) {
      mismatches += 1;
      console.log(`  DIFF   ${person.name} (${person.file})`);
    }
  }
  console.log(
    mismatches === 0
      ? `Render parity: all ${parsed.length} signatures reproduce their original byte-for-byte (normalised).\n`
      : `Render parity: ${mismatches}/${parsed.length} differ from the original — expected for files carrying the known formatter drift.\n`,
  );

  // Parity above is checked on file-faithful values; the roster is applied here
  // so what gets written is the authoritative record.
  const records = parsed.map(applyRoster);

  const updatedByRoster = records.filter((r, i) => {
    const before = parsed[i];
    return (
      before !== undefined &&
      (before.name !== r.name ||
        before.jobTitle !== r.jobTitle ||
        before.phoneE164 !== r.phoneE164)
    );
  });
  for (const person of updatedByRoster) {
    const before = parsed[records.indexOf(person)];
    const diffs: string[] = [];
    if (before && before.name !== person.name) diffs.push(`name "${before.name}" → "${person.name}"`);
    if (before && before.jobTitle !== person.jobTitle) diffs.push('jobTitle');
    if (before && before.phoneE164 !== person.phoneE164) {
      diffs.push(`phone ${before.phoneE164} → ${person.phoneE164}`);
    }
    console.log(`  ROSTER  ${person.email}: ${diffs.join(', ')}`);
  }
  const unmatchedRoster = ROSTER.filter(
    (e) => !records.some((r) => r.email.toLowerCase() === e.email.toLowerCase()),
  );
  for (const entry of unmatchedRoster) {
    console.log(`  ROSTER ROW WITHOUT A SIGNATURE FILE  ${entry.name} <${entry.email}>`);
  }
  console.log(
    `Roster: ${ROSTER.length} rows, ${records.length - unmatchedRoster.length >= 0 ? ROSTER.length - unmatchedRoster.length : 0} matched, ${updatedByRoster.length} record(s) updated.\n`,
  );

  const missingGroup = records.filter((p) => !GROUP_BY_SLUG[p.slug]);
  for (const person of missingGroup) {
    console.log(`  NO GROUP  ${person.name} (${person.slug}) — assign manually in the CMS`);
  }

  if (mismatches > 0 && !force && !dryRun) {
    throw new Error(
      `Aborting: ${mismatches} signature(s) do not round-trip. Review the diffs, then re-run with --force to accept the canonical template for everyone.`,
    );
  }

  if (dryRun) {
    console.log('\nWould write:');
    console.log(`  1 signatureTemplates row (${TEMPLATE_SLUG})`);
    console.log(`  ${parsed.length} emailSignatures rows`);
    for (const p of records) {
      console.log(
        `    ${p.slug.padEnd(20)} ${p.name.padEnd(18)} ${p.email.padEnd(32)} ${p.phoneE164}`,
      );
    }
    return;
  }

  const payload = await getPayload({ config });

  const existingTemplate = await payload.find({
    collection: 'signatureTemplates',
    where: { slug: { equals: TEMPLATE_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const templateData = {
    name: TEMPLATE_NAME,
    slug: TEMPLATE_SLUG,
    html: templateHtml,
    isDefault: true,
    notes: `Imported from ${sourceFile} in the cleanstart-email-signatures repo.`,
    _status: 'published' as const,
  };

  const templateId =
    existingTemplate.docs[0]?.id ??
    (
      await payload.create({
        collection: 'signatureTemplates',
        data: templateData,
        overrideAccess: true,
      })
    ).id;

  if (existingTemplate.docs[0]) {
    await payload.update({
      collection: 'signatureTemplates',
      id: templateId,
      data: templateData,
      overrideAccess: true,
    });
    console.log(`Updated template ${TEMPLATE_SLUG} (id ${templateId}).`);
  } else {
    console.log(`Created template ${TEMPLATE_SLUG} (id ${templateId}).`);
  }

  let created = 0;
  let updated = 0;
  for (const person of records) {
    const group = GROUP_BY_SLUG[person.slug];
    if (!group) {
      console.log(`  SKIP    ${person.name} — no group mapping`);
      continue;
    }

    const data = {
      name: person.name,
      slug: person.slug,
      jobTitle: person.jobTitle,
      email: person.email,
      phoneE164: person.phoneE164,
      phoneDisplay: person.phoneDisplay,
      template: templateId,
      group,
      active: !NOT_YET_STARTED.has(person.slug),
    };

    const existing = await payload.find({
      collection: 'emailSignatures',
      where: { slug: { equals: person.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.docs[0]) {
      // `active` is deliberately NOT re-sent. Re-running the import must never
      // resurrect someone who has been offboarded — that would put a departed
      // employee's signature back on the public directory.
      const { active: _active, ...updatable } = data;
      await payload.update({
        collection: 'emailSignatures',
        id: existing.docs[0].id,
        data: updatable,
        overrideAccess: true,
      });
      updated += 1;
    } else {
      await payload.create({ collection: 'emailSignatures', data, overrideAccess: true });
      created += 1;
    }
  }

  console.log(`\nDone. Created ${created}, updated ${updated}.`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
