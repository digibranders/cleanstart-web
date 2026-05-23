import type { ReactNode } from "react";
import { Container, Section } from "@/components/layout";

interface LegalProseProps {
  children: ReactNode;
}

/**
 * Long-form legal body wrapper. Consumes the project's prose role tokens
 * (.article-body) so headings, paragraphs, lists and links inherit the
 * canonical typography from globals.css.
 */
export function LegalProse({ children }: LegalProseProps): React.ReactElement {
  return (
    <Section padding="md" className="bg-white">
      <Container variant="prose">
        <article className="article-body">{children}</article>
      </Container>
    </Section>
  );
}
