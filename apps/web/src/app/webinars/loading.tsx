import { Header } from "@/components/nav/Header";
import {
  ListingHeroSkeleton,
  ListingGridSkeleton,
} from "@/components/sections/_shared/ListingSkeleton";

export default function Loading(): React.ReactElement {
  return (
    <>
      <Header />
      <main id="main-content" style={{ background: "#F6F6F6" }}>
        <ListingHeroSkeleton variant="webinars" />
        <ListingGridSkeleton variant="webinar" count={9} filter="dropdowns2" />
      </main>
    </>
  );
}
