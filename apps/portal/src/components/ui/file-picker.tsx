"use client";

import { useRef } from "react";
import { Icon } from "../icon";

interface FilePickerProps {
  id: string;
  accept: string;
  file: File | null;
  onPick: (file: File | null) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  ariaDescribedBy?: string | undefined;
}

/** A choose-file button with the picked name beside it, in place of the browser's file input. The operating system's own file window still opens. */
export function FilePicker({ id, accept, file, onPick, disabled, invalid, ariaDescribedBy }: FilePickerProps): React.JSX.Element {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={`fp${invalid ? " field-err" : ""}`}>
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <button type="button" id={id} className="btn btn-s" disabled={disabled} aria-describedby={ariaDescribedBy} onClick={() => input.current?.click()}>
        <Icon name="upload" />
        {file ? "Replace" : "Choose file"}
      </button>
      <span className={`fp-name${file ? "" : " fp-none"}`}>{file ? file.name : "No file chosen"}</span>
      {file && !disabled ? (
        <button type="button" className="fp-x" aria-label={`Remove ${file.name}`} onClick={() => onPick(null)}>
          <Icon name="x" />
        </button>
      ) : null}
    </div>
  );
}
