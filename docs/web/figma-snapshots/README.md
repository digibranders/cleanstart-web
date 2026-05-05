# Figma snapshots

Reference renders of the *CleanStart V4* Figma file pages, produced by
`pnpm figma:extract` (see [`scripts/figma-extract.ts`](../../../scripts/figma-extract.ts)).

These are visual references for implementation review — not final assets. Final
images come from the Payload `media` collection at runtime.

## Coverage

| Page | File | Status |
|---|---|---|
| Home | `home.png` | **❌ Not rendered** — the home artboard is 1920×9276 px (~17.8 Mpx), which exceeds Figma's REST `/v1/images` render-service ceiling. Both `scale=2` and `scale=1` time out. **Workaround:** open the file at the Figma dev-mode link below and screenshot manually, OR re-render in section-by-section frames. |
| Attack Surface Reduction | `attack-surface-reduction.png` | ✓ |
| About Us | `about-us.png` | ✓ (12 MB) |
| FIPS Compliance | `fips.png` | ✓ |
| Vulnerability Remediation | `vulnerability-remediation.png` | ✓ |
| CleanSight | `cleansight.png` | ✓ |
| CleanStart SBOM | `cleanstart-sbom.png` | **❌ Empty page** — the Figma page exists but has zero children. Confirm with designer whether the SBOM design ships under a different page name (or remains pending). |

## Re-rendering

```sh
pnpm figma:extract
```

The script re-fetches all pages and walks node trees. Snapshots and tokens are
overwritten in place. Token JSON/CSS regenerate even when image renders fail.

## Source links

- Figma file: <https://www.figma.com/design/doWR9Xbwgkz6dqR9n4m3BB/CleanStart-V4>
- Home dev-mode: <https://www.figma.com/design/doWR9Xbwgkz6dqR9n4m3BB/CleanStart-V4?node-id=108-7624&m=dev>
