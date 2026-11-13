"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/overlay";
import { PasswordField } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import {
  disableTwoFactorAction,
  enableTwoFactorAction,
  regenerateBackupCodesAction,
  verifyTwoFactorAction,
} from "@/server/actions/account";
import { issuesToErrors } from "@/server/actions/result";

const SHIELD =
  "M208,42H48A14,14,0,0,0,34,56v56c0,51.94,25.12,83.4,46.2,100.64,22.73,18.6,45.27,24.89,46.22,25.15a6,6,0,0,0,3.16,0c.95-.26,23.49-6.55,46.22-25.15C196.88,195.4,222,163.94,222,112V56A14,14,0,0,0,208,42Zm2,70c0,37.76-13.94,68.39-41.44,91.06A131.17,131.17,0,0,1,128,225.72a130.94,130.94,0,0,1-40.56-22.66C59.94,180.39,46,149.76,46,112V56a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2ZM172.24,99.76a6,6,0,0,1,0,8.48l-56,56a6,6,0,0,1-8.48,0l-24-24a6,6,0,0,1,8.48-8.48L112,151.51l51.76-51.75A6,6,0,0,1,172.24,99.76Z";

type Step = "password" | "scan" | "codes" | null;
type Purpose = "enable" | "disable" | "regenerate";

const PURPOSE_COPY: Record<Purpose, { title: string; subtitle: string; submit: string }> = {
  enable: {
    title: "Turn on two-step sign-in",
    subtitle: "Confirm it is you with your password first.",
    submit: "Continue",
  },
  disable: {
    title: "Turn off two-step sign-in",
    subtitle: "Confirm it is you with your password.",
    submit: "Turn off two-step",
  },
  regenerate: {
    title: "Make new backup codes",
    subtitle: "Your old codes stop working. Confirm it is you with your password.",
    submit: "Make new codes",
  },
};

function downloadCodes(codes: readonly string[]): void {
  const blob = new Blob([`${codes.join("\n")}\n`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cleanstart-backup-codes.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function TwoStepCard({ enabled }: { enabled: boolean }): React.JSX.Element {
  const toast = useToast();
  const [on, setOn] = useState(enabled);
  const [step, setStep] = useState<Step>(null);
  const [purpose, setPurpose] = useState<Purpose>("enable");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<{ setupKey: string; uri: string } | null>(null);
  const [codes, setCodes] = useState<readonly string[]>([]);

  const codeInvalid = tried && !/^\d{6}$/.test(code.replace(/\s/g, ""));
  // Stable: the overlay re-focuses its first field whenever onClose changes.
  const close = useCallback((): void => setStep(null), []);

  const ask = (next: Purpose): void => {
    setPurpose(next);
    setPassword("");
    setError(null);
    setTried(false);
    setStep("password");
  };

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!password) {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    if (purpose === "enable") {
      const result = await enableTwoFactorAction({ password });
      setBusy(false);
      if (!result.ok) return setError(issuesToErrors(result.error).password ?? result.error.message);
      setSetup({ setupKey: result.data.setupKey, uri: result.data.uri });
      setCodes(result.data.backupCodes);
      setCode("");
      setStep("scan");
    } else if (purpose === "disable") {
      const result = await disableTwoFactorAction({ password });
      setBusy(false);
      if (!result.ok) return setError(issuesToErrors(result.error).password ?? result.error.message);
      setOn(false);
      setStep(null);
      toast("Two-step sign-in is off");
    } else {
      const result = await regenerateBackupCodesAction({ password });
      setBusy(false);
      if (!result.ok) return setError(issuesToErrors(result.error).password ?? result.error.message);
      setCodes(result.data.backupCodes);
      setStep("codes");
    }
    setPassword("");
  };

  const verify = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await verifyTwoFactorAction({ code });
    setBusy(false);
    if (!result.ok) {
      setError(issuesToErrors(result.error).code ?? result.error.message);
      return;
    }
    setOn(true);
    setStep("codes");
    toast("Two-step sign-in is on");
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
                ? "You enter a code from your phone after your password."
                : "Add a code from your phone after your password, so a leaked password alone cannot open your account."}
            </span>
          </span>
          {!on ? (
            <button type="button" className="btn btn-s" style={{ marginLeft: "auto" }} onClick={() => ask("enable")}>
              Turn on
            </button>
          ) : (
            <span className="acts" style={{ marginLeft: "auto" }}>
              <button type="button" className="btn btn-s" onClick={() => ask("regenerate")}>
                New backup codes
              </button>
              <button type="button" className="btn btn-d" onClick={() => ask("disable")}>
                Turn off
              </button>
            </span>
          )}
        </div>
      </section>

      <Dialog
        open={step === "password"}
        onClose={close}
        title={PURPOSE_COPY[purpose].title}
        subtitle={PURPOSE_COPY[purpose].subtitle}
        onSubmit={submitPassword}
        footer={
          <>
            <button type="button" className="btn btn-s" onClick={close}>
              Cancel
            </button>
            <button type="submit" className={purpose === "disable" ? "btn btn-dd" : "btn btn-p"} disabled={busy}>
              {PURPOSE_COPY[purpose].submit}
            </button>
          </>
        }
      >
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          {...(tried && !password ? { error: "Enter your password." } : error ? { error } : {})}
        />
      </Dialog>

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
            <button type="submit" className="btn btn-p" disabled={busy}>
              Verify
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "132px minmax(0, 1fr)", gap: 14, alignItems: "center" }}>
          <div
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
            {setup ? (
              <a href={setup.uri} style={{ fontWeight: 600 }}>
                Open in your authenticator app
              </a>
            ) : null}
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: "#2A2838" }}>
            <li>Open an authenticator app, such as Google Authenticator or Microsoft Authenticator.</li>
            <li>Open the link on your phone, or type the key below.</li>
            <li>Enter the 6-digit code it shows.</li>
          </ol>
        </div>
        <div className="fg">
          <span className="lbl">Setup key</span>
          <span
            className="field tnum"
            style={{ display: "flex", alignItems: "center", background: "#FAFAFB", letterSpacing: "0.08em" }}
          >
            {setup?.setupKey}
          </span>
        </div>
        <div className="fg">
          <label htmlFor="tfa-code" className="lbl">
            6-digit code
          </label>
          <input
            id="tfa-code"
            className={`field${codeInvalid || error ? " field-err" : ""}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={codeInvalid || error ? true : undefined}
            aria-describedby={codeInvalid || error ? "tfa-err" : undefined}
            style={{ letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums" }}
          />
          {codeInvalid || error ? (
            <span className="err" id="tfa-err">
              {codeInvalid ? "Enter the 6 digits from your app." : error}
            </span>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={step === "codes"}
        onClose={close}
        title="Save your backup codes"
        subtitle={purpose === "enable" ? "Step 2 of 2" : "Shown once"}
        footer={
          <>
            <button
              type="button"
              className="btn btn-s"
              onClick={() => {
                downloadCodes(codes);
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
          Each code works once if you lose your phone. Keep them somewhere safe, away from this device. You will not
          see them again.
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
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
