import { REVIEW_SLA_BUSINESS_DAYS } from './deal-rules';
import type { ApplicationStatus } from './domain';

/** What the public status page may know. No email, no phone, no reviewer notes. */
export type ApplicationStatusDto =
  | { state: 'unknown' | 'expired' }
  | {
      state: 'ok';
      reference: string;
      company: string;
      /** yyyy-mm-dd, UTC. */
      submittedOn: string;
      status: ApplicationStatus;
      /** Typed by the reviewer for the applicant, so it is safe to show. */
      declineReason: string | null;
      /** True once the applicant accepted the invite and the account exists. */
      accountActive: boolean;
    };

export type StatusStepState = 'done' | 'now' | 'next' | 'stopped';
export interface StatusStep {
  key: 'received' | 'review' | 'decision' | 'invite' | 'active';
  title: string;
  text: string;
  state: StatusStepState;
}

/** One sentence, shared by the receipt page and the status page. */
export const REVIEW_TARGET_TEXT = `Expect a decision within ${REVIEW_SLA_BUSINESS_DAYS} business days.`;

type OkStatus = Extract<ApplicationStatusDto, { state: 'ok' }>;

/** The five steps with the current one marked 'now'. A declined application stops at Decision; the later steps are left out. */
export function statusSteps(s: Pick<OkStatus, 'status' | 'accountActive' | 'declineReason'>): StatusStep[] {
  const open = s.status === 'new' || s.status === 'info_requested';
  const declined = s.status === 'declined';
  const steps: StatusStep[] = [
    { key: 'received', title: 'Received', text: 'Your application is in.', state: 'done' },
    {
      key: 'review',
      title: 'Under review',
      text:
        s.status === 'info_requested'
          ? 'The partner team asked you a question. Use the link in their email to answer it.'
          : `A partner manager checks your company and may call you. ${REVIEW_TARGET_TEXT}`,
      state: open ? 'now' : 'done',
    },
    {
      key: 'decision',
      title: 'Decision',
      text: declined
        ? s.declineReason
          ? `Not approved. ${s.declineReason}`
          : 'Not approved this time.'
        : s.status === 'approved'
          ? 'Approved.'
          : 'You get the decision by email.',
      state: open ? 'next' : declined ? 'stopped' : 'done',
    },
  ];
  if (declined) return steps;
  steps.push(
    {
      key: 'invite',
      title: 'Invite sent',
      text: 'The invite to set your password and accept the agreement.',
      state: s.status === 'approved' ? 'done' : 'next',
    },
    {
      key: 'active',
      title: 'Account active',
      text: 'Sign in, invite your team and register deals.',
      state: s.accountActive ? 'done' : s.status === 'approved' ? 'now' : 'next',
    },
  );
  return steps;
}
