"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import UserSubmitLinkModal from "@/components/UserSubmitLinkModal";
import { useAuth } from "@/hooks/useAuth";

function ShareHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const url = params.get("url") ?? params.get("text") ?? "";
  const title = params.get("title") ?? "";

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        const next = `/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      } else {
        setOpen(true);
      }
    }
  }, [loading, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <UserSubmitLinkModal
      isOpen={open}
      initialUrl={url}
      initialTitle={title}
      onClose={() => router.replace("/")}
      onSuccess={() => router.replace("/")}
    />
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareHandler />
    </Suspense>
  );
}
