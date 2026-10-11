"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }

      void user.getIdToken().then(async (token) => {
        const response = await fetch("/api/admin/access", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setChecking(false);
          return;
        }
        await signOut(auth);
        router.replace("/admin/login?error=unauthorized");
      }).catch(() => {
        void signOut(auth);
        router.replace("/admin/login?error=unauthorized");
      });
    });

    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-violet-50">
        <div className="text-center">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-violet-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
