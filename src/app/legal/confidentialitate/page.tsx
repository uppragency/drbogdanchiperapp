import type { Metadata } from "next";
import { COMPANY, LegalPage, P, Section, UL } from "../doc";

export const metadata: Metadata = { title: "Politica de confidențialitate" };

// TODO inainte de lansare: text de lucru, de validat juridic.
export default function Page() {
  return (
    <LegalPage title="Politica de confidențialitate">
      <Section title="1. Operatorul datelor">
        <P>Operatorul datelor tale personale este {COMPANY.name}, cu sediul în {COMPANY.address}, CUI {COMPANY.cui}. Prelucrăm datele conform Regulamentului (UE) 2016/679 („GDPR”) și legislației române aplicabile. Contact pentru orice solicitare privind datele: {COMPANY.email}.</P>
      </Section>
      <Section title="2. Ce date prelucrăm">
        <UL items={[
          "Date de cont: nume, prenume, adresă de email, parolă (stocată doar criptat, nu o putem vedea), rol și perioada de acces.",
          "Date de profil completate de tine: specializare și oraș. Acestea pot fi afișate în dreptul comentariilor tale.",
          "Conținut generat de tine: comentarii și răspunsuri postate în Platformă.",
          "Date de utilizare: resursele vizualizate, progresul pe categorii, favorite, categoriile urmărite, căutările efectuate, notificările citite.",
          "Date despre dispozitive și sesiuni: tipul dispozitivului și al browserului (dedus din user agent), momentul ultimei activități, necesare pentru limita de două dispozitive.",
          "Abonarea la notificări push, dacă o activezi: identificatorul tehnic al abonării din browserul sau aplicația instalată.",
          "Date tehnice din jurnale de server: adresă IP, data și ora cererii, erori, folosite pentru securitate și depanare.",
          "Corespondența cu noi, dacă ne scrii.",
        ]} />
        <P>Nu solicităm și nu ar trebui să postezi date medicale ale pacienților. Dacă ai nevoie să discuți un caz, anonimizează-l complet.</P>
      </Section>
      <Section title="3. Scopurile și temeiurile prelucrării">
        <UL items={[
          "Crearea și administrarea contului, acordarea accesului la program (executarea contractului, art. 6 alin. 1 lit. b GDPR).",
          "Funcționarea Platformei: autentificare, limita de dispozitive, afișarea conținutului, progres, favorite (executarea contractului și interesul legitim de a oferi serviciul, art. 6 alin. 1 lit. b și f).",
          "Comunitatea: afișarea și moderarea comentariilor (interes legitim, art. 6 alin. 1 lit. f).",
          "Securitate, prevenirea abuzurilor și a partajării neautorizate a conturilor (interes legitim, art. 6 alin. 1 lit. f).",
          "Statistici agregate pentru îmbunătățirea conținutului, de exemplu cele mai urmărite resurse și căutări populare (interes legitim, art. 6 alin. 1 lit. f).",
          "Emailuri tranzacționale: invitație, resetare parolă, confirmări (executarea contractului, art. 6 alin. 1 lit. b).",
          "Notificări push despre conținut nou, doar dacă le activezi (consimțământ, art. 6 alin. 1 lit. a). Le poți opri oricând din profil sau din setările dispozitivului.",
          "Obligații legale, de exemplu contabile și fiscale (art. 6 alin. 1 lit. c).",
        ]} />
        <P>Nu trimitem emailuri de marketing prin Platformă și nu vindem datele tale.</P>
      </Section>
      <Section title="4. Cui transmitem datele">
        <P>Datele sunt prelucrate de furnizori de servicii care acționează în numele nostru, pe baza unor acorduri de prelucrare:</P>
        <UL items={[
          "Supabase, pentru baza de date și autentificare;",
          "Vercel, pentru găzduirea aplicației;",
          "Resend, pentru trimiterea emailurilor tranzacționale;",
          "serviciile de notificări push ale browserelor și sistemelor de operare (Apple, Google, Mozilla, Microsoft), dacă activezi notificările;",
          "furnizorul de găzduire video folosit pentru materialele din curs.",
        ]} />
        <P>Datele pot fi dezvăluite autorităților doar când legea o cere. Dacă un furnizor prelucrează date în afara Spațiului Economic European, transferul se bazează pe garanții adecvate, precum clauzele contractuale standard ale Comisiei Europene sau cadrul UE-SUA privind confidențialitatea datelor.</P>
      </Section>
      <Section title="5. Cât timp păstrăm datele">
        <UL items={[
          "Datele de cont și de profil: cât timp ai cont activ, apoi până la 3 ani de la încheierea accesului, pentru eventuale reclamații și evidența participării, după care sunt șterse sau anonimizate.",
          "Comentariile: cât timp există contul, apoi pot fi anonimizate.",
          "Sesiuni și dispozitive: cât timp sesiunea este activă, apoi se șterg în termen scurt.",
          "Jurnale tehnice: de regulă până la 90 de zile.",
          "Documente contabile: perioadele impuse de lege.",
        ]} />
      </Section>
      <Section title="6. Drepturile tale">
        <P>Ai dreptul la acces, rectificare, ștergere, restricționarea prelucrării, portabilitate și opoziție, precum și dreptul de a-ți retrage consimțământul oricând (fără efect asupra prelucrărilor anterioare). Nu luăm decizii bazate exclusiv pe prelucrare automată care să te afecteze semnificativ.</P>
        <P>Poți modifica o parte din date direct în pagina de profil. Pentru orice altă solicitare scrie-ne la {COMPANY.email}; răspundem în cel mult 30 de zile.</P>
        <P>Ai dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru 28-30, sector 1, București, dataprotection.ro.</P>
      </Section>
      <Section title="7. Securitate">
        <P>Aplicăm măsuri tehnice și organizatorice adecvate: conexiuni criptate (HTTPS), parole stocate criptat, acces restricționat pe roluri, limitarea numărului de dispozitive și a încercărilor de autentificare. Nicio metodă de transmitere sau stocare nu este însă complet lipsită de risc.</P>
      </Section>
      <Section title="8. Cookies">
        <P>Folosim doar cookie-uri și stocare locală strict necesare. Detaliile sunt în Politica de cookies.</P>
      </Section>
      <Section title="9. Modificări">
        <P>Putem actualiza această politică. Versiunea în vigoare este cea de aici, cu data ultimei actualizări.</P>
      </Section>
    </LegalPage>
  );
}
