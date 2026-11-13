"use client";

import { useEffect, useRef, useState } from "react";
import { sendManagerMessageAction } from "@/server/actions/partners";
import { Icon } from "../icon";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { initialsOf } from "./derive";
import type { ManagerContact } from "./types";

/** The "Message your partner manager" drawer, opened from a screen with a subject already filled in. */
export function ManagerMessageDrawer({
  manager,
  senderEmail,
  initialSubject,
  onClose,
}: {
  manager: ManagerContact;
  senderEmail: string;
  initialSubject: string;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const invalid = tried && !body.trim();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // The subject is already filled in, so the cursor belongs in the message. This runs after the drawer's own focus move.
  useEffect(() => {
    bodyRef.current?.focus();
  }, []);

  const send = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!body.trim()) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await sendManagerMessageAction({ subject, body });
    setBusy(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    toast(`Message sent to ${manager.name}`);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Message ${manager.name}`}
      subtitle={`Your CleanStart partner manager, ${manager.team.replace("CleanStart ", "")}. Replies come to your email.`}
      lead={<span className="av av-2">{initialsOf(manager.name)}</span>}
      onSubmit={send}
      footer={
        <>
          <span className="hint">Sent from {senderEmail}</span>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            <Icon name="send" />
            Send
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="mm-subject" className="lbl">
          Subject
        </label>
        <input
          id="mm-subject"
          className="field"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="fg">
        <label htmlFor="mm-body" className="lbl">
          Message
        </label>
        <textarea
          id="mm-body"
          ref={bodyRef}
          className={`field${invalid ? " field-err" : ""}`}
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={invalid || undefined}
        />
        {invalid ? <span className="err">Write a message first.</span> : null}
      </div>
    </Drawer>
  );
}
