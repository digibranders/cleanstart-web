import { type EmailBlock, renderEmail } from '../email/layout';

export type DealRegistrationNotificationInput = {
  partnerName: string;
  partnerRep: { firstName: string; lastName: string; email: string; phone?: string | undefined };
  prospect: { firstName: string; lastName: string; email: string; phone?: string | undefined };
  dealDetails?: string | undefined;
  /** HubSpot deal id when the CRM sync succeeded. Renders a link to the record. */
  dealId?: string | undefined;
  /** HubSpot portal id, used only to build the deal link. */
  portalId?: string | undefined;
};

/** The deal name mirrors `buildDealName` (`{prospect} — {partner}`). */
const dealNameOf = (input: DealRegistrationNotificationInput): string =>
  `${`${input.prospect.firstName} ${input.prospect.lastName}`.trim()} — ${input.partnerName}`;

/** Internal notification for a new partner deal registration. */
export const buildDealRegistrationNotificationEmail = (
  input: DealRegistrationNotificationInput,
): { subject: string; htmlContent: string } => {
  const prospectFull = `${input.prospect.firstName} ${input.prospect.lastName}`.trim();
  const repFull = `${input.partnerRep.firstName} ${input.partnerRep.lastName}`.trim();
  const dealName = dealNameOf(input);

  const dealLink =
    input.dealId && input.portalId
      ? `https://app.hubspot.com/contacts/${encodeURIComponent(input.portalId)}/record/0-3/${encodeURIComponent(input.dealId)}`
      : undefined;

  const blocks: EmailBlock[] = [
    {
      kind: 'paragraph',
      text: `A partner registered a deal through the CleanStart website${dealLink ? ' and it was created as a deal in HubSpot' : ''}. Review the details and assign an owner to follow up.`,
    },
    {
      kind: 'details',
      rows: [
        ['Deal', dealName],
        ['Partner', input.partnerName],
        ['Partner rep', repFull],
        ['Rep email', input.partnerRep.email],
        ['Rep phone', input.partnerRep.phone],
        ['Prospect', prospectFull],
        ['Prospect email', input.prospect.email],
        ['Prospect phone', input.prospect.phone],
      ],
    },
    ...(input.dealDetails?.trim()
      ? [{ kind: 'quote' as const, label: 'Deal details', text: input.dealDetails }]
      : []),
    ...(dealLink
      ? [{ kind: 'button' as const, label: 'Open the deal in HubSpot', url: dealLink }]
      : []),
  ];

  return {
    subject: `New partner deal registration: ${dealName}`,
    htmlContent: renderEmail({
      preheader: `${repFull} at ${input.partnerName} registered ${prospectFull}.`,
      eyebrow: 'Deal registration',
      heading: 'New partner deal registration',
      blocks,
      footerNote: 'Sent automatically from the CleanStart website deal-registration form.',
    }),
  };
};

/** Confirmation to the partner rep who submitted the registration. */
export const buildDealRegistrationConfirmationEmail = (
  input: DealRegistrationNotificationInput,
): { subject: string; htmlContent: string } => {
  const dealName = dealNameOf(input);
  return {
    subject: 'We have your deal registration',
    htmlContent: renderEmail({
      preheader: `Your registration for ${dealName} was received.`,
      eyebrow: 'Deal registration',
      heading: `Thanks, ${input.partnerRep.firstName}`,
      blocks: [
        {
          kind: 'paragraph',
          text: `We've received your deal registration for ${dealName}. Our partner team will review it and confirm next steps within one business day.`,
        },
        {
          kind: 'details',
          rows: [
            ['Deal', dealName],
            ['Partner', input.partnerName],
            ['Prospect', `${input.prospect.firstName} ${input.prospect.lastName}`.trim()],
          ],
        },
        {
          kind: 'paragraph',
          text: 'If any of this looks wrong, reply to this email and we will correct it.',
          muted: true,
        },
      ],
      footerNote:
        'You received this because you submitted a deal registration on cleanstart.com.',
    }),
  };
};
