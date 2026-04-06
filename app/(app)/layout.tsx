"use client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BottomNav } from "@/components/ui/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  usePushNotifications(user?.uid);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-lg mx-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}