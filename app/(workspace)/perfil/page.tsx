import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { getSessionUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return <ProfileView initialUser={user} />;
}