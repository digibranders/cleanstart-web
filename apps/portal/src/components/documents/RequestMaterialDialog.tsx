'use client';

import { useCallback, useState } from 'react';
import { Dialog } from '@/components/ui/overlay';
import { useToast } from '@/components/ui/toast';
import type { Product } from '@/components/ui/badge';

const PRODUCTS: readonly Product[] = [
  'All products',
  'CleanStart Images',
  'Clean Libraries',
  'CleanSight',
];

export function RequestMaterialDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const [text, setText] = useState('');
  const [product, setProduct] = useState<Product>('All products');
  const [tried, setTried] = useState(false);
  const invalid = tried && text.trim() === '';

  const close = useCallback((): void => {
    setTried(false);
    onClose();
  }, [onClose]);

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (text.trim() === '') {
      setTried(true);
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
          <button type="submit" className="btn btn-p">
            Send request
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
          {PRODUCTS.map((p) => (
            <button
              key={p}
              type="button"
              className={`seg-b${p === product ? ' seg-on' : ''}`}
              aria-pressed={p === product}
              onClick={() => setProduct(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
