import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function NotFound(): React.JSX.Element {
  return (
    <div className="public state-page">
      <div className="state-card">
        <span className="state-code">404</span>
        <h1 className="state-h">This page does not exist</h1>
        <p className="state-p">The link may be old, or the address may have a typo.</p>
        <Link href={ROUTES.signIn} className="btn btn-p">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
