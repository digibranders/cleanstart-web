"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";

interface VideoModalProps {
  title: string;
  /** The player, rendered edge to edge above the text. */
  player: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Player-over-library overlay for the intercepted /videos/[slug] route. It is
 * always open while mounted: Close, Escape and a backdrop click all step back in
 * history, which unmounts the slot and returns to the library with its filters
 * and scroll position intact.
 *
 * No transition classes on purpose: base-ui waits for `transitionend` before it
 * unmounts, and a controlled dialog can wedge there. The entrance is a CSS
 * animation instead, which nothing waits on.
 */
export function VideoModal({ title, player, children }: VideoModalProps): React.ReactElement {
  const router = useRouter();
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-[#08041a]/70 backdrop-blur-sm" />
        <Dialog.Popup className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain outline-none md:px-8 md:py-10">
          <div className="cs-video-modal-pop relative mx-auto flex min-h-full w-full max-w-[980px] flex-col overflow-hidden bg-white md:min-h-0 md:rounded-[28px] md:shadow-[0_40px_120px_rgba(5,4,30,0.6)]">
            {/* Its own bar, not an overlay: YouTube draws volume, captions and
                settings in the player's top-right corner, and a close button
                there covers them. */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[rgba(18,16,28,0.08)] pl-6 pr-2.5 sm:pl-9">
              <span className="font-sans text-[14px] font-medium text-[#5B5870]">CleanStart Videos</span>
              <Dialog.Close
                aria-label="Close video"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full text-[#12101C] transition-colors duration-200 hover:bg-[#F1EFF8] focus-visible:outline-2 focus-visible:outline-[#5B2EE0] motion-reduce:transition-none"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </Dialog.Close>
            </div>
            {player}
            <div className="flex flex-col gap-7 px-6 pb-8 pt-6 sm:px-9 sm:pb-10 sm:pt-7">
              <Dialog.Title
                className="font-display font-semibold text-[#12101C]"
                style={{ fontSize: "var(--fs-h3)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
              >
                {title}
              </Dialog.Title>
              {children}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
