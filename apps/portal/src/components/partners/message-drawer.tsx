"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Avatar } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { initialsOf } from "@/data/partners";

interface MessageDrawerProps {
  open: boolean;
  onClose: () => void;
  manager: string;
  team: string;
  subject: string;
  from: string;
}

/** Same form as the shell's partner-manager message drawer, opened from the Company page. */
export function MessageDrawer({ open, onClose, manager, team, subject, from }: MessageDrawerProps): React.JSX.Element | null {
  const toast = useToast();
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [subjectText, setSubjectText] = useState(subject);
  const invalid = tried && !body.trim();

  const close = (): void => {
    setBody("");
    setTried(false);
    onClose();
  };

  const send = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!body.trim()) {
      setTried(true);
      return;
    }
    toast(`Message sent to ${manager}`);
    close();
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      onSubmit={send}
      title={`Message ${manager}`}
      subtitle={`Your CleanStart partner manager, ${team}. Replies come to your email.`}
      lead={<Avatar initials={initialsOf(manager)} />}
      footer={
        <>
          <span className="hint">Sent from {from}</span>
          <button type="button" className="btn btn-s" onClick={close}>
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
        <label htmlFor="co-msg-s" className="lbl">
          Subject
        </label>
        <input
          id="co-msg-s"
          className="field"
          type="text"
          value={subjectText}
          onChange={(e) => setSubjectText(e.target.value)}
        />
      </div>
      <div className="fg">
        <label htmlFor="co-msg-b" className="lbl">
          Message
        </label>
        <textarea
          id="co-msg-b"
          className={`field${invalid ? " field-err" : ""}`}
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? "co-msg-err" : undefined}
        />
        {invalid ? (
          <span id="co-msg-err" className="err">
            Write a message first.
          </span>
        ) : null}
      </div>
    </Drawer>
  );
}
