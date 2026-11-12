import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function PartnerIndex(): never {
  redirect(ROUTES.partner.overview);
}
