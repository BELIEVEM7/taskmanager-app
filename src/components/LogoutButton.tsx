"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", "POST");
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={logout}>
      Log out
    </Button>
  );
}