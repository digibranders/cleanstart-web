/**
 * CleanStart icon-only mark — used in the admin top-left header
 * (`admin.components.graphics.Icon`). Just the geometric chevron
 * without the wordmark, viewBox cropped to the mark's bounding box.
 *
 * The outer shape uses `currentColor` so it inverts cleanly between
 * light and dark themes; the inner chevron stays brand-cyan.
 */
export const Icon = () => (
  <svg
    role="img"
    aria-label="CleanStart"
    width="21"
    height="24"
    viewBox="0 0 28 32"
    fill="none"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    <title>CleanStart</title>
    <path
      d="M24.4225 10.3232V22.0552L15.8302 27.1981V15.272L12.4902 17.1971L12.5841 17.2503V31.1484L14.0052 31.9967L28.0097 23.8112V8.32301L27.9503 8.28857L24.4225 10.3232Z"
      fill="#06c7f2"
    />
    <path
      d="M15.8294 15.219L5.13978 8.92732L14.136 3.991L24.4187 9.87577V10.3203L27.9464 8.28563L13.9356 0L0 8.32006V23.6079L3.24914 25.5518V11.7695L12.4895 17.1942L15.8294 15.2691V15.219Z"
      fill="currentColor"
    />
  </svg>
);

export default Icon;
