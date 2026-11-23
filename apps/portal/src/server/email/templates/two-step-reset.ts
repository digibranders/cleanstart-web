import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface TwoStepResetNoticeInput {
  to: EmailAddress;
  name: string;
  companyName: string;
  /** Who at CleanStart did it. */
  resetBy: string;
  reason: string;
}

/** Sent to the person whose two-step sign-in was reset, so a reset they did not ask for does not go unseen. */
export function buildTwoStepResetNotice(input: TwoStepResetNoticeInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.name) },
    {
      type: 'paragraph',
      text: `${oneLine(input.resetBy)} at CleanStart turned off two-step sign-in for your Partner Portal login at ${oneLine(input.companyName)}, and signed you out everywhere. The reason given: ${oneLine(input.reason)}`,
    },
    {
      type: 'paragraph',
      text: 'Sign in with your password, then turn two-step sign-in back on under Account. If you did not ask for this, tell your partner manager.',
    },
  ];
  return {
    to: asList(input.to),
    subject: 'Two-step sign-in was reset on your CleanStart Partner Portal login',
    htmlContent: renderEmail({
      preheader: 'Sign in with your password and set two-step up again.',
      heading: 'Two-step sign-in reset',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
