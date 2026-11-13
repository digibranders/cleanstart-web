'use client';

import { useCallback, useState } from 'react';
import { Dialog } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import { DOC_PRODUCT_LABEL, type DocProduct } from '@/lib/domain';
import { requestMaterialAction } from '@/server/actions/documents';

/** The mock's order: All products first. */
const PRODUCT_ORDER: readonly DocProduct[] = ['all', 'images', 'libraries', 'cleansight'];

export function RequestMaterialDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const [text, setText] = useState('');
  const [product, setProduct] = useState<DocProduct>('all');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalid = tried && text.trim() === '';

  const close = useCallback((): void => {
    setTried(false);
    setError(null);
    onClose();
  }, [onClose]);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    if (text.trim() === '') {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await requestMaterialAction({ request: text.trim(), product });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setText('');
    setTried(false);
    onClose();
    toast('Request sent to CleanStart');
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      onSubmit={submit}
      title="Request material"
      subtitle="Ask CleanStart for a document you need to sell."
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={close}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            {busy ? 'Sending' : 'Send request'}
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="req-text" className="lbl">
          What do you need?
        </label>
        <textarea
          id="req-text"
          className={`field${invalid ? ' field-err' : ''}`}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? 'req-text-err' : undefined}
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {invalid ? (
          <span className="err" id="req-text-err">
            Describe the material you need.
          </span>
        ) : null}
      </div>
      <div className="fg">
        <span id="req-p" className="lbl">
          For which product
        </span>
        <div
          className="seg"
          role="group"
          aria-labelledby="req-p"
          style={{ alignSelf: 'flex-start' }}
        >
          {PRODUCT_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              className={`seg-b${p === product ? ' seg-on' : ''}`}
              aria-pressed={p === product}
              disabled={busy}
              onClick={() => setProduct(p)}
            >
              {DOC_PRODUCT_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <div className="note note-amber" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
    </Dialog>
  );
}
