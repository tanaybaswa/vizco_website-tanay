import { compassImage, OG_SIZE } from "@/lib/compass/og";

export const alt = "The AI Cover Compass: where do you stand on AI cover?";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return compassImage();
}
