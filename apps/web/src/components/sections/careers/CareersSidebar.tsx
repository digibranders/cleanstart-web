import Link from "next/link";
import {
  DEPARTMENT_LABEL,
  type JobDepartment,
  type JobLocation,
  type JobStatusFilter,
} from "@/lib/jobs";

interface CareersSidebarProps {
  activeDepartment: string;
  activeLocation: string;
  activeStatus: JobStatusFilter;
  searchQuery: string;
  /** Department slugs that have at least one open role — others are hidden. */
  availableDepartments: JobDepartment[];
  /** Location records that have at least one open role attached. */
  availableLocations: JobLocation[];
}

const STATUS_OPTIONS: Array<{ value: JobStatusFilter; label: string }> = [
  { value: "open", label: "Open roles" },
  { value: "closed", label: "Closed roles" },
  { value: "all", label: "All roles" },
];

export function CareersSidebar({
  activeDepartment,
  activeLocation,
  activeStatus,
  searchQuery,
  availableDepartments,
  availableLocations,
}: CareersSidebarProps): React.ReactElement {
  const hrefFor = ({
    department,
    location,
    status,
  }: {
    department?: string;
    location?: string;
    status?: JobStatusFilter;
  }): string => {
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (location) params.set("location", location);
    if (status && status !== "open") params.set("status", status);
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
          label="Status"
          items={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
            active: activeStatus === opt.value,
          }))}
          buildHref={(value) =>
            hrefFor({
              department: activeDepartment,
              location: activeLocation,
              status: (value || "open") as JobStatusFilter,
            })
          }
        />
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
              status: activeStatus,
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
              status: activeStatus,
            })
          }
        />
      </div>

      {/* Sticks below the 80px header with 16px breathing room. When the filter
          list overflows the viewport (short screens / many locations), the card
          scrolls internally — a slim, subtle scrollbar is shown so the overflow
          is discoverable and the cut-off items stay reachable. */}
      <div
        className="relative hidden lg:block lg:sticky [scrollbar-width:thin] [scrollbar-color:rgba(17,17,17,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 hover:[&::-webkit-scrollbar-thumb]:bg-black/25"
        style={{
          top: "96px",
          maxHeight: "calc(100vh - 112px)",
          overflowY: "auto",
          background: "white",
          borderRadius: "16px",
          padding: "18px 16px",
          boxShadow:
            "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01)",
        }}
      >
        <FilterGroup
          heading="STATUS"
          items={STATUS_OPTIONS.map((opt) => ({
            key: opt.value,
            label: opt.label,
            href: hrefFor({
              department: activeDepartment,
              location: activeLocation,
              status: opt.value,
            }),
            active: activeStatus === opt.value,
          }))}
        />

        <div
          style={{
            height: "1px",
            background: "rgba(17,17,17,0.12)",
            margin: "14px 0",
          }}
        />

        <FilterGroup
          heading="DEPARTMENT"
          items={[
            {
              key: "all-departments",
              label: "All Departments",
              href: hrefFor({
                location: activeLocation,
                status: activeStatus,
              }),
              active: !activeDepartment,
            },
            ...availableDepartments.map((d) => ({
              key: d,
              label: DEPARTMENT_LABEL[d],
              href: hrefFor({
                department: d,
                location: activeLocation,
                status: activeStatus,
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
                status: activeStatus,
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
                status: activeStatus,
              }),
              active: activeLocation === l.slug,
              icon: <PinIcon />,
            })),
          ]}
        />
      </div>
    </nav>
  );
}

interface FilterGroupItem {
  key: string;
  label: string;
  href: string;
  active: boolean;
  icon?: React.ReactNode;
}

function FilterGroup({
  heading,
  items,
}: {
  heading: string;
  items: FilterGroupItem[];
}): React.ReactElement {
  return (
    <>
      <p
        className="font-sans uppercase"
        style={{
          fontSize: "var(--fs-badge)",
          letterSpacing: "0.08em",
          color: "rgba(17,17,17,0.6)",
          fontWeight: 500,
          marginBottom: "8px",
        }}
      >
        {heading}
      </p>
      <ul className="flex flex-col" style={{ gap: "6px" }}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className="flex items-center gap-2 no-underline transition-colors"
              style={{
                height: "34px",
                padding: "0 12px",
                borderRadius: "10px",
                background: item.active ? "rgba(74,59,241,0.08)" : "#ffffff",
                border: `1px solid ${item.active ? "rgba(74,59,241,0.35)" : "rgba(17,17,17,0.08)"}`,
                color: item.active ? "#4a3bf1" : "#111",
                fontWeight: 500,
              }}
            >
              {item.icon ? (
                <span
                  aria-hidden
                  className="flex items-center justify-center shrink-0"
                  style={{ width: "16px", height: "16px" }}
                >
                  {item.icon}
                </span>
              ) : null}
              <span
                className="font-sans"
                style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.2 }}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

interface MobileTab {
  value: string;
  label: string;
  active: boolean;
}

function MobileTabStrip({
  label,
  items,
  buildHref,
}: {
  label: string;
  items: MobileTab[];
  buildHref: (value: string) => string;
}): React.ReactElement {
  return (
    <div>
      <p
        className="font-sans uppercase px-1"
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          color: "rgba(17,17,17,0.6)",
          fontWeight: 500,
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <div className="-mx-6 px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex items-center gap-2 min-w-max">
          {items.map((item) => (
            <li key={item.value || "__all"} className="shrink-0">
              <Link
                href={buildHref(item.value)}
                aria-current={item.active ? "page" : undefined}
                className="block whitespace-nowrap font-sans"
                style={{
                  fontSize: "var(--fs-body-sm)",
                  fontWeight: 500,
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: `1px solid ${item.active ? "#4a3bf1" : "rgba(17,17,17,0.12)"}`,
                  color: item.active ? "#4a3bf1" : "rgba(17,17,17,0.78)",
                  background: item.active ? "rgba(74,59,241,0.08)" : "white",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
