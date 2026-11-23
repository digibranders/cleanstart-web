"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollRegion } from "@/components/ui/scroll-region";
import { useToast } from "@/components/ui/toast";
import { checkRegionName, type RegionAdminDto, REGION_NAME_MAX } from "@/lib/regions";
import { issuesToErrors, type ActionResult } from "@/server/actions/result";
import { addRegionAction, moveRegionAction, renameRegionAction, setRegionActiveAction } from "@/server/actions/regions";

/** Sales regions: add, rename, reorder, deactivate. Keys never change and nothing is deleted. */
export function AdminRegions({ regions }: { regions: RegionAdminDto[] }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ key: string; name: string } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async <T,>(pending: Promise<ActionResult<T>>): Promise<ActionResult<T>> => {
    setBusy(true);
    const result = await pending;
    setBusy(false);
    if (result.ok) router.refresh();
    return result;
  };

  const add = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const checked = checkRegionName(newName, regions);
    if (!checked.ok) return setAddError(checked.message);
    setAddError(null);
    const result = await run(addRegionAction({ name: newName }));
    if (!result.ok) return setAddError(issuesToErrors(result.error).name ?? result.error.message);
    setNewName("");
    toast(`Added ${result.data.name}`);
  };

  const rename = async (): Promise<void> => {
    if (!editing) return;
    const checked = checkRegionName(editing.name, regions, editing.key);
    if (!checked.ok) return setEditError(checked.message);
    setEditError(null);
    const result = await run(renameRegionAction({ key: editing.key, name: editing.name }));
    if (!result.ok) return setEditError(issuesToErrors(result.error).name ?? result.error.message);
    setEditing(null);
    toast(`Renamed to ${result.data.name}`);
  };

  const move = async (key: string, direction: "up" | "down"): Promise<void> => {
    const result = await run(moveRegionAction({ key, direction }));
    if (!result.ok) toast(result.error.message);
  };

  const setActive = async (region: RegionAdminDto, active: boolean): Promise<void> => {
    const result = await run(setRegionActiveAction({ key: region.key, active }));
    if (!result.ok) return toast(result.error.message);
    toast(active ? `${region.name} is offered again` : `${region.name} is no longer offered for new records`);
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Regions</h1>
          <span className="h1-sub">
            The regions partners, deals and CleanStart teammates belong to. A region that is turned off stays on the records that already have it.
          </span>
        </div>
      </div>

      <section aria-labelledby="reg-add" className="card">
        <div className="card-h">
          <h2 id="reg-add" className="card-t">
            Add a region
          </h2>
        </div>
        <form className="card-b" onSubmit={add} noValidate style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="fg" style={{ margin: 0, minWidth: 240, flex: "1 1 240px", maxWidth: 360 }}>
            <label htmlFor="reg-name" className="lbl">
              Name
            </label>
            <input
              id="reg-name"
              className="finput"
              value={newName}
              maxLength={REGION_NAME_MAX}
              aria-invalid={addError ? true : undefined}
              aria-describedby={addError ? "reg-name-err" : undefined}
              onChange={(e) => setNewName(e.target.value)}
            />
            {addError ? (
              <span id="reg-name-err" className="err" role="alert">
                {addError}
              </span>
            ) : null}
          </div>
          <button type="submit" className="btn btn-p" disabled={busy} style={{ marginTop: 22 }}>
            Add region
          </button>
        </form>
      </section>

      <section aria-labelledby="reg-list" className="card clip">
        <div className="card-h">
          <h2 id="reg-list" className="card-t">
            All regions
          </h2>
          <span className="card-meta tnum">{regions.filter((r) => r.active).length} offered</span>
        </div>
        <ScrollRegion label="Regions">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Region</th>
                <th scope="col" className="hide-sm">
                  Partners
                </th>
                <th scope="col" className="hide-sm">
                  Partner managers
                </th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r, index) => (
                <tr key={r.key}>
                  <td>
                    {editing?.key === r.key ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          className="finput"
                          aria-label={`New name for ${r.name}`}
                          value={editing.name}
                          maxLength={REGION_NAME_MAX}
                          onChange={(e) => setEditing({ key: r.key, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void rename();
                            if (e.key === "Escape") setEditing(null);
                          }}
                        />
                        <button type="button" className="btn btn-p btn-s" disabled={busy} onClick={() => void rename()}>
                          Save
                        </button>
                        <button type="button" className="btn btn-s" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                        {editError ? (
                          <span className="err" role="alert">
                            {editError}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="li-t">
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {r.name}
                        </span>
                        <span className="li-s" style={{ fontFamily: "var(--mono, monospace)" }}>
                          {r.key}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="t-sec hide-sm tnum">{r.partnerCount}</td>
                  <td className="t-sec hide-sm">
                    {r.managers.length === 0
                      ? "None yet"
                      : r.managers.map((m) => (m.allRegions ? `${m.name} (all regions)` : m.name)).join(", ")}
                  </td>
                  <td>{r.active ? <Badge tone="accepted">Offered</Badge> : <Badge tone="neutral">Not offered</Badge>}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
                      <button type="button" className="btn btn-s" disabled={busy || index === 0} aria-label={`Move ${r.name} up`} onClick={() => void move(r.key, "up")}>
                        Up
                      </button>
                      <button type="button" className="btn btn-s" disabled={busy || index === regions.length - 1} aria-label={`Move ${r.name} down`} onClick={() => void move(r.key, "down")}>
                        Down
                      </button>
                      <button
                        type="button"
                        className="btn btn-s"
                        onClick={() => {
                          setEditError(null);
                          setEditing({ key: r.key, name: r.name });
                        }}
                      >
                        Rename
                      </button>
                      <button type="button" className="btn btn-s" disabled={busy} onClick={() => void setActive(r, !r.active)}>
                        {r.active ? "Turn off" : "Turn on"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <div className="card-b" style={{ borderTop: "1px solid #F0EFF4" }}>
          <span className="t-muted" style={{ fontSize: 12.5 }}>
            Partner managers cover a region on their profile on the Team page. Regions are never deleted, so history and reports stay whole.
          </span>
        </div>
      </section>
    </div>
  );
}
