import { ToggleForm } from "@/components/events/ToggleForm";

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium tracking-tight">New event</h1>
        <p className="text-sm text-muted-foreground">Step 1 of 2</p>
      </div>
      <ToggleForm />
    </div>
  );
}
