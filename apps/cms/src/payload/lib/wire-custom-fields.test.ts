import type { CollectionConfig, Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { wireCustomFields } from './wire-custom-fields';

const fieldOf = (config: CollectionConfig, name: string): Field => {
  const found = config.fields.find((f) => 'name' in f && f.name === name);
  if (!found) throw new Error(`field not found: ${name}`);
  return found;
};

const componentPath = (field: Field): string | undefined => {
  const admin = (field as { admin?: { components?: { Field?: unknown } } }).admin;
  const path = admin?.components?.Field;
  return typeof path === 'string' ? path : undefined;
};

describe('wireCustomFields', () => {
  it('preserves slug, hooks, access, and other top-level keys', () => {
    const beforeChange = (() => undefined) as unknown as NonNullable<
      CollectionConfig['hooks']
    >['beforeChange'];
    const access = { read: () => true };
    const config: CollectionConfig = {
      slug: 'demo',
      access,
      hooks: { beforeChange: beforeChange as never },
      fields: [{ name: 'title', type: 'text' }],
    };
    const wired = wireCustomFields(config);
    expect(wired.slug).toBe('demo');
    expect(wired.access).toBe(access);
    expect(wired.hooks).toBe(config.hooks);
  });

  it('injects a custom Field component for known field types', () => {
    const wired = wireCustomFields({
      slug: 'demo',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'body', type: 'textarea' },
        { name: 'count', type: 'number' },
      ],
    });
    expect(componentPath(fieldOf(wired, 'title'))).toContain('TextField');
    expect(componentPath(fieldOf(wired, 'body'))).toContain('TextareaField');
    expect(componentPath(fieldOf(wired, 'count'))).toContain('NumberField');
  });

  it('does NOT override an existing per-field component path', () => {
    const wired = wireCustomFields({
      slug: 'demo',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            components: {
              Field: '@/already/Custom.tsx#Custom',
            },
          },
        },
      ],
    });
    expect(componentPath(fieldOf(wired, 'title'))).toBe('@/already/Custom.tsx#Custom');
  });

  it('preserves Cell overrides while injecting Field', () => {
    const wired = wireCustomFields({
      slug: 'demo',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            components: {
              Cell: '@/already/Cell.tsx#CustomCell',
            },
          },
        },
      ],
    });
    const f = fieldOf(wired, 'title') as Field & {
      admin?: { components?: { Cell?: unknown; Field?: unknown } };
    };
    expect(f.admin?.components?.Cell).toBe('@/already/Cell.tsx#CustomCell');
    expect(typeof f.admin?.components?.Field).toBe('string');
  });

  it('recurses into group / array / row / tabs containers', () => {
    const wired = wireCustomFields({
      slug: 'demo',
      fields: [
        {
          type: 'group',
          name: 'meta',
          fields: [{ name: 'tagline', type: 'text' }],
        },
        {
          type: 'array',
          name: 'authors',
          fields: [{ name: 'displayName', type: 'text' }],
        },
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Content',
              fields: [{ name: 'lede', type: 'text' }],
            },
          ],
        },
      ],
    });

    const group = fieldOf(wired, 'meta') as Field & { fields: Field[] };
    expect(componentPath(group.fields[0] as Field)).toContain('TextField');

    const array = fieldOf(wired, 'authors') as Field & { fields: Field[] };
    expect(componentPath(array.fields[0] as Field)).toContain('TextField');

    const tabs = wired.fields.find((f) => f.type === 'tabs') as
      | (Field & { tabs: Array<{ fields: Field[] }> })
      | undefined;
    expect(tabs?.tabs[0]?.fields[0] && componentPath(tabs.tabs[0].fields[0] as Field)).toContain(
      'TextField',
    );
  });

  it('recurses into blocks now that BlocksField composes via RenderFields (Wave 2 part 2)', () => {
    const wired = wireCustomFields({
      slug: 'demo',
      fields: [
        {
          type: 'blocks',
          name: 'body',
          blocks: [
            {
              slug: 'hero',
              fields: [{ name: 'headline', type: 'text' }],
            },
          ],
        },
      ],
    });
    const blocks = wired.fields.find((f) => f.type === 'blocks') as
      | (Field & { blocks: Array<{ fields: Field[] }> })
      | undefined;
    const heroHeadline = blocks?.blocks[0]?.fields[0] as Field;
    expect(componentPath(heroHeadline)).toBe(
      '@/payload/admin/components/fields/TextField.tsx#TextField',
    );
  });

  it('wires date fields to the @cleanstart/ui DateTimePicker (Wave 2)', () => {
    const wired = wireCustomFields({
      slug: 'demo',
      fields: [{ name: 'publishedAt', type: 'date' }],
    });
    expect(componentPath(fieldOf(wired, 'publishedAt'))).toBe(
      '@/payload/admin/components/fields/DateField.tsx#DateField',
    );
  });
});
