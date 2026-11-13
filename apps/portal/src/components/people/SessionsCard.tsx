"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { fmtTimestamp } from "@/lib/dates";
import type { SessionDto } from "@/lib/dto";
import { describeUserAgent } from "@/lib/people";
import { revokeSessionAction } from "@/server/actions/account";

export function SessionsCard({ sessions, today }: { sessions: SessionDto[]; today: string }): React.JSX.Element {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const others = sessions.filter((s) => !s.current);

  const signOutOthers = async (): Promise<void> => {
    setBusy("others");
    let signedOut = 0;
    for (const session of others) {
      const result = await revokeSessionAction({ sessionId: session.id });
      if (!result.ok) {
        toast(result.error.message);
        break;
      }
      signedOut += 1;
    }
    setBusy(null);
    if (signedOut === others.length) toast(`Signed out of ${signedOut} other devices`);
  };

  const signOut = async (session: SessionDto): Promise<void> => {
    setBusy(session.id);
    const result = await revokeSessionAction({ sessionId: session.id });
    setBusy(null);
    toast(result.ok ? "Signed out of that device" : result.error.message);
  };

  return (
    <section aria-labelledby="sess" className="card clip">
      <div className="card-h">
        <h2 id="sess" className="card-t">
          Where you are signed in
        </h2>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="card-meta tnum">
            {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
          </span>
          {others.length > 1 ? (
            <button
              type="button"
              className="btn btn-s"
              style={{ height: 28, padding: "0 8px", fontSize: 12 }}
              disabled={busy !== null}
              onClick={() => void signOutOthers()}
            >
              Sign out all other devices
            </button>
          ) : null}
        </span>
      </div>
      {sessions.map((s) => (
        <div key={s.id} className="li">
          <span className="li-t">
            <span className="li-n">{describeUserAgent(s.userAgent)}</span>
            <span className="li-s">
              {s.ipAddress ?? "Unknown address"}, signed in {fmtTimestamp(s.createdAt, today)}
            </span>
          </span>
          {s.current ? (
            <span style={{ marginLeft: "auto" }}>
              <Badge tone="accepted">This device</Badge>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-s"
              style={{ marginLeft: "auto", height: 26, padding: "0 8px", fontSize: 12 }}
              disabled={busy !== null}
              onClick={() => void signOut(s)}
            >
              Sign out
            </button>
          )}
        </div>
      ))}
      {sessions.length === 0 ? <div className="empty">No active sessions.</div> : null}
    </section>
  );
}
