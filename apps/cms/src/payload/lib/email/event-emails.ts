import { renderEmail } from './layout';

/**
 * Internal alert to the events team when someone registers for an event on
 * events.cleanstart.com. The rows come from the event's own form, in its order,
 * so an event with different questions produces a matching email with no code.
 */

export type EventRegistrationAlertInput = {
  eventTitle: string;
  /** Who registered, for the subject and first line. Falls back to "Someone". */
  registrant?: string | undefined;
  /** Company or role, appended to the first line when known. */
  affiliation?: string | undefined;
  /** One row per answered question: the form's label and what they entered. */
  rows: ReadonlyArray<readonly [string, string | undefined]>;
  /** Display string for when the registration came in. */
  submittedAt: string;
  /** Registrations for this event so far, including this one. */
  total?: number | undefined;
  /** Link to the event's registrations in the CMS. */
  cmsUrl?: string | undefined;
  /** The event's co-branding strip (CleanStart and its partners), shown under the title. */
  bannerUrl?: string | undefined;
  /** Everyone on the banner, for its alt text when images are blocked. */
  hostNames?: readonly string[] | undefined;
};

export const buildEventRegistrationAlertEmail = (
  input: EventRegistrationAlertInput,
): { subject: string; htmlContent: string } => {
  const who = input.registrant?.trim() || 'Someone';
  const line = input.affiliation?.trim() ? `${who} (${input.affiliation.trim()})` : who;
  return {
    subject: `New registration: ${who} for ${input.eventTitle}`,
    htmlContent: renderEmail({
      preheader: `${line} registered for ${input.eventTitle}.`,
      eyebrow: 'New registration',
      // The event name is the heading, so it is the first thing read.
      heading: input.eventTitle,
      blocks: [
        ...(input.bannerUrl
          ? [
              {
                kind: 'image' as const,
                src: input.bannerUrl,
                alt: input.hostNames?.length ? `Hosted by ${input.hostNames.join(', ')}` : input.eventTitle,
              },
            ]
          : []),
        { kind: 'paragraph', text: `${line} just registered.` },
        { kind: 'details', rows: [...input.rows, ['Registered', input.submittedAt]] },
        ...(input.total != null
          ? [
              {
                kind: 'note' as const,
                text:
                  input.total === 1
                    ? 'This is the first registration for this event.'
                    : `This is registration number ${input.total} for this event.`,
              },
            ]
          : []),
        ...(input.cmsUrl
          ? [{ kind: 'button' as const, label: 'View all registrations', url: input.cmsUrl }]
          : []),
      ],
      footerNote: 'Sent automatically when someone registers on events.cleanstart.com.',
    }),
  };
};
