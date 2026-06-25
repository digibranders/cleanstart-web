import { Header } from "@/components/nav/Header";
import {
  ListingHeroSkeleton,
  ListingGridSkeleton,
} from "@/components/sections/_shared/ListingSkeleton";

export default function Loading(): React.ReactElement {
  return (
    <>
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <ListingHeroSkeleton variant="events" />
        <ListingGridSkeleton variant="event" count={9} filter="dropdowns2" />
      </main>
    </>
  );
}
