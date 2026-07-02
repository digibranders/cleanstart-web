'use client';

import { EMBED_STYLE_PRESETS } from '@cleanstart/types';
import type { ElementFormatType, LexicalEditor } from 'lexical';
import { $getNodeByKey } from 'lexical';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';

import type { EmbedAspectRatio, EmbedMode, EmbedProvider } from './embed-providers';
import { sandboxForProvider } from './embed-providers';
import { OPEN_EMBED_DIALOG_COMMAND } from './EmbedPlugin';

type Props = {
  readonly mode: EmbedMode;
  readonly url: string;
  readonly embedUrl: string;
  readonly provider: EmbedProvider;
  readonly rawHtml: string;
  readonly title: string;
  readonly aspectRatio: EmbedAspectRatio;
  readonly caption: string;
  readonly styleSlug: string;
  readonly format: ElementFormatType;
  readonly nodeKey: string;
  readonly editor: LexicalEditor;
};

// Inline SVG for the script-mode placeholder icon
function CodeBracketIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="24"
    >
      <path d="M7 8L3 12l4 4M17 8l4 4-4 4M14 4l-4 16" />
    </svg>
  );
}

function PencilIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
      width="13"
    >
      <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" />
    </svg>
  );
}

function TrashIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
      width="13"
    >
      <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" />
    </svg>
  );
}

export function EmbedComponent(props: Props): React.ReactElement {
  const {
    mode,
    embedUrl,
    provider,
    title,
    aspectRatio,
    caption,
    styleSlug,
    format,
    nodeKey,
    editor,
  } = props;

  const stylePreset =
    styleSlug !== '' ? EMBED_STYLE_PRESETS.find((p) => p.slug === styleSlug) : undefined;

  const handleEdit = (): void => {
    editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, { nodeKey });
  };

  const handleRemove = (): void => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      node?.remove();
    });
  };

  return (
    <BlockWithAlignableContents
      className={{ base: 'cs-embed-block__wrapper', focus: 'cs-embed-block__wrapper--focused' }}
      format={format}
      nodeKey={nodeKey}
    >
      {mode === 'iframe' ? (
        <div
          className={`cs-embed-aspect cs-embed-aspect--${aspectRatio}`}
          data-cs-embed-provider={provider}
        >
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            className="cs-embed-iframe"
            loading="lazy"
            sandbox={sandboxForProvider(provider)}
            src={embedUrl}
            title={title || provider}
          />
        </div>
      ) : (
        <div
          className="cs-embed-script-placeholder"
          data-cs-embed-mode="script"
          style={
            stylePreset
              ? { borderLeft: `4px solid ${stylePreset.swatch}` }
              : undefined
          }
        >
          <CodeBracketIcon />
          <p className="cs-embed-script-placeholder__name">
            {title || 'Script embed'}
          </p>
          <p className="cs-embed-script-placeholder__hint">
            Scripts execute on the live site only.
          </p>
          {stylePreset && (
            <p className="cs-embed-script-placeholder__hint">
              Style: <strong style={{ color: stylePreset.swatch }}>{stylePreset.label}</strong>
            </p>
          )}
        </div>
      )}

      {caption ? <p className="cs-embed-caption">{caption}</p> : null}

      <div className="cs-embed-actions">
        <button
          aria-label="Edit embed"
          className="cs-embed-action-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleEdit}
          type="button"
        >
          <PencilIcon />
          Edit
        </button>
        <button
          aria-label="Remove embed"
          className="cs-embed-action-btn cs-embed-action-btn--remove"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleRemove}
          type="button"
        >
          <TrashIcon />
          Remove
        </button>
      </div>
    </BlockWithAlignableContents>
  );
}
