import type { Block } from 'payload';

const URL_PATTERNS: Record<string, RegExp> = {
  youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i,
  vimeo: /^https?:\/\/(www\.)?vimeo\.com\//i,
  loom: /^https?:\/\/(www\.)?loom\.com\//i,
};

export const Embed: Block = {
  slug: 'embed',
  labels: { singular: 'Embed', plural: 'Embeds' },
  fields: [
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'youtube',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
        { label: 'Loom', value: 'loom' },
      ],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      validate: (
        value: string | string[] | null | undefined,
        { siblingData }: { siblingData?: { provider?: string } },
      ): true | string => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Embed URL is required.';
        }
        const provider = siblingData?.provider;
        if (!provider) return true;
        const pattern = URL_PATTERNS[provider];
        if (pattern && !pattern.test(value)) {
          return `URL doesn't match the selected provider (${provider}).`;
        }
        return true;
      },
    },
    { name: 'title', type: 'text', admin: { description: 'iframe title for screen readers.' } },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: '16-9',
      options: [
        { label: '16:9', value: '16-9' },
        { label: '4:3', value: '4-3' },
        { label: '1:1', value: '1-1' },
        { label: '9:16 (vertical)', value: '9-16' },
      ],
    },
  ],
};
