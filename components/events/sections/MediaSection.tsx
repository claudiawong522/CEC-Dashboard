import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";

export function MediaSection({
  eventId,
  done,
  files,
}: {
  eventId: string;
  done: boolean;
  files: UploadedFile[];
}) {
  return (
    <SectionCard title="Media" eventId={eventId} section="media" done={done}>
      <p className="font-sans text-[12.5px] text-foreground/50">
        Photos, videos, and zip files dropped here also show up in Gallery.
      </p>
      <EvidenceUploader
        eventId={eventId}
        section="media"
        bucket="media"
        dropLabel="event media"
        label="Drop images, video or .zip, multiple files welcome"
        initialFiles={files}
        accept={{
          "image/*": [],
          "video/*": [],
          "application/zip": [".zip"],
          "application/x-zip-compressed": [".zip"],
        }}
      />
    </SectionCard>
  );
}
