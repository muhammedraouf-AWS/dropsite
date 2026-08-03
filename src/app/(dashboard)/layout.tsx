import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { isAdminEmail } from "@/features/admin/service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          DropSite
        </Link>
        <div className="flex items-center gap-4">
          {isAdminEmail(session.user.email) && (
            <Link href="/dashboard/admin" className="text-sm font-medium underline">
              Admin
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
