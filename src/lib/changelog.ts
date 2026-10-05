export type ChangelogCategory = "navigare" | "invatare" | "comunitate" | "notificari" | "profil" | "aspect";

export const CHANGELOG_CATEGORIES: { key: ChangelogCategory; ro: string; en: string }[] = [
  { key: "invatare", ro: "Învățare", en: "Learning" },
  { key: "comunitate", ro: "Comunitate", en: "Community" },
  { key: "profil", ro: "Cont și profil", en: "Account and profile" },
  { key: "notificari", ro: "Notificări", en: "Notifications" },
  { key: "navigare", ro: "Navigare și ajutor", en: "Navigation and help" },
  { key: "aspect", ro: "Aspect și limbă", en: "Look and language" },
];

export type ChangelogEntry = { date: string; category: ChangelogCategory; title: { ro: string; en: string }; text: { ro: string; en: string } };

// Newest first. Dates are ISO (YYYY-MM-DD).
export const changelog: ChangelogEntry[] = [
  {
    date: "2026-10-05",
    category: "navigare",
    title: { ro: "Meniu nou în antet", en: "New header menu" },
    text: {
      ro: "Meniurile Învață, Comunitate și Ajutor îți duc direct la categorii, colecții și întrebări frecvente. Pe Învață vezi câte resurse noi nu ai deschis încă.",
      en: "The Learn, Community and Help menus take you straight to categories, collections and the FAQ. Learn shows how many new resources you have not opened yet.",
    },
  },
  {
    date: "2026-10-05",
    category: "navigare",
    title: { ro: "Întrebări frecvente mai ușor de folosit", en: "A friendlier FAQ" },
    text: {
      ro: "Caută în întrebări, alege o categorie și deschide direct răspunsul. Multe răspunsuri au un buton spre locul din platformă unde rezolvi.",
      en: "Search the questions, pick a category and open the answer right away. Many answers have a button to the place in the platform where you can sort it out.",
    },
  },
  {
    date: "2026-10-05",
    category: "invatare",
    title: { ro: "Videoclipul direct în listă", en: "Video right in the list" },
    text: {
      ro: "La webinarii pornești videoclipul chiar din listă, fără să mai deschizi pagina resursei.",
      en: "For webinars you can start the video right from the list, without opening the resource page.",
    },
  },
  {
    date: "2026-10-05",
    category: "invatare",
    title: { ro: "Notițe personale", en: "Personal notes" },
    text: {
      ro: "Scrie notițe private sub fiecare resursă. Le regăsești pe toate în profil, la Notițe.",
      en: "Write private notes under each resource. You can find them all in your profile, under Notes.",
    },
  },
  {
    date: "2026-10-05",
    category: "profil",
    title: { ro: "Profil nou, cu statistici", en: "New profile with statistics" },
    text: {
      ro: "Profilul are acum secțiuni, progres total, zile active și o hartă a activității tale din ultimele 26 de săptămâni.",
      en: "Your profile now has sections, overall progress, active days and a map of your activity over the last 26 weeks.",
    },
  },
  {
    date: "2026-10-05",
    category: "profil",
    title: { ro: "Obiectiv săptămânal", en: "Weekly goal" },
    text: {
      ro: "Alege câte resurse vrei să deschizi pe săptămână și urmărește-ți progresul. Se resetează lunea.",
      en: "Choose how many resources you want to open each week and follow your progress. It resets on Monday.",
    },
  },
  {
    date: "2026-10-05",
    category: "profil",
    title: { ro: "Descarcă datele tale", en: "Download your data" },
    text: {
      ro: "Din profil, la Setări, poți descărca tot ce păstrăm despre tine, și poți cere schimbarea adresei de email.",
      en: "From your profile, under Settings, you can download everything we keep about you, and request an email address change.",
    },
  },
  {
    date: "2026-10-04",
    category: "profil",
    title: { ro: "Progres pe categorii", en: "Progress by category" },
    text: {
      ro: "În profil vezi câte resurse ai terminat în fiecare categorie, de unde poți continua și câte zile la rând ai fost activ.",
      en: "In your profile you can see how many resources you completed in each category, where to continue and how many days in a row you were active.",
    },
  },
  {
    date: "2026-10-04",
    category: "notificari",
    title: { ro: "Urmărește categorii", en: "Follow categories" },
    text: {
      ro: "Urmărește categoriile care te interesează și primești notificări doar pentru resursele noi din ele. Răspunsurile la comentarii rămân mereu active.",
      en: "Follow the categories you care about and get notifications only for new resources in them. Replies to your comments always stay on.",
    },
  },
  {
    date: "2026-10-04",
    category: "comunitate",
    title: { ro: "Sondaje pe pagina principală", en: "Polls on the home page" },
    text: {
      ro: "Votează în sondajul curent direct din pagina principală și vezi imediat rezultatele comunității.",
      en: "Vote in the current poll right on the home page and see the community results straight away.",
    },
  },
  {
    date: "2026-10-04",
    category: "invatare",
    title: { ro: "Videoclipuri populare", en: "Popular videos" },
    text: {
      ro: "Pe pagina principală găsești un rând cu cele mai vizionate videoclipuri.",
      en: "The home page now has a row with the most watched videos.",
    },
  },
  {
    date: "2026-10-04",
    category: "notificari",
    title: { ro: "Notificări pentru răspunsuri", en: "Notifications for replies" },
    text: {
      ro: "Primești o notificare când cineva răspunde la comentariul tău, în clopoțel și pe pagina de notificări.",
      en: "You get a notification when someone replies to your comment, in the bell menu and on the notifications page.",
    },
  },
  {
    date: "2026-10-04",
    category: "invatare",
    title: { ro: "Mod concentrare pentru articole", en: "Focus mode for articles" },
    text: {
      ro: "Citește articolele fără distrageri, cu text mai larg și fără elemente laterale.",
      en: "Read articles without distractions, with wider text and no side elements.",
    },
  },
  {
    date: "2026-10-04",
    category: "aspect",
    title: { ro: "Temă luminoasă, întunecată sau automată", en: "Light, dark or automatic theme" },
    text: {
      ro: "Alege tema din meniul contului: luminoasă, întunecată sau în funcție de setările dispozitivului.",
      en: "Pick your theme from the account menu: light, dark or following your device settings.",
    },
  },
  {
    date: "2026-10-04",
    category: "navigare",
    title: { ro: "Tur ghidat și meniul avatarului", en: "Guided tour and avatar menu" },
    text: {
      ro: "Un tur scurt îți arată principalele zone ale platformei. Din meniul avatarului ajungi rapid la profil, temă și ieșire din cont.",
      en: "A short tour shows you the main areas of the platform. The avatar menu gives quick access to your profile, theme and sign out.",
    },
  },
  {
    date: "2026-10-04",
    category: "profil",
    title: { ro: "Dispozitive conectate", en: "Connected devices" },
    text: {
      ro: "În profil vezi dispozitivele conectate și poți închide sesiunea de pe un singur dispozitiv.",
      en: "In your profile you can see your connected devices and sign out of a single device.",
    },
  },
  {
    date: "2026-10-04",
    category: "profil",
    title: { ro: "Profil cu specialitate și oraș", en: "Profile with speciality and city" },
    text: {
      ro: "Completează specialitatea și orașul în profil, ca să ne ajuți să îți oferim conținut potrivit.",
      en: "Add your speciality and city to your profile to help us offer you relevant content.",
    },
  },
  {
    date: "2026-10-04",
    category: "aspect",
    title: { ro: "Platforma în limba engleză", en: "English version of the platform" },
    text: {
      ro: "Platforma poate fi folosită și în engleză. Schimbi limba oricând din comutatorul de limbă.",
      en: "The platform is now available in English. Change the language at any time with the language switch.",
    },
  },
];
