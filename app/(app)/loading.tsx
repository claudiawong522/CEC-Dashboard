export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-5 w-32 animate-pulse rounded bg-stone-100" />
      <div className="h-40 w-full animate-pulse rounded-lg bg-stone-100" />
    </div>
  );
}
