export const GROUP = { name: 'partner_portal', label: 'Partner portal' } as const;

export interface PropertySpec {
  name: string;
  label: string;
  type: 'string' | 'date' | 'enumeration';
  fieldType: 'text' | 'textarea' | 'date' | 'select' | 'booleancheckbox';
  hasUniqueValue?: boolean;
  options?: ReadonlyArray<{ label: string; value: string }>;
}

const opt = (...labels: string[]): Array<{ label: string; value: string }> =>
  labels.map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, '_') }));

export const COMPANY_PROPERTIES: PropertySpec[] = [
  {
    name: 'cleanstart_partner',
    label: 'CleanStart partner',
    type: 'enumeration',
    fieldType: 'booleancheckbox',
    options: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  },
  {
    name: 'partner_category',
    label: 'Partner category',
    type: 'enumeration',
    fieldType: 'select',
    options: opt('Distributor', 'Channel partner', 'System integrator'),
  },
  { name: 'partner_portal_id', label: 'Partner portal id', type: 'string', fieldType: 'text', hasUniqueValue: true },
  { name: 'partner_manager', label: 'Partner manager', type: 'string', fieldType: 'text' },
];

export const DEAL_PROPERTIES: PropertySpec[] = [
  {
    name: 'portal_registration_id',
    label: 'Portal registration id',
    type: 'string',
    fieldType: 'text',
    hasUniqueValue: true,
  },
  { name: 'protection_end_date', label: 'Protection end date', type: 'date', fieldType: 'date' },
  {
    name: 'partner_product',
    label: 'Partner product',
    type: 'enumeration',
    fieldType: 'select',
    options: opt('CleanStart Images', 'Clean Libraries', 'CleanSight'),
  },
  {
    name: 'partner_region',
    label: 'Partner region',
    type: 'enumeration',
    fieldType: 'select',
    options: opt('India', 'Middle East'),
  },
  { name: 'partner_company_id', label: 'Partner company id', type: 'string', fieldType: 'text' },
];

const stage = (label: string, displayOrder: number, probability: string) => ({
  label,
  displayOrder,
  metadata: { probability },
});

export const PIPELINE_SPEC = {
  label: 'Partner deals',
  displayOrder: 5,
  stages: [
    stage('Accepted', 0, '0.1'),
    stage('Discovery', 1, '0.2'),
    stage('Technical evaluation', 2, '0.4'),
    stage('Proposal sent', 3, '0.6'),
    stage('Closed won', 4, '1.0'),
    stage('Closed lost', 5, '0.0'),
    stage('Registration expired', 6, '0.0'),
  ],
} as const;
