/** What acceptInviteAction tells the form. redirectTo is where to go next; signedIn false means sign in first. */
export interface AcceptInviteOutcome {
  signedIn: boolean;
  redirectTo: string;
}

/** 20 invite lookups or accepts per IP in 10 minutes. */
export const INVITE_IP_RULE = { limit: 20, windowSeconds: 600 } as const;
