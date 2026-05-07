type LexicalTextNode = {
  type: 'text';
  version: 1;
  text: string;
  format: 0;
  style: '';
  mode: 'normal';
  detail: 0;
};

type LexicalParagraphNode = {
  type: 'paragraph';
  version: 1;
  format: '';
  indent: 0;
  direction: 'ltr' | null;
  textFormat: 0;
  textStyle: '';
  children: LexicalTextNode[];
};

type LexicalRootNode = {
  type: 'root';
  version: 1;
  format: '';
  indent: 0;
  direction: 'ltr' | null;
  children: LexicalParagraphNode[];
};

export type SerializedLexicalState = { root: LexicalRootNode };

const textNode = (text: string): LexicalTextNode => ({
  type: 'text',
  version: 1,
  text,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
});

const paragraphNode = (text: string): LexicalParagraphNode => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: text.length > 0 ? 'ltr' : null,
  textFormat: 0,
  textStyle: '',
  children: text.length > 0 ? [textNode(text)] : [],
});

/**
 * Build a minimal Lexical `SerializedEditorState` from plain paragraphs.
 * Used by the FAQ bulk-paste UX to seed the rich-text `answer` field.
 *
 * An empty input still yields a single empty paragraph so the editor
 * mounts with a valid root and the editor can immediately type into it.
 */
export const plainTextToLexicalState = (
  paragraphs: readonly string[],
): SerializedLexicalState => {
  const source = paragraphs.length > 0 ? paragraphs : [''];
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: source.map(paragraphNode),
    },
  };
};
