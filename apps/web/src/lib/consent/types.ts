export type ConsentCategories = { essential: true; analytics: boolean };
export type ConsentDecision = "accept_all" | "reject_all" | "custom";

export interface ConsentRecord {
  v: number;
  id: string;
  decision: ConsentDecision;
  categories: ConsentCategories;
  ts: string; // ISO timestamp
  gpc: boolean;
}
