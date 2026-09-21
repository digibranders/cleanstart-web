/**
 * The shape every `/compare/*` page fills in, and the chrome none of them own.
 *
 * `/compare/cleanstart-vs-docker-hardened-images` was the first of these and
 * carried its copy inside the section components. A second comparison (Red
 * Hat) made that a choice between two copies of 3,400 lines and one set of
 * sections driven by content. This file is the contract: a page supplies a
 * `CompareContent`, the sections render it, and no section knows which
 * comparison it is drawing.
 *
 * The comparator is called the "rival" throughout rather than the vendor's
 * name, so the same component tree serves Docker, Red Hat and whatever comes
 * next. CleanStart is always the right-hand column and always the violet one.
 *
 * Copy in a content file is the SEO source document's, verbatim, with one
 * class of edit: em-dashes become a colon or a semicolon per the house writing
 * rule. Anything the document does not write — link labels, accessible names,
 * legend text — belongs in `UI` below, never in a content file.
 */

/** Which column a value belongs to. CleanStart is never the rival. */
export type CompareTone = "rival" | "cleanstart";

/**
 * A matrix cell. `yes` / `no` render as markers with a screen-reader label;
 * `text` renders the document's phrase; `both` is the source table's "✓
 * <detail>" shape, a tick with a qualifier beside it; `qualified` is its "✓*",
 * a tick the source flags as varying by image, variant or tier. The document's
 * own "✓" and "—" glyphs map to `yes` and `no` so the markers can carry an
 * accessible name and a colour rather than sitting in the page as bare
 * punctuation.
 */
export type MatrixCell =
  | { readonly kind: "yes" }
  | { readonly kind: "no" }
  | { readonly kind: "qualified" }
  | { readonly kind: "both"; readonly value: string }
  | { readonly kind: "text"; readonly value: string };

export const yes: MatrixCell = { kind: "yes" };
export const no: MatrixCell = { kind: "no" };
/** The source table's "✓*". */
export const qualified: MatrixCell = { kind: "qualified" };
export const text = (value: string): MatrixCell => ({ kind: "text", value });
/** A tick that carries a qualifier, the source table's "✓ <detail>" cells. */
export const both = (value: string): MatrixCell => ({ kind: "both", value });

export interface MatrixRow {
  readonly id: string;
  readonly capability: string;
  readonly rival: MatrixCell;
  readonly cleanstart: MatrixCell;
}

export interface MatrixGroup {
  readonly id: string;
  readonly label: string;
  /** Violet 3D icon that opens the group's chapter in the rendered table. */
  readonly icon: string;
  readonly rows: readonly MatrixRow[];
}

export interface MatrixSection {
  readonly heading: string;
  /** Omitted when the source document writes the heading with no standfirst. */
  readonly intro?: string;
  /** Table caption, read instead of the table by screen readers. */
  readonly caption: string;
  readonly footnote: string;
  /**
   * Legend text for `qualified` cells. Required when any row uses one, so an
   * asterisk in the table always has something explaining it.
   */
  readonly qualifiedNote?: string;
  readonly groups: readonly MatrixGroup[];
}

export interface FoundationColumn {
  readonly id: CompareTone;
  readonly label: string;
  readonly body: string;
  readonly focusLabel: string;
  readonly focus: readonly string[];
}

export interface FoundationsSection {
  readonly heading: string;
  readonly intro?: string;
  /**
   * Render each column's vendor name as an `<h3>` rather than a `<p>`. Set it
   * only where the source document sets those names as headings: the Docker
   * document does not, the Chainguard document does, and heading levels on
   * these pages are the document's. Defaults to a paragraph, so a page that
   * says nothing keeps the outline SEO wrote.
   */
  readonly labelAsHeading?: boolean;
  readonly columns: readonly [FoundationColumn, FoundationColumn];
}

/**
 * A lane in the build-process diagram. Only `steps` is required: where a
 * source document draws the flow and nothing else, the band is the two lanes
 * and the gate, and the notes beneath them are simply absent rather than
 * filled with copy the document did not write.
 */
export interface BuildFlowColumn {
  readonly id: CompareTone;
  readonly label: string;
  readonly body?: string;
  /** Lead-in above the lanes, e.g. "Build approach:". */
  readonly stepsLabel?: string;
  /** Ordered stages. The last one is the destination both lanes share. */
  readonly steps: readonly string[];
  readonly traitsLabel?: string;
  readonly traits?: readonly string[];
}

export interface BuildFlowSection {
  readonly heading: string;
  readonly intro?: string;
  readonly columns: readonly [BuildFlowColumn, BuildFlowColumn];
}

