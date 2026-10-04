// Specialities a member can choose in the profile. The key is stored in the database, labels are per language.
export const SPECIALTIES = [
  { key: "general", ro: "Medicină dentară generală", en: "General dentistry" },
  { key: "implantology", ro: "Implantologie", en: "Implantology" },
  { key: "oms", ro: "Chirurgie oro-maxilo-facială", en: "Oral and maxillofacial surgery" },
  { key: "perio", ro: "Parodontologie", en: "Periodontology" },
  { key: "endo", ro: "Endodonție", en: "Endodontics" },
  { key: "ortho", ro: "Ortodonție", en: "Orthodontics" },
  { key: "prosth", ro: "Protetică dentară", en: "Prosthodontics" },
  { key: "aesthetic", ro: "Estetică dentară", en: "Aesthetic dentistry" },
  { key: "pedo", ro: "Pedodonție", en: "Pediatric dentistry" },
  { key: "radiology", ro: "Radiologie dentară", en: "Dental radiology" },
  { key: "other", ro: "Altă specialitate", en: "Other" },
] as const;

export const SPECIALTY_KEYS = SPECIALTIES.map((s) => s.key);

export function specialtyLabel(key: string | null | undefined, locale: string) {
  const s = SPECIALTIES.find((x) => x.key === key);
  return s ? (locale === "en" ? s.en : s.ro) : "";
}
