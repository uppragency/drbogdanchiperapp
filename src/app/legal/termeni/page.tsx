import type { Metadata } from "next";
import { COMPANY, LegalPage, P, Section, UL } from "../doc";

export const metadata: Metadata = { title: "Termeni și condiții" };

// TODO inainte de lansare: text de lucru, de validat juridic.
export default function Page() {
  return (
    <LegalPage title="Termeni și condiții">
      <Section title="1. Cine suntem și despre ce este acest document">
        <P>Platforma {COMPANY.platform} („Platforma”) este operată de {COMPANY.name} („MentorMed”, „noi”). Platforma este un spațiu de curs și comunitate destinat medicilor înscriși în programul MentorMed. Prin accesarea contului și utilizarea Platformei, ești de acord cu acești termeni.</P>
      </Section>
      <Section title="2. Cine poate folosi Platforma">
        <UL items={[
          "Accesul se acordă doar participanților înscriși în program, pe bază de invitație trimisă pe email.",
          "Contul este personal și nu poate fi transmis sau împărțit cu alte persoane.",
          "Un cont poate fi folosit simultan pe cel mult două dispozitive. La o a treia autentificare, cea mai veche sesiune este închisă.",
          "Ești responsabil(ă) pentru păstrarea confidențialității parolei. Dacă bănuiești o utilizare neautorizată, ne anunți imediat la " + COMPANY.email + ".",
        ]} />
      </Section>
      <Section title="3. Durata accesului">
        <P>Accesul este valabil pe perioada stabilită la înscrierea în program. La expirarea perioadei sau la încetarea participării, contul poate fi dezactivat. Ne rezervăm dreptul de a suspenda sau închide un cont în cazul încălcării acestor termeni.</P>
      </Section>
      <Section title="4. Conținutul Platformei și drepturile de autor">
        <P>Toate materialele (videoclipuri, înregistrări de webinarii, texte, documente, imagini, studii de caz) sunt protejate de dreptul de autor și aparțin MentorMed sau partenerilor săi. Ți se acordă un drept personal, neexclusiv și netransmisibil de a le vizualiza pentru propria pregătire profesională.</P>
        <P>Nu ai voie să:</P>
        <UL items={[
          "descarci, înregistrezi, copiezi, redistribui sau publici materialele, integral sau parțial, fără acordul nostru scris;",
          "partaji datele de acces sau linkurile materialelor către persoane care nu sunt membri;",
          "folosești conținutul în scop comercial sau pentru a antrena sisteme automate;",
          "ocolești măsurile tehnice de protecție ale Platformei.",
        ]} />
      </Section>
      <Section title="5. Caracter educațional">
        <P>Conținutul are scop educațional și de dezvoltare profesională. Nu înlocuiește judecata clinică, ghidurile oficiale sau obligațiile profesionale ale medicului. Deciziile medicale luate în practica ta îți aparțin și rămân în responsabilitatea ta. Nu oferim consultanță medicală pentru pacienți prin Platformă.</P>
      </Section>
      <Section title="6. Comentarii și comunitate">
        <UL items={[
          "Ești responsabil(ă) pentru ceea ce postezi. Folosește un limbaj profesional și respectuos.",
          "Nu publica date care permit identificarea pacienților (nume, imagini identificabile, CNP, date de contact). Cazurile se discută anonimizat.",
          "Nu publica reclame, linkuri promoționale, conținut ofensator, ilegal sau care încalcă drepturi ale terților.",
          "Putem modera, ascunde sau șterge comentarii și putem restricționa accesul la comentarii fără preaviz, dacă regulile nu sunt respectate.",
          "Prin postare ne acorzi dreptul neexclusiv de a afișa comentariul în Platformă, pe durata existenței contului și a Platformei.",
        ]} />
      </Section>
      <Section title="7. Disponibilitatea Platformei">
        <P>Depunem eforturi rezonabile pentru ca Platforma să funcționeze continuu, dar nu garantăm lipsa întreruperilor (mentenanță, defecțiuni ale furnizorilor, cauze externe). Putem modifica, adăuga sau retrage materiale și funcționalități.</P>
      </Section>
      <Section title="8. Limitarea răspunderii">
        <P>În limita permisă de lege, MentorMed nu răspunde pentru daune indirecte, pierderi de venit sau de oportunități rezultate din utilizarea sau imposibilitatea utilizării Platformei. Nicio prevedere din acești termeni nu exclude răspunderea care nu poate fi exclusă prin lege.</P>
      </Section>
      <Section title="9. Date personale și cookies">
        <P>Modul în care prelucrăm datele tale este descris în Politica de confidențialitate, iar utilizarea cookie-urilor în Politica de cookies, ambele disponibile în subsolul Platformei.</P>
      </Section>
      <Section title="10. Modificări ale termenilor">
        <P>Putem actualiza acești termeni. Versiunea în vigoare este cea publicată aici, cu data ultimei actualizări. Pentru modificări importante te vom informa în Platformă. Continuarea utilizării după publicare înseamnă acceptarea noii versiuni.</P>
      </Section>
      <Section title="11. Legea aplicabilă și soluționarea litigiilor">
        <P>Acești termeni sunt guvernați de legea română. Orice neînțelegere se rezolvă amiabil, iar în lipsa unei soluții, de instanțele competente din București. Pentru soluționarea alternativă a litigiilor poți folosi și platforma europeană SOL: ec.europa.eu/consumers/odr.</P>
      </Section>
      <Section title="12. Contact">
        <P>Întrebările despre acești termeni se trimit la {COMPANY.email}.</P>
      </Section>
    </LegalPage>
  );
}
