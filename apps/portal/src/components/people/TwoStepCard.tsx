"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { accountSlice } from "@/data/team";

const SHIELD =
  "M208,42H48A14,14,0,0,0,34,56v56c0,51.94,25.12,83.4,46.2,100.64,22.73,18.6,45.27,24.89,46.22,25.15a6,6,0,0,0,3.16,0c.95-.26,23.49-6.55,46.22-25.15C196.88,195.4,222,163.94,222,112V56A14,14,0,0,0,208,42Zm2,70c0,37.76-13.94,68.39-41.44,91.06A131.17,131.17,0,0,1,128,225.72a130.94,130.94,0,0,1-40.56-22.66C59.94,180.39,46,149.76,46,112V56a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2ZM172.24,99.76a6,6,0,0,1,0,8.48l-56,56a6,6,0,0,1-8.48,0l-24-24a6,6,0,0,1,8.48-8.48L112,151.51l51.76-51.75A6,6,0,0,1,172.24,99.76Z";

const BACKUP_CODES = [
  "7KQ2M9XT4B",
  "P3VN8RJ6WA",
  "D9HC2LT5QE",
  "Z4FW7NB3KM",
  "R8XA5TD2HP",
  "M6JE9QC4VL",
  "B2TY7KW8NF",
  "H5QD3PX9ZC",
  "W9LM4RB6TJ",
  "C3NF8VK2YD",
].map((code) => `${code.slice(0, 5)} ${code.slice(5)}`);

type Step = "scan" | "codes" | null;

function downloadCodes(): void {
  const blob = new Blob([`${BACKUP_CODES.join("\n")}\n`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cleanstart-backup-codes.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function TwoStepCard(): React.JSX.Element {
  const toast = useToast();
  const on = accountSlice.use().twoStepOn;
  const [step, setStep] = useState<Step>(null);
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);

  const codeInvalid = tried && !/^\d{6}$/.test(code.replace(/\s/g, ""));
  // Stable: the overlay re-focuses its first field whenever onClose changes.
  const close = useCallback((): void => setStep(null), []);

  const verify = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
      setTried(true);
      return;
    }
    accountSlice.set((prev) => ({ ...prev, twoStepOn: true }));
    setStep("codes");
    toast("Two-step sign-in is on");
  };

  const turnOff = (): void => {
    accountSlice.set((prev) => ({ ...prev, twoStepOn: false }));
    setConfirmOff(false);
    toast("Two-step sign-in is off");
  };

  return (
    <>
      <section aria-labelledby="tfa" className="card clip" data-tour="account-2fa">
        <div className="card-h">
          <h2 id="tfa" className="card-t">
            Two-step sign-in
          </h2>
          <Badge tone={on ? "accepted" : "neutral"}>{on ? "On" : "Off"}</Badge>
        </div>
        <div className="li" style={{ borderBottom: 0, alignItems: "flex-start" }}>
          <span className="li-ic">
            <Icon d={SHIELD} />
          </span>
          <span className="li-t">
            <span className="li-n">Authenticator app</span>
            <span className="li-s" style={{ whiteSpace: "normal" }}>
              {on
                ? "On since today. You enter a code from your phone after your password."
                : "Add a code from your phone after your password, so a leaked password alone cannot open your account."}
            </span>
          </span>
          {!on ? (
            <button
              type="button"
              className="btn btn-s"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                setCode("");
                setTried(false);
                setStep("scan");
              }}
            >
              Turn on
            </button>
          ) : confirmOff ? (
            <span className="acts" style={{ marginLeft: "auto" }}>
              <button type="button" className="btn btn-dd" onClick={turnOff}>
                Turn off two-step
              </button>
              <button
                type="button"
                className="act"
                onClick={() => setConfirmOff(false)}
                aria-label="Keep two-step sign-in on"
                data-tip="Cancel"
              >
                <Icon name="x" />
              </button>
            </span>
          ) : (
            <span className="acts" style={{ marginLeft: "auto" }}>
              <button type="button" className="btn btn-s" onClick={() => setStep("codes")}>
                Backup codes
              </button>
              <button type="button" className="btn btn-d" onClick={() => setConfirmOff(true)}>
                Turn off
              </button>
            </span>
          )}
        </div>
      </section>

      <Dialog
        open={step === "scan"}
        onClose={close}
        title="Turn on two-step sign-in"
        subtitle="Step 1 of 2"
        onSubmit={verify}
        footer={
          <>
            <button type="button" className="btn btn-s" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn btn-p">
              Verify
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "132px minmax(0, 1fr)", gap: 14, alignItems: "center" }}>
          <div
            role="img"
            aria-label="QR code for your authenticator app"
            style={{
              width: 132,
              height: 132,
              borderRadius: 8,
              border: "1px dashed #D9D5E6",
              background: "#FCFCFD",
              display: "grid",
              placeItems: "center",
              fontSize: 11.5,
              color: "#6B687D",
              textAlign: "center",
              padding: 10,
            }}
          >
            QR code from the server
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: "#2A2838" }}>
            <li>Open an authenticator app, such as Google Authenticator or Microsoft Authenticator.</li>
            <li>Scan the code, or type the key below.</li>
            <li>Enter the 6-digit code it shows.</li>
          </ol>
        </div>
        <div className="fg">
          <span className="lbl">Setup key</span>
          <span
            className="field tnum"
            style={{ display: "flex", alignItems: "center", background: "#FAFAFB", letterSpacing: "0.08em" }}
          >
            KQ4D 7M2X P9TB 3WNA
          </span>
        </div>
        <div className="fg">
          <label htmlFor="tfa-code" className="lbl">
            6-digit code
          </label>
          <input
            id="tfa-code"
            className={`field${codeInvalid ? " field-err" : ""}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={codeInvalid}
            aria-describedby={codeInvalid ? "tfa-err" : undefined}
            style={{ letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums" }}
          />
          {codeInvalid ? (
            <span className="err" id="tfa-err">
              Enter the 6 digits from your app.
            </span>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={step === "codes"}
        onClose={close}
        title="Save your backup codes"
        subtitle="Step 2 of 2"
        footer={
          <>
            <button
              type="button"
              className="btn btn-s"
              onClick={() => {
                downloadCodes();
                toast("Downloading cleanstart-backup-codes.txt");
              }}
            >
              Download codes
            </button>
            <button type="button" className="btn btn-p" onClick={close}>
              Done
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#4A4858" }}>
          Each code works once if you lose your phone. Keep them somewhere safe, away from this device.
        </p>
        <ul
          style={{
            margin: 0,
            padding: 12,
            listStyle: "none",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "6px 16px",
            borderRadius: 8,
            background: "#FAFAFB",
            border: "1px solid #ECEBF1",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            letterSpacing: "0.04em",
          }}
        >
          {BACKUP_CODES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
