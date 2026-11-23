import { countryName, formatDealValue } from "@/lib/deal-format";
import type { RegistrationDetailDto } from "@/lib/dto";
import { fmtLong } from "./dates";

/** The optional registration fields that are set, as label and text. Expected close and website stay with each screen's own rows. */
export function optionalFieldRows(deal: RegistrationDetailDto): Array<[string, string]> {
  const rows: Array<[string, string | null]> = [
    ["Industry", deal.customerIndustry],
    ["Country", countryName(deal.customerCountry)],
    ["Deal value", deal.dealValue === null ? null : formatDealValue(deal.dealValue, deal.currency)],
    ["Sales stage", deal.salesStage],
    ["Decision date", deal.decisionDate ? fmtLong(deal.decisionDate) : null],
    ["Competitor", deal.competitor],
    ["Use case", deal.useCase],
    ["Seats", deal.seats === null ? null : String(deal.seats)],
  ];
  return rows.filter((row): row is [string, string] => row[1] !== null && row[1] !== "");
}

export function OptionalFields({ deal }: { deal: RegistrationDetailDto }): React.JSX.Element {
  return (
    <>
      {optionalFieldRows(deal).map(([label, value]) => (
        <div key={label} style={{ display: "contents" }}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </>
  );
}

export function ConfirmationButton({ id }: { id: string }): React.JSX.Element {
  return (
    <a className="btn btn-s" href={`/api/registrations/${id}/confirmation`} download>
      Download confirmation
    </a>
  );
}
