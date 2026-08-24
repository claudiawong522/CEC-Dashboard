// The CEC mark, exactly as it appears on the club site and the old dashboard:
// a triangle subdivided into smaller triangles, warm at the top and cooling
// through green to teal, with the centre cut out in white.
//
// The colours are literal rather than brand tokens on purpose. These are the
// logo's own values, not the app's palette, and they must not shift if the
// palette is ever retuned. Keep in sync with app/icon.svg.
//
// viewBox is cropped to the artwork's own bounds (x 28..172, y 43..175) rather
// than the source file's 200x200 canvas, so the mark fills whatever box it is
// given instead of floating in a square of padding.
const TILES: { points: string; fill: string }[] = [
  { points: "82,43 64,76 100,76", fill: "#E8B830" },
  { points: "82,43 118,43 100,76", fill: "#F7DC6F" },
  { points: "118,43 100,76 136,76", fill: "#F0D060" },
  { points: "64,76 46,109 82,109", fill: "#D4A84B" },
  { points: "64,76 100,76 82,109", fill: "#C8956E" },
  { points: "100,76 136,76 118,109", fill: "#B5C96A" },
  { points: "136,76 118,109 154,109", fill: "#8CBF78" },
  { points: "46,109 28,142 64,142", fill: "#C43A57" },
  { points: "46,109 82,109 64,142", fill: "#D95070" },
  { points: "118,109 154,109 136,142", fill: "#40B5A0" },
  { points: "154,109 136,142 172,142", fill: "#2A9D8F" },
  { points: "28,142 64,142 46,175", fill: "#E06070" },
  { points: "64,142 46,175 82,175", fill: "#D87580" },
  { points: "64,142 100,142 82,175", fill: "#E0A090" },
  { points: "100,142 82,175 118,175", fill: "#D8C0A0" },
  { points: "100,142 136,142 118,175", fill: "#A0C8A0" },
  { points: "136,142 118,175 154,175", fill: "#50B8A0" },
  { points: "136,142 172,142 154,175", fill: "#30A090" },
];

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="28 43 144 132" className={className} fill="none" aria-hidden="true">
      {TILES.map((tile) => (
        <polygon key={tile.points} points={tile.points} fill={tile.fill} />
      ))}
      {/* The hollow centre, drawn last so it sits over the tiles it cuts. */}
      <polygon points="100,76 64,142 136,142" fill="white" />
    </svg>
  );
}
