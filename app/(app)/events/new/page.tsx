import { ToggleForm } from "@/components/events/ToggleForm";

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-[19px]">
      <div className="flex flex-col gap-[5px]">
        <h1 className="font-sans text-2xl leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          New event
        </h1>
        <p className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
          Step 1 of 2
        </p>
      </div>
      <ToggleForm />
    </div>
  );
}
