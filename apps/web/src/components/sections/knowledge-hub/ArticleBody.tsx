import type { Block } from "./articles";
import { CodeBlock } from "./CodeBlock";
import { PROSE_TEXT_STYLE, SECTION_HEADING_STYLE } from "./prose-styles";

export function ArticleBody({ blocks }: { blocks: Block[] }): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: Block }): React.ReactElement {
  switch (block.type) {
    case "heading":
      return (
        <h2
          className="font-display font-semibold mt-6 first:mt-0"
          style={SECTION_HEADING_STYLE}
        >
          {block.text}
        </h2>
      );
    case "p":
      return <p style={PROSE_TEXT_STYLE}>{block.text}</p>;
    case "ul":
      return (
        <ul className="flex flex-col gap-2 pl-5 list-disc">
          {block.items.map((item, i) => (
            <li key={i} style={PROSE_TEXT_STYLE}>
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="flex flex-col gap-2 pl-5 list-decimal">
          {block.items.map((item, i) => (
            <li key={i} style={PROSE_TEXT_STYLE}>
              {item}
            </li>
          ))}
        </ol>
      );
    case "code":
      return <CodeBlock multiline={block.text.includes("\n")}>{block.text}</CodeBlock>;
  }
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <h2 className="font-display font-semibold" style={SECTION_HEADING_STYLE}>
        {heading}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
