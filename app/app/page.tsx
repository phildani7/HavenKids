import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { HavenApp } from "@/components/HavenApp";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <HavenApp
      session={{
        email: session.user.email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }}
      onSignOut={handleSignOut}
    />
  );
}
