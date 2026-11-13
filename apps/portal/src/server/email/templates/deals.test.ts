import { describeTemplates, type TemplateCase } from './test-harness';
import {
  buildDealAccepted,
  buildDealMessage,
  buildDealRejected,
  buildDealStageChanged,
  buildDealSubmittedStaffAlert,
  buildDocumentMaterialRequest,
  buildExtensionDecision,
  buildExtensionRequested,
  buildManagerMessage,
  buildNewDocumentNotice,
  buildProtectionExpiryReminder,
} from './index';

const PERSON = { email: 'person@example.com', name: 'Person' };
const STAFF = [{ email: 'farhan@cleanstart.example' }, { email: 'omar@cleanstart.example' }];

const CASES: TemplateCase[] = [
  {
    name: 'buildDealAccepted',
    build: (f) =>
      buildDealAccepted({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Vardhan Capital'),
        productLabel: f('productLabel', 'CleanSight'),
        partnerName: f('partnerName', 'Kestrel Systems'),
        protectionEnd: '2027-02-02',
        dealUrl: 'https://partners.example.com/partner/deals/1',
      }),
    subject: 'Vardhan Capital was accepted',
    contains: ['Deal registration accepted', 'Protected until', '2 Feb 2027', 'Kestrel Systems', 'Open the deal'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDealRejected',
    build: (f) =>
      buildDealRejected({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Saffron Retail Group'),
        productLabel: f('productLabel', 'CleanStart Images'),
        reason: f('reason', 'Another partner holds this customer'),
        dealUrl: 'https://partners.example.com/partner/deals/2',
      }),
    subject: 'Saffron Retail Group was not accepted',
    contains: ['Deal registration not accepted', 'Another partner holds this customer', 'resubmit the registration'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDealSubmittedStaffAlert (new)',
    build: (f) =>
      buildDealSubmittedStaffAlert({
        to: STAFF,
        partnerName: f('partnerName', 'Kestrel Systems'),
        customer: f('customer', 'Gulfway Freight'),
        productLabel: f('productLabel', 'CleanStart Images'),
        regionLabel: f('regionLabel', 'Middle East'),
        registeredByName: f('registeredByName', 'Aditi Rao'),
        resubmitted: false,
        approvalsUrl: 'https://partners.example.com/admin/approvals',
      }),
    subject: 'New registration: Gulfway Freight from Kestrel Systems',
    contains: ['New deal registration', 'Aditi Rao at Kestrel Systems registered a deal', 'Middle East', 'Open the approvals queue'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildDealSubmittedStaffAlert (resubmitted)',
    build: (f) =>
      buildDealSubmittedStaffAlert({
        to: STAFF,
        partnerName: f('partnerName', 'Kestrel Systems'),
        customer: f('customer', 'Gulfway Freight'),
        productLabel: f('productLabel', 'CleanStart Images'),
        regionLabel: f('regionLabel', 'Middle East'),
        registeredByName: f('registeredByName', 'Aditi Rao'),
        resubmitted: true,
        approvalsUrl: 'https://partners.example.com/admin/approvals',
      }),
    subject: 'Resubmitted: Gulfway Freight from Kestrel Systems',
    contains: ['Registration resubmitted', 'resubmitted a deal'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildDealMessage',
    build: (f) =>
      buildDealMessage({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        authorName: f('authorName', 'Farhan Qureshi'),
        authorOrg: f('authorOrg', 'CleanStart'),
        customer: f('customer', 'Tejas Health Network'),
        excerpt: f('excerpt', 'Can you confirm the contact at the hospital group?'),
        dealUrl: 'https://partners.example.com/partner/deals/3',
      }),
    subject: 'New message about Tejas Health Network',
    contains: ['New message on a deal', 'Farhan Qureshi (CleanStart) wrote on the Tejas Health Network deal', 'Can you confirm the contact', 'Open the conversation'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDealStageChanged',
    build: (f) =>
      buildDealStageChanged({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Vardhan Capital'),
        productLabel: f('productLabel', 'CleanSight'),
        stage: f('stage', 'Proposal sent'),
        dealUrl: 'https://partners.example.com/partner/deals/1',
      }),
    subject: 'Vardhan Capital moved to Proposal sent',
    contains: ['Deal stage update', 'is now at Proposal sent', 'The stage comes from CleanStart'],
    to: ['person@example.com'],
  },
  {
    name: 'buildExtensionRequested',
    build: (f) =>
      buildExtensionRequested({
        to: STAFF,
        partnerName: f('partnerName', 'Kestrel Systems'),
        customer: f('customer', 'Al Noor Logistics'),
        productLabel: f('productLabel', 'Clean Libraries'),
        reason: f('reason', 'The customer moved the pilot to January'),
        approvalsUrl: 'https://partners.example.com/admin/approvals',
      }),
    subject: 'Extension requested: Al Noor Logistics from Kestrel Systems',
    contains: ['Protection extension requested', 'The customer moved the pilot to January', 'Review the request'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildExtensionDecision (granted)',
    build: (f) =>
      buildExtensionDecision({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Al Noor Logistics'),
        productLabel: f('productLabel', 'Clean Libraries'),
        granted: true,
        newEnd: '2027-03-04',
        note: f('note', 'One extension only'),
        dealUrl: 'https://partners.example.com/partner/deals/4',
      }),
    subject: 'Protection extended for Al Noor Logistics',
    contains: ['Extension granted', 'New protection end', '4 Mar 2027', 'One extension only'],
    to: ['person@example.com'],
  },
  {
    name: 'buildExtensionDecision (declined)',
    build: (f) =>
      buildExtensionDecision({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Al Noor Logistics'),
        productLabel: f('productLabel', 'Clean Libraries'),
        granted: false,
        newEnd: null,
        note: f('note', 'The deal has not moved'),
        dealUrl: 'https://partners.example.com/partner/deals/4',
      }),
    subject: 'Extension not granted for Al Noor Logistics',
    contains: ['Extension declined', 'Protection ends on the original date.', 'The deal has not moved'],
    to: ['person@example.com'],
  },
  {
    name: 'buildProtectionExpiryReminder',
    build: (f) =>
      buildProtectionExpiryReminder({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Indus Paytech'),
        productLabel: f('productLabel', 'CleanStart Images'),
        daysLeft: 14,
        protectionEnd: '2026-11-26',
        dealUrl: 'https://partners.example.com/partner/deals/5',
      }),
    subject: 'Indus Paytech: protection ends in 14 days',
    contains: ['Protection ending soon', 'ends on 26 Nov 2026, in 14 days', 'request an extension'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDocumentMaterialRequest',
    build: (f) =>
      buildDocumentMaterialRequest({
        to: STAFF,
        replyTo: { email: 'aditi@kestrel.example', name: 'Aditi Rao' },
        partnerName: f('partnerName', 'Kestrel Systems'),
        requesterName: f('requesterName', 'Aditi Rao'),
        request: f('request', 'A one page comparison with the incumbent scanner'),
        productLabel: f('productLabel', 'CleanSight'),
      }),
    subject: 'Material request from Kestrel Systems',
    contains: ['Material request', 'A one page comparison with the incumbent scanner', 'Reply to this email to answer Aditi Rao directly.'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
    replyTo: 'aditi@kestrel.example',
  },
  {
    name: 'buildNewDocumentNotice',
    build: (f) =>
      buildNewDocumentNotice({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        title: f('title', 'CleanSight product walkthrough'),
        typeLabel: f('typeLabel', 'Video'),
        productLabel: f('productLabel', 'CleanSight'),
        libraryUrl: 'https://partners.example.com/partner/documents',
      }),
    subject: 'New in the document library: CleanSight product walkthrough',
    contains: ['New document', 'Video', 'Open the library'],
    to: ['person@example.com'],
  },
  {
    name: 'buildManagerMessage',
    build: (f) =>
      buildManagerMessage({
        to: { email: 'farhan@cleanstart.example', name: 'Farhan Qureshi' },
        replyTo: { email: 'aditi@kestrel.example', name: 'Aditi Rao' },
        managerName: f('managerName', 'Farhan Qureshi'),
        senderName: f('senderName', 'Aditi Rao'),
        partnerName: f('partnerName', 'Kestrel Systems'),
        subject: f('subject', 'Question about the portal'),
        body: f('body', 'How do I add a second contact to a deal?'),
      }),
    subject: 'Kestrel Systems: Question about the portal',
    contains: ['Message from Aditi Rao', 'How do I add a second contact to a deal?', 'Reply to this email to answer Aditi Rao.'],
    to: ['farhan@cleanstart.example'],
    replyTo: 'aditi@kestrel.example',
  },
];

describeTemplates(CASES);
