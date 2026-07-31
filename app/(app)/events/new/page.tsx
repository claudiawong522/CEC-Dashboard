import { ToggleForm } from "@/components/events/ToggleForm";
import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon } from "@/components/stickers/shapes";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ media?: string }>;
}) {
  const { media } = await searchParams;

  return (
    <div className="relative flex flex-col gap-[19px]">
      <Sticker
        floatVariant="float2"
        floatDuration="15s"
        wrapperClassName="pointer-events-none absolute -top-4 right-[6%] z-0"
        className="pointer-events-auto opacity-[0.35]"
      >
        <StarPolygon size={70} />
      </Sticker>
      <div className="flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          New event
        </h1>
        <p className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
          Step 1 of 2
        </p>
      </div>
      <ToggleForm defaultMediaOn={media === "1"} />
    </div>
  );
}