export interface Differentiator {
  readonly id: string;
  readonly heading: string;
  readonly body: string;
  readonly icon: string;
}

export interface DifferentiatorsSection {
  readonly heading: string;
  readonly items: readonly Differentiator[];
}

export interface CompareFaq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export interface CompareCtaContent {
  readonly heading: string;
  readonly body: string;
  readonly button: string;
  readonly href: string;
}

/**
 * A base the rival inherits rather than builds. Drawn as a dashed ghost tile
 * ahead of its lane, which is why that lane starts where it does. Present only
 * where the source document gives the rival fewer build stages than
 * CleanStart; where both lanes are the same length there is nothing to draw.
 */
export interface InheritedBase {
  readonly label: string;
  readonly note: string;
}

export interface CompareContent {
  /** Path-only canonical, e.g. `/compare/cleanstart-vs-…`. */
  readonly path: string;
  readonly meta: { readonly title: string; readonly description: string };
  /** Full document title, also the BreadcrumbList leaf. */
  readonly title: string;
  /**
   * The displayed H1. The hero shows the comparison itself and leaves the
   * document title's ": Secure Container Images Compared" suffix to the page
   * title and breadcrumb (`title`), per the 2026-09-03 design review: at
   * display size the suffix runs the heading to four lines and pushes the
   * calls to action below the fold. The brand name takes the gradient so the
   * title reads as one line of type.
   */
  readonly titleParts: {
    readonly lead: string;
    readonly accent: string;
    /**
     * Optional tail after the brand name, for a document that needs the whole
     * title in the hero. Measured on the Red Hat page: at display size the
     * suffix runs the heading to four lines and pushes the calls to action
     * below the fold, so prefer leaving it off.
     */
    readonly trail?: string;
  };
  readonly standfirst: string;
  /** The two vendors, named once. Every section labels its columns from here. */
  readonly vendor: { readonly rival: string; readonly cleanstart: string };
  /** The rival's logo, shown on a white plate beside its name. */
  readonly rivalMark: string;
  readonly heroCta: { readonly label: string; readonly href: string };
  readonly inheritedBase?: InheritedBase;
  readonly foundations: FoundationsSection;
  readonly matrix: MatrixSection;
  readonly buildFlow: BuildFlowSection;
  readonly differentiators: DifferentiatorsSection;
  readonly faqHeading: string;
  readonly faqs: readonly CompareFaq[];
  readonly cta: CompareCtaContent;
}

/** Rows in a matrix, derived so a section summary can never drift from it. */
export const matrixRowCount = (matrix: MatrixSection): number =>
  matrix.groups.reduce((total, group) => total + group.rows.length, 0);

/**
 * Whether a row gives both vendors the same answer. Two cells agree when they
 * are the same kind and, where that kind carries a phrase, the same phrase.
 *
 * Lives here rather than in the matrix because the `/compare` hub counts
 * differences per comparison and the matrix's own "differences only" switch
 * hides them: one definition, so a card can never advertise a count the table
 * then contradicts.
 */
export const rowsAgree = (row: MatrixRow): boolean => {
  if (row.rival.kind !== row.cleanstart.kind) return false;
  if (
    (row.rival.kind === "text" || row.rival.kind === "both") &&
    (row.cleanstart.kind === "text" || row.cleanstart.kind === "both")
  ) {
    return row.rival.value === row.cleanstart.value;
  }
  return true;
};

/** Rows where the two vendors' answers differ. */
export const matrixDifferenceCount = (matrix: MatrixSection): number =>
  matrix.groups.reduce(
    (total, group) => total + group.rows.filter((row) => !rowsAgree(row)).length,
    0,
  );

/* ──────────────────────── UI-only strings ──────────────────────── */

/**
 * Chrome no source document writes: link labels, accessible names and the
 * marker states in the matrix. Kept apart from the content files so a future
 * document diff never has to reason about them, and shared across every
 * comparison so the two pages cannot describe the same control differently.
 */
export const UI = {
  jumpToMatrix: "Compare capabilities",
  available: "Available",
  notAvailable: "Not available",
  /** Screen-reader name for a `qualified` cell; `qualifiedNote` gives the detail. */
  availableQualified: "Available, with conditions",
  /** Marker on the divider between the two vendor columns. */
  versus: "vs",
  /** Column caption for the capability column in the matrix head. */
  capability: "Capability",
  /** Matrix controls and legend. */
  groupIndex: "Jump to",
  differencesOnly: "Show differences only",
  legendAvailable: "Available",
  legendNotAvailable: "Not available",
} as const;
