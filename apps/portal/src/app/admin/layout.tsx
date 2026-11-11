import { Shell } from "@/components/shell/shell";

export default function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Shell kind="admin">{children}</Shell>;
}
