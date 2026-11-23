"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  type DashboardCardDef,
  type DashboardId,
  type LayoutEntry,
  packSpans,
  reconcileLayout,
  type SavedLayout,
  SIZE_LABEL,
  SIZE_STEPS,
  toSaved,
} from "@/lib/dashboard-layout";
import { saveDashboardLayoutAction } from "@/server/actions/dashboard-layout";
import { useCustomize } from "./CustomizeContext";
import { Icon } from "../icon";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";

// Phosphor icons, 256 viewbox.
const GRIP =
  "M108,60A16,16,0,1,1,92,44,16,16,0,0,1,108,60Zm56,16a16,16,0,1,0-16-16A16,16,0,0,0,164,76ZM92,112a16,16,0,1,0,16,16A16,16,0,0,0,92,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,112ZM92,180a16,16,0,1,0,16,16A16,16,0,0,0,92,180Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,180Z";
const PLUS = "M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z";
const RESET =
  "M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z";

export interface DashboardCard {
  def: DashboardCardDef;
  /** The card's content, drawn by the page on the server. */
  node: React.ReactNode;
}

const SAVE_DELAY_MS = 500;

function Tile({
  entry,
  def,
  span,
  editing,
  isOver,
  onSize,
  onHide,
  children,
}: {
  entry: LayoutEntry;
  def: DashboardCardDef;
  span: number;
  editing: boolean;
  isOver: boolean;
  onSize: (span: number) => void;
  onHide: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useSortable({ id: entry.id, disabled: !editing });
  const wanted = entry.span ?? def.span;
  const sizes = SIZE_STEPS.filter((s) => s >= def.min && s <= def.max);
  return (
    <div
      ref={setNodeRef}
      data-id={entry.id}
      className={`dc${editing ? " dc-editing" : ""}${isDragging ? " dc-drag" : ""}${isOver ? " dc-over" : ""}`}
      style={{ ["--span" as string]: span }}
    >
      {editing ? (
        <div className="dc-bar">
          <button type="button" ref={setActivatorNodeRef} className="dc-grip" aria-label={`Move ${def.title}. Press space, then the arrow keys.`} {...attributes} {...listeners}>
            <Icon d={GRIP} />
          </button>
          <span className="dc-name">{def.title}</span>
          {sizes.length > 1 ? (
            <div className="dc-sizes" role="group" aria-label={`Width of ${def.title}`}>
              {sizes.map((s) => (
                <button key={s} type="button" className="dc-size" aria-pressed={wanted === s} aria-label={SIZE_LABEL[s] ?? String(s)} data-hint={SIZE_LABEL[s]} onClick={() => onSize(s)}>
                  {s === 4 ? "S" : s === 6 ? "M" : s === 8 ? "L" : "XL"}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="dc-hide" aria-label={`Hide ${def.title}`} data-hint="Hide" onClick={onHide}>
            <Icon name="x" />
          </button>
        </div>
      ) : null}
      <div className="dc-body">{children}</div>
    </div>
  );
}

/**
 * A dashboard the signed-in person can arrange. The page draws every card on the server and hands them over with their sizing rules;
 * this keeps the order, the hidden cards and the widths, resizes cards so each row of the 12 column grid is full, and saves the result
 * for that person. Customize turns on drag handles, a width picker and a hide button on each card, plus Add cards and Reset.
 */
export function DashboardGrid({ dashboard, cards, saved }: { dashboard: DashboardId; cards: readonly DashboardCard[]; saved: SavedLayout | null }): React.JSX.Element {
  const toast = useToast();
  const defs = useMemo(() => cards.map((c) => c.def), [cards]);
  const nodes = useMemo(() => new Map(cards.map((c) => [c.def.id, c.node])), [cards]);
  const defOf = useMemo(() => new Map(cards.map((c) => [c.def.id, c.def])), [cards]);

  const [entries, setEntries] = useState<LayoutEntry[]>(() => reconcileLayout(defs, saved));
  const { editing, setEditing } = useCustomize();
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const grid = useRef<HTMLDivElement>(null);
  const boxes = useRef(new Map<string, { x: number; y: number; w: number }>());
  const latest = useRef(entries);
  latest.current = entries;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Cards glide to their new place when the layout changes, and a card that is added eases in. Offsets are relative to the page, so scrolling never counts as movement.
  useLayoutEffect(() => {
    const host = grid.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, { x: number; y: number; w: number }>();
    const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
    for (const el of host.querySelectorAll<HTMLElement>(":scope > .dc")) {
      const id = el.dataset.id;
      if (!id) continue;
      const box = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth };
      next.set(id, box);
      if (reduced) continue;
      const before = boxes.current.get(id);
      if (before) {
        const dx = before.x - box.x;
        const dy = before.y - box.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 320, easing: ease });
        else if (Math.abs(before.w - box.w) > 1) el.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 260, easing: ease });
      } else if (boxes.current.size > 0) {
        el.animate([{ opacity: 0, transform: "scale(0.97)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: ease });
      }
    }
    boxes.current = next;
  });

  const flush = (): void => {
    clearTimeout(timer.current);
    void saveDashboardLayoutAction({ dashboard, layout: toSaved(latest.current) }).then((result) => {
      if (!result.ok) toast("Your layout could not be saved. It will reset when you reload.");
    });
  };
  const commit = (next: LayoutEntry[]): void => {
    setEntries(next);
    latest.current = next;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const visible = entries.filter((e) => !e.hidden && defOf.has(e.id));
  const hidden = entries.filter((e) => e.hidden && defOf.has(e.id));
  const spans = packSpans(
    visible.map((e) => {
      const d = defOf.get(e.id) as DashboardCardDef;
      return { span: Math.min(d.max, Math.max(d.min, e.span ?? d.span)), min: d.min, max: d.max };
    }),
  );

  const setEntry = (id: string, patch: Partial<LayoutEntry>): void => commit(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const add = (id: string): void => {
    const rest = entries.filter((e) => e.id !== id);
    const picked = entries.find((e) => e.id === id);
    if (picked) commit([...rest, { ...picked, hidden: false }]);
  };
  const reset = (): void => commit(reconcileLayout(defs, null));

  const cancelDrag = (): void => {
    setDragging(null);
    setOverId(null);
  };
  const openAdd = (): void => {
    setEditing(true);
    setAdding(true);
  };
  const onDragStart = (event: DragStartEvent): void => setDragging(String(event.active.id));
  const onDragOver = (event: DragOverEvent): void => setOverId(event.over ? String(event.over.id) : null);
  const onDragEnd = (event: DragEndEvent): void => {
    setDragging(null);
    setOverId(null);
    const from = entries.findIndex((e) => e.id === event.active.id);
    const to = event.over ? entries.findIndex((e) => e.id === event.over?.id) : -1;
    if (from >= 0 && to >= 0 && from !== to) commit(arrayMove(entries, from, to));
  };

  const done = (): void => {
    setEditing(false);
    if (timer.current) flush();
  };

  return (
    <>
      {editing ? (
        <div className="dc-tools">
          <span className="dc-hint">Drag a card by its handle to move it. Pick a width, or hide what you do not need. Changes save as you go.</span>
          <div className="dc-actions">
            <button type="button" className="btn btn-s" onClick={() => setAdding(true)} disabled={hidden.length === 0}>
              <Icon d={PLUS} />
              Add cards{hidden.length ? ` (${hidden.length})` : ""}
            </button>
            <button type="button" className="btn btn-s" onClick={reset}>
              <Icon d={RESET} />
              Reset
            </button>
            <button type="button" className="btn btn-p" onClick={done}>
              Done
            </button>
          </div>
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={cancelDrag}>
        <SortableContext items={visible.map((e) => e.id)} strategy={() => null}>
          <div className="dgrid" ref={grid}>
            {visible.map((e, i) => {
              const d = defOf.get(e.id) as DashboardCardDef;
              return (
                <Tile
                  key={e.id}
                  entry={e}
                  def={d}
                  span={spans[i] ?? d.span}
                  editing={editing}
                  isOver={overId === e.id && dragging !== e.id}
                  onSize={(s) => setEntry(e.id, { span: s })}
                  onHide={() => setEntry(e.id, { hidden: true })}
                >
                  {nodes.get(e.id)}
                </Tile>
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {dragging ? (
            <div className="dc-ghost">
              <Icon d={GRIP} />
              {defOf.get(dragging)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {visible.length === 0 ? (
        <div className="dc-empty">
          <p>Every card is hidden.</p>
          <button type="button" className="btn btn-p" onClick={openAdd}>
            Add cards
          </button>
        </div>
      ) : null}

      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="Add cards"
        subtitle="Cards you hid, and extra ones that are off by default. A new card goes to the end."
        footer={
          <button type="button" className="btn btn-s" onClick={() => setAdding(false)}>
            Close
          </button>
        }
      >
        {hidden.length === 0 ? <p className="hint">Every card is already on your dashboard.</p> : null}
        <ul className="dc-list">
          {hidden.map((e) => {
            const d = defOf.get(e.id) as DashboardCardDef;
            return (
              <li key={e.id} className="dc-item">
                <span className="dc-item-t">
                  <span className="dc-item-n">{d.title}</span>
                  <span className="dc-item-s">{d.description}</span>
                </span>
                <button type="button" className="btn btn-s" onClick={() => add(e.id)}>
                  <Icon d={PLUS} />
                  Add
                </button>
              </li>
            );
          })}
        </ul>
      </Drawer>
    </>
  );
}
