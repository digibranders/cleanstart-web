"use client";

import { useState } from "react";
import { Icon } from "../icon";
import type { Persona } from "../shell/personas";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";

/** The "Message your partner manager" drawer, opened from a screen with a subject already filled in. */
export function ManagerMessageDrawer({
  persona,
  initialSubject,
  onClose,
}: {
  persona: Persona;
  initialSubject: string;
  onClose: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const manager = persona.manager;
  if (!manager) return null;
  const invalid = tried && !body.trim();

  const send = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!body.trim()) {
      setTried(true);
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
      lead={<span className="av av-2">{manager.initials}</span>}
      onSubmit={send}
      footer={
        <>
          <span className="hint">
            Sent from {persona.user.toLowerCase().replace(" ", ".")}@{persona.org.toLowerCase().replace(/\s+/g, "")}.com
          </span>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p">
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
