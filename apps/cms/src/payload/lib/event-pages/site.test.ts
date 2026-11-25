import { describe, expect, it } from 'vitest';

import { eventLeadSource, toSiteEvent, toSiteFormFields } from './site';

const form = {
  slug: 'event-registration',
  submitLabel: ' ',
  fields: [
    { name: 'full_name', type: 'text', label: 'Full Name', required: true },
    {
      name: 'pickup_location',
      type: 'text',
      label: 'Pick up location',
      required: true,
      conditions: { mode: 'all', rules: [{ fieldName: 'cab_required', operator: 'equals', value: 'yes' }] },
    },
    { type: 'text', label: 'No name is dropped' },
  ],
};

describe('event site payload', () => {
  it('tags registrations with the event slug', () => {
    expect(eventLeadSource('new-year')).toBe('event:new-year');
  });

  it('keeps conditions and drops fields without a name', () => {
    const fields = toSiteFormFields(form.fields);
    expect(fields.map((f) => f.name)).toEqual(['full_name', 'pickup_location']);
    expect(fields[1]?.conditions.rules).toEqual([{ fieldName: 'cab_required', operator: 'equals', value: 'yes' }]);
  });

  it('builds an event with absolute logo urls and a default button label', () => {
    const event = toSiteEvent(
      {
        title: 'New Year',
        slug: 'new-year',
        partners: [
          { name: 'Upwind', url: 'https://www.upwind.io', logo: { url: '/api/media/file/u.svg' } },
          { name: 'No logo', url: 'https://example.com', logo: null },
        ],
      },
      form,
      'https://cms.example.com',
    );
    expect(event?.registrationOpen).toBe(true);
    expect(event?.partners[0]?.logoUrl).toBe('https://cms.example.com/api/media/file/u.svg');
    expect(event?.partners[1]?.logoUrl).toBeNull();
    expect(event?.form.submitLabel).toBe('Register');
  });

  it('returns null for an event without a slug', () => {
    expect(toSiteEvent({ title: 'x' }, form, '')).toBeNull();
  });
});
