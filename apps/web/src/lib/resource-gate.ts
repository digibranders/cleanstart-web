import { mediaUrl, type ResourceDetail } from "@/lib/resources";

export interface ResourceGate {
  gated: boolean;
  /** The resource's gate form id, or null when it names none. */
  gateFormId: number | null;
  /** The href for a plain download link. `#` whenever a gate is in force. */
  assetHref: string;
}

/**
 * What a download button needs to know about a resource's gate.
 *
 * `gateForm` is a bare id publicly (forms are admin-only to read) and an
 * object for an authenticated draft preview, so both shapes resolve here.
 */
export function resolveResourceGate(resource: ResourceDetail): ResourceGate {
  const gated = resource.gated === true;
  const raw =
    typeof resource.gateForm === "object" && resource.gateForm !== null
      ? Number(resource.gateForm.id)
      : Number(resource.gateForm);
  const gateFormId = Number.isInteger(raw) && raw > 0 ? raw : null;
  // A gated file's URL never reaches the client: the button's props are
  // serialised into the page, so passing it would publish the direct link the
  // gate exists to withhold. The download comes from the signed link instead.
  const assetHref =
    gated && gateFormId !== null
      ? "#"
      : resource.asset?.url
        ? (mediaUrl(resource.asset.url) ?? "#")
        : "#";
  return { gated, gateFormId, assetHref };
}
