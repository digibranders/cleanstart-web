/**
 * Four-category consent model (OneTrust standard):
 *  - strictlyNecessary: always granted, cannot be switched off.
 *  - performance: analytics / aggregated usage (→ analytics_storage).
 *  - functional: enhanced functionality + personalisation
 *    (→ functionality_storage, personalization_storage).
 *  - targeting: advertising / cross-site profiling
 *    (→ ad_storage, ad_user_data, ad_personalization).
 */
export type ConsentCategories = {
  strictlyNecessary: true;
  performance: boolean;
  functional: boolean;
  targeting: boolean;
};

/** The opt-in categories the user can toggle (everything except strictlyNecessary). */
export type OptionalCategory = "performance" | "functional" | "targeting";

export type ConsentDecision = "accept_all" | "reject_all" | "custom";

export interface ConsentRecord {
  v: number;
  id: string;
  decision: ConsentDecision;
  categories: ConsentCategories;
  ts: string; // ISO timestamp
  gpc: boolean;
}
