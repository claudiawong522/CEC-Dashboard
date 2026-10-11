import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-6">
      <PageHeader eyebrow="404" title="Not found">
        That page doesn&rsquo;t exist, or what it pointed to has been deleted.
      </PageHeader>
      <Button variant="outline" render={<Link href="/calendar" />}>
        Back to Calendar
      </Button>
    </div>
  );
}
