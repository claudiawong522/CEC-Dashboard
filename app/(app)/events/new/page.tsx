import { ToggleForm } from "@/components/events/ToggleForm";
import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon } from "@/components/stickers/shapes";

export default function NewEventPage() {
  return (
    <div className="relative flex flex-col gap-[19px]">
      <Sticker
        floatVariant="float2"
        floatDuration="15s"
        wrapperClassName="pointer-events-none absolute -top-3 right-[8%] z-0"
        className="pointer-events-auto opacity-[0.12]"
      >
        <StarPolygon size={40} />
      </Sticker>
      <div className="flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
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
