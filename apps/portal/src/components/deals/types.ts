import type { CustomerSuggestionDto } from "@/lib/dto";

/** The deal's partner manager as the message drawers need it. */
export interface ManagerContact {
  name: string;
  team: string;
}

/** A company HubSpot knows. Never carries deals, owners or another partner's data. */
export interface CrmSuggestion {
  name: string;
  website: string | null;
}

export interface CustomerLookupResult {
  own: CustomerSuggestionDto[];
  crm: CrmSuggestion[];
}

/** Staff only: another partner holds an open HubSpot deal for the customer. */
export interface HubspotHintDto {
  registrationId: string;
  holder: string | null;
  openDeals: number;
}
