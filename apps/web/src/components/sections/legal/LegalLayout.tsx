import type { ReactNode } from "react";
import { Container, Section } from "@/components/layout";
import { LegalSidebar } from "./LegalSidebar";

interface LegalLayoutProps {
  activeHref: string;
  children: ReactNode;
}

/**
 * Two-column layout for legal documents: sticky sidebar on the left at lg+,
 * stacked article body underneath on smaller viewports. Body consumes the
 * shared `.article-body` prose system from globals.css.
 */
export function LegalLayout({ activeHref, children }: LegalLayoutProps): React.ReactElement {
  return (
    <Section padding="md" className="bg-white">
      <Container variant="default">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
          <aside>
            <LegalSidebar activeHref={activeHref} />
          </aside>
          <article className="article-body min-w-0">{children}</article>
        </div>
      </Container>
    </Section>
  );
}
