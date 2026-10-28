// Public roadmap. Edit this list to change the page; no database involved.
export type RoadmapStage = "now" | "next" | "considering";

export const ROADMAP_STAGES: { key: RoadmapStage; ro: string; en: string; hint: { ro: string; en: string } }[] = [
  { key: "now", ro: "În lucru", en: "In progress", hint: { ro: "Se lucrează la ele acum.", en: "Being worked on now." } },
  { key: "next", ro: "Urmează", en: "Up next", hint: { ro: "Sunt decise și urmează după cele din lucru.", en: "Decided and coming after what is in progress." } },
  { key: "considering", ro: "Luăm în calcul", en: "Under consideration", hint: { ro: "Idei care depind de feedback-ul vostru. Nu sunt promisiuni.", en: "Ideas that depend on your feedback. Not promises." } },
];

export type RoadmapItem = { stage: RoadmapStage; title: { ro: string; en: string }; text: { ro: string; en: string } };

export const roadmap: RoadmapItem[] = [
  {
    stage: "now",
    title: { ro: "Conținut nou în platformă", en: "New content in the platform" },
    text: { ro: "Înregistrări video și materiale noi pentru MentorMed 13, adăugate pe măsură ce sunt gata.", en: "New video recordings and materials for MentorMed 13, added as they are ready." },
  },
  {
    stage: "next",
    title: { ro: "Anul tău în MentorMed", en: "Your year in MentorMed" },
    text: { ro: "Apare în profil în decembrie, cu zile active, resurse terminate și categoria preferată.", en: "Appears in your profile in December, with active days, completed resources and your favourite category." },
  },
  {
    stage: "considering",
    title: { ro: "Reluare video de unde ai rămas", en: "Resume video where you left off" },
    text: { ro: "Videoclipul ar porni din minutul la care te-ai oprit data trecută.", en: "The video would start from the minute where you stopped last time." },
  },
  {
    stage: "considering",
    title: { ro: "Capitole în videoclipuri", en: "Video chapters" },
    text: { ro: "Sari direct la secțiunea care te interesează dintr-un webinar lung.", en: "Jump straight to the part you need in a long webinar." },
  },
  {
    stage: "considering",
    title: { ro: "Listă „De văzut mai târziu”", en: "“Watch later” list" },
    text: { ro: "O listă separată de Favorite, pentru ce nu ai apucat să vezi.", en: "A list separate from Favourites, for what you did not get to watch yet." },
  },
];
