import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { getCurrentUser, getLang } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const lang = getLang();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar lang={lang} activeRole={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar lang={lang} currentUser={{ name: user.name, role: user.role, avatarInitials: user.avatarInitials }} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
