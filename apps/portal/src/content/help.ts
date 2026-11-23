// help.ts. The Help center articles, as typed data. Plain paragraphs, steps and lists; no markup.
// Keep copy to what the portal does today, with no dashes as punctuation and no CRM product names.
import {
  BULK_DECIDE_MAX,
  EXPIRY_REMINDER_DAYS,
  EXTENSION_DAYS,
  MAX_EXTENSIONS,
  PROTECTION_DAYS,
  REVIEW_SLA_BUSINESS_DAYS,
  UNDO_WINDOW_MINUTES,
} from '@/lib/deal-rules';
import type { HelpArticle } from '@/lib/help';
import { PASSWORD_MIN_LENGTH } from '@/lib/password-rules';

export const HELP_ARTICLES: readonly HelpArticle[] = [
  /* ------------------------------------------------------------ partner */
  {
    slug: 'what-the-portal-is-for',
    title: 'What the partner portal is for',
    topic: 'getting-started',
    audience: 'partner',
    summary: 'Register deals, follow them to a decision, find sales material and manage your team.',
    body: [
      { type: 'p', text: 'The partner portal is where your company works with CleanStart. You register a deal here so CleanStart can protect it, follow it until CleanStart decides, and open the documents CleanStart shares with partners.' },
      { type: 'p', text: 'The sidebar shows only the pages your role can open. A partner admin sees Overview, Deals, Register deal, Documents, Program, Team, Company and Help. Sales users do not see Team. Technical users see Documents, Program, Company and Help.' },
      { type: 'p', text: 'The Program page sets out how protection and registration work. The articles in this Help center go step by step.' },
    ],
  },
  {
    slug: 'partner-roles',
    title: 'Roles in your company',
    topic: 'getting-started',
    audience: 'partner',
    summary: 'What a partner admin, a sales user and a technical user can do.',
    body: [
      { type: 'list', items: [
        'Partner admin: manages the team, the company profile and every deal of the company.',
        'Sales: registers deals and tracks the deals they registered, and uses documents.',
        'Technical: uses documents and sees the company profile.',
      ] },
      { type: 'p', text: 'The table called What each role can do on the Team page shows the same thing in full. Only a partner admin can change a role.' },
    ],
  },
  {
    slug: 'register-a-deal',
    title: 'Register a deal',
    topic: 'registering-deals',
    audience: 'partner',
    summary: 'Tell CleanStart about a customer opportunity so it can be protected.',
    body: [
      { type: 'steps', items: [
        'Open Register deal in the sidebar.',
        'Fill in who the registration is for, and the company and the people CleanStart can reach there.',
        'Say what the customer is buying and when. Each registration covers one product, so register a second product separately.',
        'Add anything the reviewer should know, tick the box that confirms the information is accurate, and submit.',
      ] },
      { type: 'p', text: 'CleanStart reviews the registration and you get a notification with the decision. Follow it on the Deals page.' },
    ],
  },
  {
    slug: 'deal-protection',
    title: 'How deal protection works',
    topic: 'registering-deals',
    audience: 'partner',
    summary: `A deal that CleanStart accepts is protected for ${PROTECTION_DAYS} days.`,
    body: [
      { type: 'list', items: [
        `Protection runs ${PROTECTION_DAYS} days from the day CleanStart accepts the deal.`,
        `CleanStart reviews each registration within ${REVIEW_SLA_BUSINESS_DAYS} business days, Monday to Friday.`,
        `You can extend protection ${MAX_EXTENSIONS === 1 ? 'once' : `${MAX_EXTENSIONS} times`}, by ${EXTENSION_DAYS} days.`,
        `You get reminder emails ${EXPIRY_REMINDER_DAYS.join(' and ')} days before protection ends, if your notification settings allow them.`,
      ] },
    ],
  },
  {
    slug: 'edit-withdraw-or-resubmit',
    title: 'Edit, withdraw or resubmit a registration',
    topic: 'registering-deals',
    audience: 'partner',
    summary: 'What you can change while a registration waits, and what to do if it is not accepted.',
    body: [
      { type: 'p', text: 'While a registration is waiting for CleanStart, open it from Deals and choose Edit registration to change it, or Withdraw registration to take it back. A withdrawn customer can be registered again later.' },
      { type: 'p', text: 'If CleanStart does not accept a registration, the deal page shows the reason. Choose Fix and resubmit to correct it and send it again, or Register again to start a new one.' },
      { type: 'p', text: 'An accepted registration is changed by your partner manager. Use Message about this deal on the deal page to ask.' },
    ],
  },
  {
    slug: 'request-an-extension',
    title: 'Ask for more protection time',
    topic: 'registering-deals',
    audience: 'partner',
    summary: `One extension of ${EXTENSION_DAYS} days is available on an accepted deal.`,
    body: [
      { type: 'steps', items: [
        'Open the accepted deal from Deals.',
        'Choose Request extension.',
        'Tell CleanStart why you need more time, then choose Send request.',
      ] },
      { type: 'p', text: 'Your partner manager decides and replies by email. The deal page shows that a request is waiting.' },
    ],
  },
  {
    slug: 'find-documents',
    title: 'Find and open documents',
    topic: 'documents',
    audience: 'partner',
    summary: 'Guides and sales material for partners, with search and a product filter.',
    body: [
      { type: 'p', text: 'Open Documents in the sidebar. Search by name or filter by product to narrow the list.' },
      { type: 'p', text: 'Most documents are private to signed in partners. Share the portal with colleagues, not the file. Public datasheets are marked as open on cleanstart.com and need no sign in.' },
    ],
  },
  {
    slug: 'request-material',
    title: 'Ask CleanStart for material you cannot find',
    topic: 'documents',
    audience: 'partner',
    summary: 'Use Request material on the Documents page.',
    body: [
      { type: 'steps', items: [
        'Open Documents.',
        'Choose Request material.',
        'Describe what you need. CleanStart sees the request in its own Documents page.',
      ] },
    ],
  },
  {
    slug: 'invite-and-manage-people',
    title: 'Invite people and manage access',
    topic: 'team-access',
    audience: 'partner',
    summary: 'For partner admins: add colleagues, change roles and remove access.',
    body: [
      { type: 'p', text: 'Only a partner admin sees the Team page. Use it to invite colleagues, resend or cancel an invite, change a role and remove access.' },
      { type: 'p', text: 'When you remove someone, their deals can move to a colleague. Only who owns the deals changes; their status stays as it is. Removed people are listed on the Team page, and you can reactivate them.' },
      { type: 'p', text: 'Requests for access from your colleagues appear on the Team page for you to approve or decline.' },
    ],
  },
  {
    slug: 'company-profile',
    title: 'Your company profile and agreement',
    topic: 'team-access',
    audience: 'partner',
    summary: 'Keep company details current and download the partner agreement.',
    body: [
      { type: 'p', text: 'The Company page shows your company details, what you sell, your partner category and the partner manager assigned to you. A partner admin can edit the details. The company name and the category are set by CleanStart; ask your partner manager to change them.' },
      { type: 'p', text: 'The same page holds the partner agreement. You can download it as a PDF. When CleanStart publishes a new version, you are asked to accept it there.' },
    ],
  },
  {
    slug: 'email-notifications',
    title: 'Choose which emails you get',
    topic: 'account-security',
    audience: 'partner',
    summary: 'Five switches on your account page.',
    body: [
      { type: 'p', text: 'Open your account from the profile menu. Under Email notifications you can turn each kind of email on or off: decisions, stage changes, expiry reminders, new documents and team changes. The settings save as you change them and only you can see them.' },
      { type: 'p', text: 'Emails about your own deals go to you. Partner admins also get team changes.' },
    ],
  },

  /* ------------------------------------------------------------ staff */
  {
    slug: 'staff-what-you-can-do',
    title: 'What you see in the admin portal',
    topic: 'getting-started',
    audience: 'staff',
    summary: 'The pages each CleanStart role can open.',
    body: [
      { type: 'list', items: [
        'Partner manager: every page, including Partners, Reports, Team and the Audit log.',
        'Sales: Overview, Deals, Partners and Reports, for deals in their own region.',
        'Marketing: Overview and Documents.',
      ] },
      { type: 'p', text: 'The sidebar only lists pages your role can open. If you follow a link to a page you cannot open, the portal sends you back to your Overview.' },
    ],
  },
  {
    slug: 'review-registrations',
    title: 'Review and decide registrations',
    topic: 'registering-deals',
    audience: 'staff',
    summary: 'Accept or reject from the Deals queue, one at a time or in bulk.',
    body: [
      { type: 'steps', items: [
        'Open Deals. The queue shows what is waiting, the oldest first, and flags a registration with a conflict.',
        'Open a registration to read the customer, the product, the partner notes and the conversation.',
        'Accept it, or reject it with a reason. The partner sees the reason in the email and on the deal.',
      ] },
      { type: 'p', text: `Accepting starts ${PROTECTION_DAYS} days of protection and emails the partner. A decision can be undone from the queue for ${UNDO_WINDOW_MINUTES} minutes.` },
      { type: 'p', text: `You can select up to ${BULK_DECIDE_MAX} registrations and accept or reject them together. A rejection needs a reason that every selected partner will see. Reviews are due within ${REVIEW_SLA_BUSINESS_DAYS} business days.` },
    ],
  },
  {
    slug: 'decide-extensions',
    title: 'Decide extension requests',
    topic: 'registering-deals',
    audience: 'staff',
    summary: 'Partners can ask once for more protection time.',
    body: [
      { type: 'p', text: `Extension requests are listed on Deals. Open the deal, read the partner's reason and decide. A granted extension adds ${EXTENSION_DAYS} days, and the partner is told by email.` },
    ],
  },
  {
    slug: 'register-for-a-partner',
    title: 'Register a deal on behalf of a partner',
    topic: 'registering-deals',
    audience: 'staff',
    summary: 'For partner managers, from the Deals page.',
    body: [
      { type: 'steps', items: [
        'Open Deals and choose Register deal for a partner.',
        'Pick the partner and fill in the same details a partner would.',
        'Submit. The registration joins the queue like any other.',
      ] },
    ],
  },
  {
    slug: 'manage-documents',
    title: 'Upload and manage documents',
    topic: 'documents',
    audience: 'staff',
    summary: 'For partner managers and marketing.',
    body: [
      { type: 'p', text: 'Open Documents and choose Upload document. Set who can open it, then save. The library shows when each document was last updated, when it expires and how often partners opened it.' },
      { type: 'p', text: 'The Requests list shows material that partners asked for with Request material.' },
    ],
  },
  {
    slug: 'manage-teammates',
    title: 'Invite teammates and set roles',
    topic: 'team-access',
    audience: 'staff',
    summary: 'For partner managers: who can use the admin portal.',
    body: [
      { type: 'steps', items: [
        'Open Team and choose Invite teammate.',
        'Pick a role: Partner manager, Sales or Marketing. Sales also has a region, or all regions.',
        'To end someone\'s access, choose Remove access from the Actions menu.',
      ] },
      { type: 'p', text: 'Partner accounts never reach this admin portal. What each role can do is in the table on the Team page. Partner managers add, rename, reorder and turn off regions on the Regions page. A region that is turned off stays on the partners and deals that already have it.' },
    ],
  },
  {
    slug: 'read-reports',
    title: 'Read the reports',
    topic: 'reports',
    audience: 'staff',
    summary: 'Registered, accepted, accept rate and pipeline by partner, for a date range.',
    body: [
      { type: 'p', text: 'Open Reports. Pick a preset range or a custom one. The figures cover deals registered, deals accepted, the accept rate and the pipeline by partner. Filters narrow the report by partner category and partner.' },
      { type: 'p', text: 'Choose Export CSV to download the figures that are on screen. Partner managers and sales staff can open Reports; sales staff see deals in their own region.' },
    ],
  },
  {
    slug: 'use-the-audit-log',
    title: 'Use the Audit log',
    topic: 'reports',
    audience: 'staff',
    summary: 'Filter events, export them and retry failed syncs. Partner managers only.',
    body: [
      { type: 'p', text: 'The Audit log lists every approval, upload and access change, newest first. Narrow it by period (last 24 hours, 7, 30 or 90 days, or a custom range of days), by type of event, by who did it, by partner, or with the search box. Choose Export CSV to download the events that match.' },
      { type: 'p', text: 'Above the log, the sync queue shows how many updates are waiting to be sent to CleanStart\'s sales system and when it was last checked. The Failed syncs list shows each update that could not be sent, how often it was tried and the last error. Choose Retry to queue one again; the retry is recorded in the log.' },
    ],
  },

  /* ------------------------------------------------------------ both */
  {
    slug: 'your-account',
    title: 'Your account and profile',
    topic: 'account-security',
    audience: 'both',
    summary: 'Change your name and job title, and see your sign in email.',
    body: [
      { type: 'p', text: 'Open your account from the profile menu in the top right. Under Profile you can change your full name and job title. Your work email is your sign in, so it cannot be edited there.' },
    ],
  },
  {
    slug: 'password-and-two-step',
    title: 'Password, two step sign in and sessions',
    topic: 'account-security',
    audience: 'both',
    summary: 'Keep your sign in safe.',
    body: [
      { type: 'list', items: [
        `A password needs at least ${PASSWORD_MIN_LENGTH} characters, with a letter, a number and a special character.`,
        'Two step sign in uses an authenticator app, such as Google Authenticator or Microsoft Authenticator. Turn it on from your account page and keep your backup codes somewhere safe.',
        'The Sessions card on your account page lists where you are signed in. Choose Sign out all other devices if you do not recognise one.',
      ] },
      { type: 'p', text: 'If you cannot sign in, use Forgot password on the sign in page.' },
    ],
  },
];
