import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugField } from '../fields/slug';
import { formSchemaVersionHook } from '../hooks/form-schema-version';
import { formsCoerceHook } from '../hooks/forms-coerce';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

const VISIBLE_LABEL_TYPES = ['text', 'email', 'textarea', 'select', 'checkbox', 'consent'];
const PLACEHOLDER_TYPES = ['text', 'email', 'textarea'];
const VALIDATION_TYPES = ['text', 'email', 'textarea'];

export const Forms: CollectionConfig = {
  slug: 'forms',
  labels: { singular: 'Form', plural: 'Forms' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'schemaVersion', 'updatedAt'],
    group: 'Marketing',
  },
  access: {
    // Forms contain field names, validation regex, consent text, and select
    // options — exposing them publicly would allow scraping of the schema.
    // The web app fetches form definitions server-side (authenticated) or via
    // a scoped endpoint that returns only the visitor-facing subset.
    read: isAdminOrEditor,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ source: 'name' }),
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Internal notes for editors. Not shown to visitors.',
      },
    },
    {
      name: 'fields',
      type: 'array',
      required: true,
      labels: { singular: 'Field', plural: 'Fields' },
      admin: {
        description:
          'Forms with more than 7 fields show measurably higher abandonment per Baymard — consider conditional logic or splitting into multiple steps.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { description: 'Machine name. Becomes the JSON key on the lead record.' },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
            { label: 'Checkbox', value: 'checkbox' },
            { label: 'Consent (GDPR checkbox)', value: 'consent' },
          ],
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            description: 'Visitor-facing label.',
            condition: (_data, sibling) =>
              VISIBLE_LABEL_TYPES.includes(sibling?.type ?? ''),
          },
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Consent fields are always required and cannot be unchecked here.',
          },
        },
        {
          name: 'placeholder',
          type: 'text',
          admin: {
            condition: (_data, sibling) => PLACEHOLDER_TYPES.includes(sibling?.type ?? ''),
          },
        },
        { name: 'helpText', type: 'text' },
        { name: 'defaultValue', type: 'text' },
        {
          name: 'options',
          type: 'array',
          labels: { singular: 'Option', plural: 'Options' },
          admin: {
            condition: (_data, sibling) => sibling?.type === 'select',
          },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        },
        {
          name: 'consentText',
          type: 'textarea',
          admin: {
            description:
              'Exact text the visitor sees + agrees to. Snapshotted onto every lead record at submit time for GDPR audit defensibility.',
            condition: (_data, sibling) => sibling?.type === 'consent',
          },
        },
        {
          type: 'group',
          name: 'validation',
          admin: {
            description: 'Server-enforced via Zod at submit time.',
            condition: (_data, sibling) => VALIDATION_TYPES.includes(sibling?.type ?? ''),
          },
          fields: [
            { name: 'minLength', type: 'number', min: 0 },
            { name: 'maxLength', type: 'number', min: 0 },
            {
              name: 'pattern',
              type: 'text',
              admin: { description: 'Regular expression source (no leading/trailing slashes).' },
            },
          ],
        },
        {
          type: 'group',
          name: 'conditions',
          admin: {
            description:
              'Show this field only when the rules below match. Reduces form abandonment by 8–15% per Baymard research.',
          },
          fields: [
            {
              name: 'mode',
              type: 'select',
              defaultValue: 'all',
              options: [
                { label: 'All rules must match', value: 'all' },
                { label: 'Any rule may match', value: 'any' },
              ],
            },
            {
              name: 'rules',
              type: 'array',
              labels: { singular: 'Rule', plural: 'Rules' },
              fields: [
                { name: 'fieldName', type: 'text', required: true },
                {
                  name: 'operator',
                  type: 'select',
                  required: true,
                  defaultValue: 'equals',
                  options: [
                    { label: 'Equals', value: 'equals' },
                    { label: 'Not equals', value: 'notEquals' },
                    { label: 'Contains', value: 'contains' },
                  ],
                },
                { name: 'value', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          name: 'errorMessage',
          type: 'text',
          admin: {
            description:
              'Override the default validation error. Defaults are inlined per validation type in the form renderer.',
          },
        },
      ],
    },
    {
      name: 'submitLabel',
      type: 'text',
      defaultValue: 'Submit',
    },
    {
      type: 'group',
      name: 'postSubmit',
      label: 'After submit',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'message',
          options: [
            { label: 'Show a thank-you message', value: 'message' },
            { label: 'Redirect to a URL', value: 'redirect' },
          ],
        },
        {
          name: 'body',
          type: 'richText',
          admin: {
            condition: (_data, sibling) => sibling?.kind === 'message',
          },
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            condition: (_data, sibling) => sibling?.kind === 'redirect',
          },
          hooks: { beforeValidate: [normalizeOptionalUrlHook] },
          validate: validateOptionalUrl,
        },
      ],
    },
    {
      name: 'crmHandlers',
      type: 'select',
      hasMany: true,
      defaultValue: [],
      options: [
        { label: 'HubSpot', value: 'hubspot' },
        { label: 'Salesforce', value: 'salesforce' },
      ],
      admin: {
        description:
          'CRM handlers fan out in parallel to the DB write. Handler config (API keys, list IDs) lives in env. Adapter implementations land in Phase E.',
      },
    },
    {
      name: 'notifyTo',
      type: 'array',
      labels: { singular: 'Recipient', plural: 'Notify recipients' },
      admin: {
        description: 'Email addresses that receive the new-lead notification.',
      },
      fields: [{ name: 'email', type: 'email', required: true }],
    },
    {
      name: 'schemaVersion',
      type: 'number',
      defaultValue: 1,
      access: {
        update: () => false,
      },
      admin: {
        description:
          'System-managed. Auto-increments when fields[] changes after the form has at least one submission.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'hubspotFormGuid',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'GUID of the matching HubSpot form in the "website" folder. Set this to relay submissions to HubSpot via the Forms API. Leave empty to skip HubSpot sync.',
      },
    },
    {
      name: 'hubspotSubscriptionTypeId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Optional. HubSpot subscription type internal id this form opts the contact into (marketing subscription opt-in). Set for the newsletter form; leave empty for forms that should not subscribe.',
      },
    },
  ],
  hooks: {
    // formsCoerceHook runs first: enforces consent-required + rejects unsafe
    // regex patterns. formSchemaVersionHook then bumps the schema version
    // when the (now-coerced) field shape has changed since the last save.
    beforeChange: [formsCoerceHook, formSchemaVersionHook],
  },
  versions: { drafts: true },
  timestamps: true,
};
