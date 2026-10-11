"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-6">
      <PageHeader eyebrow="Error" title="Something went wrong">
        {error.message}
      </PageHeader>
      <Button variant="outline" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
