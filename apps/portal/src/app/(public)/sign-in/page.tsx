import type { Metadata } from "next";
import { SignIn } from "@/components/screens/SignIn";

export const metadata: Metadata = { title: "Sign in" };

export default function Page(): React.JSX.Element {
  return <SignIn />;
}
