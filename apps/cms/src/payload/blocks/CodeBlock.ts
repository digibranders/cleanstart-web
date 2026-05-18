import type { Block } from 'payload';

export const CodeBlock: Block = {
  slug: 'codeBlock',
  labels: { singular: 'Code block', plural: 'Code blocks' },
  fields: [
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'bash',
      options: [
        { label: 'Bash', value: 'bash' },
        { label: 'Dockerfile', value: 'dockerfile' },
        { label: 'YAML', value: 'yaml' },
        { label: 'JSON', value: 'json' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'Python', value: 'python' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rust' },
        { label: 'SQL', value: 'sql' },
        { label: 'HCL (Terraform)', value: 'hcl' },
        { label: 'Plain text', value: 'text' },
      ],
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Paste code here. Indentation is preserved.',
        rows: 14,
        style: {
          fontFamily:
            'ui-monospace, "JetBrains Mono", "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
          fontSize: '13px',
          lineHeight: '1.55',
          whiteSpace: 'pre',
          tabSize: 2,
        },
      },
    },
    {
      name: 'showLineNumbers',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'highlightLines',
      type: 'text',
      admin: {
        description: 'Comma-separated line numbers / ranges (e.g. "1,3-5,8") to highlight.',
      },
    },
  ],
};
