import { Shell } from "@/components/shell/shell";

export default function PartnerLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Shell kind="partner">{children}</Shell>;
}
