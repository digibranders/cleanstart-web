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
      name: 'filename',
      type: 'text',
      admin: { description: 'Optional filename rendered as a tab above the code (e.g. Dockerfile).' },
    },
    {
      name: 'content',
      type: 'code',
      required: true,
      admin: {
        editorOptions: {
          fontSize: 13,
          lineNumbers: 'on',
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
