import type { DealRegistrationSubmission } from './schema';

export const buildDealName = (sub: DealRegistrationSubmission): string =>
  `${sub.prospect.firstName} ${sub.prospect.lastName} — ${sub.partnerName}`;

export const buildDealProperties = (
  sub: DealRegistrationSubmission,
  cfg: { pipeline: string; stage: string },
): Record<string, string> => {
  const props: Record<string, string> = {
    dealname: buildDealName(sub),
    pipeline: cfg.pipeline,
    dealstage: cfg.stage,
    partner_name: sub.partnerName,
    partner_rep_name: `${sub.partnerRep.firstName} ${sub.partnerRep.lastName}`,
    partner_rep_email: sub.partnerRep.email,
  };
  if (sub.dealDetails && sub.dealDetails.trim().length > 0) {
    props.deal_details = sub.dealDetails.trim();
  }
  return props;
};
