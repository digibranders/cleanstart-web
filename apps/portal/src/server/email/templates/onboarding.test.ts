import { describeTemplates, type TemplateCase } from './test-harness';
import {
  buildAccessRequest,
  buildAccessRequestDeclined,
  buildApplicationApproved,
  buildApplicationDeclined,
  buildApplicationReceived,
  buildApplicationStaffAlert,
  buildPasswordChanged,
  buildPasswordReset,
  buildTeamChangeNotice,
  buildTeamInvite,
} from './index';

const PERSON = { email: 'person@example.com', name: 'Person' };
const STAFF = [{ email: 'gaurav@cleanstart.example' }, { email: 'omar@cleanstart.example' }];

const CASES: TemplateCase[] = [
  {
    name: 'buildApplicationReceived',
    build: (f) =>
      buildApplicationReceived({
        to: PERSON,
        applicantName: f('applicantName', 'Rohit Desai'),
        company: f('company', 'Lattice Cloud Services'),
        reference: f('reference', 'APP-2611-0042'),
      }),
    subject: 'We received your partner application',
    contains: ['Application received', 'Hello Rohit Desai,', 'APP-2611-0042', 'Lattice Cloud Services', 'Quote the reference'],
    to: ['person@example.com'],
  },
  {
    name: 'buildApplicationStaffAlert',
    build: (f) =>
      buildApplicationStaffAlert({
        to: STAFF,
        reference: f('reference', 'APP-2611-0042'),
        company: f('company', 'Lattice Cloud Services'),
        domain: f('domain', 'lattice.example'),
        applicantName: f('applicantName', 'Rohit Desai'),
        applicantEmail: f('applicantEmail', 'rohit@lattice.example'),
        categoryLabel: f('categoryLabel', 'Channel partner'),
        regionLabel: f('regionLabel', 'India'),
        source: 'website',
        personalEmail: true,
        existingDomain: true,
        reason: f('reason', 'We resell to banks'),
        reviewUrl: 'https://partners.example.com/admin/partners',
      }),
    subject: 'New partner application: Lattice Cloud Services',
    contains: [
      'New partner application',
      'Website form',
      'personal email address',
      'already belongs to an existing partner',
      'We resell to banks',
      'href="https://partners.example.com/admin/partners"',
      'Review the application',
    ],
    to: ['gaurav@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildApplicationApproved',
    build: (f) =>
      buildApplicationApproved({
        to: PERSON,
        applicantName: f('applicantName', 'Rohit Desai'),
        company: f('company', 'Lattice Cloud Services'),
        inviteUrl: 'https://partners.example.com/accept-invite?token=abc',
        expiresOn: '2026-11-19',
        managerName: f('managerName', 'Gaurav Jadhav'),
      }),
    subject: 'Your CleanStart partner application is approved',
    contains: [
      'You are approved',
      'Lattice Cloud Services is now a CleanStart partner',
      'Your CleanStart partner manager is Gaurav Jadhav.',
      'href="https://partners.example.com/accept-invite?token=abc"',
      'expires on 19 Nov 2026',
    ],
    to: ['person@example.com'],
  },
  {
    name: 'buildApplicationDeclined',
    build: (f) =>
      buildApplicationDeclined({
        to: PERSON,
        applicantName: f('applicantName', 'Rohit Desai'),
        company: f('company', 'Lattice Cloud Services'),
        reason: f('reason', 'We do not cover your region yet'),
      }),
    subject: 'Your CleanStart partner application',
    contains: ['Application update', 'We do not cover your region yet', 'apply again'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamInvite (partner)',
    build: (f) =>
      buildTeamInvite({
        to: PERSON,
        inviteeName: f('inviteeName', 'Vikram Sethi'),
        inviterName: f('inviterName', 'Aditi Rao'),
        audience: 'partner',
        companyName: f('companyName', 'Kestrel Systems'),
        roleLabel: f('roleLabel', 'Sales'),
        inviteUrl: 'https://partners.example.com/accept-invite?token=abc',
        expiresOn: '2026-11-19',
      }),
    subject: 'Aditi Rao invited you to the CleanStart Partner Portal',
    contains: ['You are invited', 'Hello Vikram Sethi,', 'join Kestrel Systems', 'as Sales', 'Accept the invite', 'expires on 19 Nov 2026'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamInvite (staff)',
    build: (f) =>
      buildTeamInvite({
        to: PERSON,
        inviteeName: null,
        inviterName: f('inviterName', 'Gaurav Jadhav'),
        audience: 'staff',
        companyName: null,
        roleLabel: f('roleLabel', 'Marketing'),
        inviteUrl: 'https://partners.example.com/accept-invite?token=abc',
        expiresOn: '2026-11-19',
      }),
    subject: 'Gaurav Jadhav invited you to the CleanStart Partner Portal',
    contains: ['Hello,', 'as Marketing', 'You will use it to work with CleanStart'],
    to: ['person@example.com'],
  },
  {
    name: 'buildAccessRequest',
    build: (f) =>
      buildAccessRequest({
        to: [{ email: 'aditi@kestrel.example' }],
        requesterName: f('requesterName', 'Rohit Desai'),
        requesterEmail: f('requesterEmail', 'rohit@kestrel.example'),
        note: f('note', 'I joined the sales team in October'),
        companyName: f('companyName', 'Kestrel Systems'),
        reviewUrl: 'https://partners.example.com/partner/team',
      }),
    subject: 'Rohit Desai asked for access to the CleanStart Partner Portal',
    contains: ['Access request', 'rohit@kestrel.example', 'I joined the sales team in October', 'Review the request'],
    to: ['aditi@kestrel.example'],
  },
  {
    name: 'buildAccessRequestDeclined',
    build: (f) =>
      buildAccessRequestDeclined({
        to: PERSON,
        requesterName: f('requesterName', 'Rohit Desai'),
        companyName: f('companyName', 'Kestrel Systems'),
      }),
    subject: 'Your CleanStart Partner Portal access request',
    contains: ['Access request declined', 'The partner admin at Kestrel Systems did not approve'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamChangeNotice (joined)',
    build: (f) =>
      buildTeamChangeNotice({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        kind: 'joined',
        personName: f('personName', 'Vikram Sethi'),
        companyName: f('companyName', 'Kestrel Systems'),
      }),
    subject: 'Vikram Sethi joined Kestrel Systems on the Partner Portal',
    contains: ['New team member', 'accepted the invite'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamChangeNotice (removed)',
    build: (f) =>
      buildTeamChangeNotice({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        kind: 'removed',
        personName: f('personName', 'Vikram Sethi'),
        companyName: f('companyName', 'Kestrel Systems'),
      }),
    subject: 'Vikram Sethi was removed from Kestrel Systems on the Partner Portal',
    contains: ['Team member removed', 'Their registrations stay with the company.'],
    to: ['person@example.com'],
  },
  {
    name: 'buildPasswordChanged',
    build: (f) => buildPasswordChanged({ to: PERSON, name: f('name', 'Aditi Rao'), changedAt: '2026-11-12T14:02:00.000Z' }),
    subject: 'Your CleanStart Partner Portal password was changed',
    contains: ['Password changed', 'was changed on 12 Nov 2026, 14:02 UTC', 'Forgot password'],
    to: ['person@example.com'],
  },
  {
    name: 'buildPasswordReset',
    build: (f) =>
      buildPasswordReset({
        to: PERSON,
        name: f('name', 'Aditi Rao'),
        resetUrl: 'https://partners.example.com/reset-password?token=abc',
        expiresInMinutes: 60,
      }),
    subject: 'Reset your CleanStart Partner Portal password',
    contains: ['Reset your password', 'href="https://partners.example.com/reset-password?token=abc"', 'expires in 60 minutes', 'Set a new password'],
    to: ['person@example.com'],
  },
];

describeTemplates(CASES);
