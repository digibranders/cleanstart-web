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
        <ListingHeroSkeleton variant="blogs" />
        <ListingGridSkeleton variant="blog" count={9} />
      </main>
    </>
  );
}
