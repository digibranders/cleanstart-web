import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import type { JSX } from 'react';
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';

import type { EmbedAspectRatio, EmbedMode, EmbedProvider } from './embed-providers';
import { detectProvider, embedUrlForProvider } from './embed-providers';

export type SerializedEmbedNode = Spread<
  {
    mode: EmbedMode;
    url: string;
    embedUrl: string;
    provider: EmbedProvider;
    rawHtml: string;
    title: string;
    aspectRatio: EmbedAspectRatio;
    caption: string;
    /** Optional visual preset slug from EMBED_STYLE_PRESETS ('' = none).
        Optional in the serialized shape so nodes stored before the field
        existed keep importing cleanly. */
    styleSlug?: string;
  },
  SerializedDecoratorBlockNode
> & {
  type: 'embed';
  version: 1;
};

type EmbedNodeData = {
  mode: EmbedMode;
  url: string;
  embedUrl: string;
  provider: EmbedProvider;
  rawHtml: string;
  title: string;
  aspectRatio: EmbedAspectRatio;
  caption: string;
  styleSlug?: string;
  format?: ElementFormatType;
  key?: NodeKey;
};

export class EmbedNode extends DecoratorBlockNode {
  __mode: EmbedMode;
  __url: string;
  __embedUrl: string;
  __provider: EmbedProvider;
  __rawHtml: string;
  __title: string;
  __aspectRatio: EmbedAspectRatio;
  __caption: string;
  __styleSlug: string;

  constructor(data: EmbedNodeData) {
    super(data.format, data.key);
    this.__mode = data.mode;
    this.__url = data.url;
    this.__embedUrl = data.embedUrl;
    this.__provider = data.provider;
    this.__rawHtml = data.rawHtml;
    this.__title = data.title;
    this.__aspectRatio = data.aspectRatio;
    this.__caption = data.caption;
    this.__styleSlug = data.styleSlug ?? '';
  }

  static override getType(): string {
    return 'embed';
  }

  static override clone(node: EmbedNode): EmbedNode {
    return new EmbedNode({
      mode: node.__mode,
      url: node.__url,
      embedUrl: node.__embedUrl,
      provider: node.__provider,
      rawHtml: node.__rawHtml,
      title: node.__title,
      aspectRatio: node.__aspectRatio,
      caption: node.__caption,
      styleSlug: node.__styleSlug,
      format: node.__format,
      key: node.__key,
    });
  }

  static override importJSON(json: SerializedEmbedNode): EmbedNode {
    return new EmbedNode({
      mode: json.mode,
      url: json.url,
      embedUrl: json.embedUrl,
      provider: json.provider,
      rawHtml: json.rawHtml,
      title: json.title,
      aspectRatio: json.aspectRatio,
      caption: json.caption,
      styleSlug: json.styleSlug ?? '',
      format: json.format,
    });
  }

  static override importDOM(): DOMConversionMap<HTMLElement> | null {
    return {
      iframe: (node: Node) => {
        const el = node as HTMLIFrameElement;
        const src = el.getAttribute('src');
        if (!src) return null;
        return {
          conversion: (domNode: Node): DOMConversionOutput | null => {
            const iframe = domNode as HTMLIFrameElement;
            const iframeSrc = iframe.getAttribute('src');
            if (!iframeSrc) return null;
            const provider = detectProvider(iframeSrc);
            const embedUrl = embedUrlForProvider(iframeSrc, provider) ?? iframeSrc;
            return {
              node: new EmbedNode({
                mode: 'iframe',
                url: iframeSrc,
                embedUrl,
                provider,
                rawHtml: '',
                title: iframe.getAttribute('title') ?? '',
                aspectRatio: '16-9',
                caption: '',
              }),
            };
          },
          priority: 1,
        };
      },
    };
  }

  override exportJSON(): SerializedEmbedNode {
    return {
      ...super.exportJSON(),
      type: 'embed',
      version: 1,
      mode: this.__mode,
      url: this.__url,
      embedUrl: this.__embedUrl,
      provider: this.__provider,
      rawHtml: this.__rawHtml,
      title: this.__title,
      aspectRatio: this.__aspectRatio,
      caption: this.__caption,
      styleSlug: this.__styleSlug,
    };
  }

  override exportDOM(): DOMExportOutput {
    if (this.__mode === 'script') {
      const div = document.createElement('div');
      div.setAttribute('data-embed-mode', 'script');
      div.setAttribute('data-embed-title', this.__title);
      return { element: div };
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', this.__embedUrl);
    if (this.__title) iframe.setAttribute('title', this.__title);
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    return { element: iframe };
  }

  override createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'cs-embed-block';
    return div;
  }

  override updateDOM(): false {
    return false;
  }

  override getTextContent(): string {
    if (this.__mode === 'iframe') return this.__url;
    return `[embed: ${this.__title || 'script block'}]`;
  }

  // Getters
  getMode(): EmbedMode { return this.__mode; }
  getUrl(): string { return this.__url; }
  getEmbedUrl(): string { return this.__embedUrl; }
  getProvider(): EmbedProvider { return this.__provider; }
  getRawHtml(): string { return this.__rawHtml; }
  getTitle(): string { return this.__title; }
  getAspectRatio(): EmbedAspectRatio { return this.__aspectRatio; }
  getCaption(): string { return this.__caption; }
  getStyleSlug(): string { return this.__styleSlug; }

  // Setters — must be called inside editor.update()
  setMode(mode: EmbedMode): void {
    const w = this.getWritable();
    w.__mode = mode;
  }

  setUrl(url: string, embedUrl: string, provider: EmbedProvider): void {
    const w = this.getWritable();
    w.__url = url;
    w.__embedUrl = embedUrl;
    w.__provider = provider;
  }

  setRawHtml(rawHtml: string): void {
    const w = this.getWritable();
    w.__rawHtml = rawHtml;
  }

  setTitle(title: string): void {
    const w = this.getWritable();
    w.__title = title;
  }

  setAspectRatio(ratio: EmbedAspectRatio): void {
    const w = this.getWritable();
    w.__aspectRatio = ratio;
  }

  setCaption(caption: string): void {
    const w = this.getWritable();
    w.__caption = caption;
  }

  setStyleSlug(styleSlug: string): void {
    const w = this.getWritable();
    w.__styleSlug = styleSlug;
  }

  // decorate() is only ever called client-side by Lexical's React renderer.
  // We do a lazy require here so the class remains importable server-side
  // (for getType / importJSON / exportJSON) without pulling in React/JSX.
  override decorate(editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    // Imported lazily so this file stays server-safe.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EmbedComponent } = require('./EmbedComponent') as {
      EmbedComponent: (props: Parameters<typeof import('./EmbedComponent').EmbedComponent>[0]) => JSX.Element;
    };
    return EmbedComponent({
      mode: this.__mode,
      url: this.__url,
      embedUrl: this.__embedUrl,
      provider: this.__provider,
      rawHtml: this.__rawHtml,
      title: this.__title,
      aspectRatio: this.__aspectRatio,
      caption: this.__caption,
      styleSlug: this.__styleSlug,
      format: this.__format,
      nodeKey: this.__key,
      editor,
    });
  }
}

export function $createEmbedNode(data: Omit<EmbedNodeData, 'key'>): EmbedNode {
  return new EmbedNode(data);
}

export function $isEmbedNode(
  node: LexicalNode | null | undefined,
): node is EmbedNode {
  return node instanceof EmbedNode;
}
