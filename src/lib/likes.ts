// Like-urile se dau doar pe resursele din categoriile meniului Învață.
export const LIKE_CATEGORIES = ["webinarii", "studyclub-studii-de-caz", "resurse-si-formulare", "bookclub"] as const;
export const canLike = (slug?: string | null) => Boolean(slug) && (LIKE_CATEGORIES as readonly string[]).includes(slug as string);
