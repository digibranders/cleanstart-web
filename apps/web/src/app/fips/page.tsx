import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { FipsHero } from "@/components/sections/fips/FipsHero";
import { FipsWhyMatters } from "@/components/sections/fips/FipsWhyMatters";
import { FipsEnables } from "@/components/sections/fips/FipsEnables";
import { FipsMaturityModel } from "@/components/sections/fips/FipsMaturityModel";
import { FipsRegulatedEnvironments } from "@/components/sections/fips/FipsRegulatedEnvironments";
import { FipsOperationalImpact } from "@/components/sections/fips/FipsOperationalImpact";
import { FipsCTA } from "@/components/sections/fips/FipsCTA";

export const metadata = {
  title: "FIPS Compliance | CleanStart",
  description:
    "FIPS 140-3 validated cryptography across your container stack. Built on validated cryptographic foundations for secure, compliant container environments.",
};

export default function FipsCompliancePage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <FipsHero />
        <FadeUp>
          <FipsWhyMatters />
        </FadeUp>
        <FadeUp>
          <FipsEnables />
        </FadeUp>
        <FadeUp>
          <FipsMaturityModel />
        </FadeUp>
        <FadeUp>
          <FipsRegulatedEnvironments />
        </FadeUp>
        <FadeUp>
          <FipsOperationalImpact />
        </FadeUp>
        <FadeUp className="relative z-10">
          <FipsCTA />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
