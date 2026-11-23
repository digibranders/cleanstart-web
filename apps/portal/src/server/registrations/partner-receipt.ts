import { type DealRegion, PRODUCT_LABEL, type Product } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { sendEmail } from '@/server/email/send';
import { buildRegistrationReceived } from '@/server/email/templates';
import type { EmailAddress } from '@/server/email/transport';
import { absoluteUrl } from '@/server/urls';
import { regionNameOf } from '@/server/region-names';

export interface PartnerReceipt {
  to: EmailAddress;
  customer: string;
  products: Product[];
  region: DealRegion;
}

/** After commit. Confirms a submission to the person who made it. sendEmail never throws, so the registration stands. */
export async function sendPartnerReceipt(receipt: PartnerReceipt): Promise<void> {
  await sendEmail(
    buildRegistrationReceived({
      to: receipt.to,
      customer: receipt.customer,
      productLabel: receipt.products.map((p) => PRODUCT_LABEL[p]).join(', '),
      regionLabel: await regionNameOf(receipt.region),
      dealsUrl: absoluteUrl(ROUTES.partner.deals),
    }),
  );
}
