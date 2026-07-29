import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3 py-12">
      <p className="text-sm font-medium">Not found.</p>
      <p className="text-xs text-muted-foreground">
        That event doesn&rsquo;t exist or may have been deleted.
      </p>
      <Button size="sm" variant="outline" render={<Link href="/calendar" />}>
        Back to Calendar
      </Button>
    </div>
  );
}
