import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DoneCheckbox } from "@/components/events/DoneCheckbox";

export function SectionCard({
  title,
  eventId,
  section,
  done,
  hideDone,
  children,
}: {
  title: string;
  eventId: string;
  section: string;
  done: boolean;
  hideDone?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-stone-200 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {!hideDone && (
          <DoneCheckbox eventId={eventId} section={section} initialDone={done} />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}
