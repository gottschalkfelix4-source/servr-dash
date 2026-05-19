import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="transition-all duration-150 lg:pl-56">
        <TopBar />
        <main className="mx-auto w-full max-w-[1500px] p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
