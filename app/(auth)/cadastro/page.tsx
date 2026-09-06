import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function RegisterPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}