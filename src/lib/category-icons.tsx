import type { IconProps } from "@phosphor-icons/react";
import { BookOpen, ChatsCircle, FolderOpen, HandWaving, Megaphone, Mountains, Question, Stack, VideoCamera, SquaresFour } from "@phosphor-icons/react/dist/ssr";

const icons: Record<string, typeof SquaresFour> = {
  "discutii-generale": ChatsCircle,
  anunturi: Megaphone,
  "prezinta-te": HandWaving,
  "intrebari-si-raspunsuri": Question,
  webinarii: VideoCamera,
  "studyclub-studii-de-caz": Stack,
  bookclub: BookOpen,
  "resurse-si-formulare": FolderOpen,
  "aventura-pe-munte": Mountains,
};

export function CategoryIcon({ slug, ...props }: { slug?: string } & IconProps) {
  const Icon = (slug && icons[slug]) || SquaresFour;
  return <Icon {...props} />;
}
