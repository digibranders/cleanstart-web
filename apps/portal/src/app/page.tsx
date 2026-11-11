import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function Home(): never {
  redirect(ROUTES.signIn);
}
