import {
  FilterGroup,
  FilterSidebarCard,
  MobileTabStrip,
} from "@/components/sections/_shared/SidebarFilters";
import {
  DEPARTMENT_LABEL,
  type JobDepartment,
  type JobLocation,
} from "@/lib/jobs-utils";

interface CareersSidebarProps {
  activeDepartment: string;
  activeLocation: string;
  searchQuery: string;
  /** Department slugs that have at least one open role — others are hidden. */
  availableDepartments: JobDepartment[];
  /** Location records that have at least one open role attached. */
  availableLocations: JobLocation[];
}

export function CareersSidebar({
  activeDepartment,
  activeLocation,
  searchQuery,
  availableDepartments,
  availableLocations,
}: CareersSidebarProps): React.ReactElement {
  const hrefFor = ({
    department,
    location,
  }: {
    department?: string;
    location?: string;
  }): string => {
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (location) params.set("location", location);
    if (searchQuery) params.set("q", searchQuery);
    return `/careers${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <nav
      aria-label="Filter open roles"
      className="shrink-0 w-full lg:w-[295px]"
    >
      <div className="lg:hidden flex flex-col gap-4">
        <MobileTabStrip
          label="Position"
          items={[
            { value: "", label: "All Departments", active: !activeDepartment },
            ...availableDepartments.map((d) => ({
              value: d,
              label: DEPARTMENT_LABEL[d],
              active: activeDepartment === d,
            })),
          ]}
          buildHref={(value) =>
            hrefFor({
              department: value,
              location: activeLocation,
            })
          }
        />
        <MobileTabStrip
          label="Locations"
          items={[
            { value: "", label: "All Locations", active: !activeLocation },
            ...availableLocations.map((l) => ({
              value: l.slug,
              label: l.name,
              active: activeLocation === l.slug,
            })),
          ]}
          buildHref={(value) =>
            hrefFor({
              department: activeDepartment,
              location: value,
            })
          }
        />
      </div>

      <FilterSidebarCard>
        <FilterGroup
          heading="DEPARTMENT"
          items={[
            {
              key: "all-departments",
              label: "All Departments",
              href: hrefFor({
                location: activeLocation,
              }),
              active: !activeDepartment,
            },
            ...availableDepartments.map((d) => ({
              key: d,
              label: DEPARTMENT_LABEL[d],
              href: hrefFor({
                department: d,
                location: activeLocation,
              }),
              active: activeDepartment === d,
            })),
          ]}
        />

        <div
          style={{
            height: "1px",
            background: "rgba(17,17,17,0.12)",
            margin: "14px 0",
          }}
        />

        <FilterGroup
          heading="LOCATIONS"
          items={[
            {
              key: "all-locations",
              label: "All Locations",
              href: hrefFor({
                department: activeDepartment,
              }),
              active: !activeLocation,
              icon: <PinIcon />,
            },
            ...availableLocations.map((l) => ({
              key: l.slug,
              label: l.name,
              href: hrefFor({
                department: activeDepartment,
                location: l.slug,
              }),
              active: activeLocation === l.slug,
              icon: <PinIcon />,
            })),
          ]}
        />
      </FilterSidebarCard>
    </nav>
  );
}

function PinIcon(): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 12.5s4-3.5 4-7a4 4 0 10-8 0c0 3.5 4 7 4 7z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="7" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
