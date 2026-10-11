export default function Loading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-8 w-48 animate-pulse bg-muted/60" />
      <div className="h-1 w-20 bg-mint" />
      <div className="mt-4 h-40 w-full animate-pulse border border-line bg-muted/30" />
    </div>
  );
}
