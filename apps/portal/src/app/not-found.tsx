import type { Metadata } from "next";
import Link from "next/link";
import { backLink } from "./not-found-link";

export const metadata: Metadata = { title: "Page not found" };

export default async function NotFound(): Promise<React.JSX.Element> {
  const back = await backLink();
  return (
    <main className="public state-page">
      <div className="state-card">
        <span className="state-code">404</span>
        <h1 className="state-h">This page does not exist</h1>
        <p className="state-p">The link may be old, or the address may have a typo.</p>
        <Link href={back.href} className="btn btn-p">
          {back.label}
        </Link>
      </div>
    </main>
  );
}
