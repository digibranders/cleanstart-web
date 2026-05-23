import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FormPageBackground } from "@/components/sections/forms/FormPageBackground";
import { BookDemoForm } from "@/components/sections/forms/BookDemoForm";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Book a Demo",
  description:
    "Get a personalized CleanStart demo. See how hardened, zero-CVE container images, signed SBOMs, and provenance attestations fit your stack.",
  path: "/book-a-demo",
});

const VALUE_PROPS: string[] = [
  "The industry's most high performance and lowest footprint images.",
  "Compliance, governance, and security features built-in.",
  "Continuously updated and patched images for maximum security.",
  "Start immediately with 100% zero CVE hardened images.",
];

export default function BookDemoPage() {
  return (
    <>
      <JsonLd
        id="book-demo-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Book a Demo" },
        ])}
      />
      <Header />
      <main>
        <FormPageBackground>
          <h1
            className="font-display font-semibold text-white text-center mx-auto"
            style={{
              fontSize: "var(--text-hero-utility)",
              lineHeight: 1.15,
              letterSpacing: "var(--text-hero-utility-ls)",
              maxWidth: "860px",
            }}
          >
            Get a Demo
          </h1>

          <div className="mt-8 mx-auto" style={{ maxWidth: "560px" }}>
            <h2
              className="text-center text-white font-display font-medium"
              style={{
                fontSize: "var(--text-card-title-md)",
                lineHeight: 1.3,
              }}
            >
              What Sets Us Apart?
            </h2>
            <div
              aria-hidden
              className="mx-auto mt-5 h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
              }}
            />
            <ul className="mt-6 flex flex-col gap-3">
              {VALUE_PROPS.map((prop) => (
                <li key={prop} className="flex items-start gap-3">
                  <ShieldIcon />
                  <span
                    className="text-white/90"
                    style={{ fontSize: "var(--text-body-md)", lineHeight: 1.5 }}
                  >
                    {prop}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <BookDemoForm />
          </div>
        </FormPageBackground>
      </main>
      <Footer />
    </>
  );
}

function ShieldIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
      className="mt-[3px] shrink-0"
    >
      <title>Shield checkmark</title>
      <path
        d="M12 3 4 6v6.5c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2.2 2.2L15 10.5"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
