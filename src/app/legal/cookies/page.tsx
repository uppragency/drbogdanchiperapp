import type { Metadata } from "next";
import { COMPANY, LegalPage, P, Section, UL } from "../doc";

export const metadata: Metadata = { title: "Politica de cookies" };

// TODO inainte de lansare: text de lucru, de validat juridic. Daca se adauga analytics sau marketing, adauga bannerul de consimtamant si actualizeaza tabelul.
const ROWS: [string, string, string, string][] = [
  ["sb-…-auth-token", "Cookie", "Menține sesiunea ta autentificată.", "Sesiune / până la deconectare"],
  ["lang", "Cookie", "Reține limba aleasă (română sau engleză).", "1 an"],
  ["theme", "Stocare locală", "Reține tema aleasă (deschisă, închisă sau automată).", "Până la ștergere"],
  ["Bannere și sfaturi închise", "Stocare locală", "Reține bannerele și sfaturile pe care le-ai închis, ca să nu reapară.", "Până la ștergere"],
  ["Service worker", "Tehnologie browser", "Permite instalarea ca aplicație și primirea notificărilor push, doar dacă le activezi.", "Până la dezinstalare"],
];

export default function Page() {
  return (
    <LegalPage title="Politica de cookies">
      <Section title="1. Ce sunt cookie-urile">
        <P>Cookie-urile sunt fișiere mici salvate în browserul tău când vizitezi un site. Folosim, în același scop, și stocarea locală a browserului (localStorage).</P>
      </Section>
      <Section title="2. Ce folosim pe această Platformă">
        <P>Platforma folosește doar tehnologii strict necesare funcționării serviciului sau cerute de tine (limba, tema, sesiunea). Nu folosim cookie-uri de analiză, de publicitate sau de urmărire de către terți. Pentru cele strict necesare nu este necesar consimțământul, conform legislației aplicabile (Legea nr. 506/2004 și GDPR).</P>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-3">Nume</th><th className="p-3">Tip</th><th className="p-3">Scop</th><th className="p-3">Durată</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r[0]} className="border-t border-line align-top">
                  <td className="p-3 font-semibold">{r[0]}</td><td className="p-3">{r[1]}</td><td className="p-3">{r[2]}</td><td className="p-3">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="3. Conținut încorporat">
        <P>Materialele video pot fi redate prin playere ale unor furnizori de găzduire video. La pornirea redării, acești furnizori pot salva propriile cookie-uri sau pot primi date tehnice (de exemplu adresa IP), conform politicilor lor.</P>
      </Section>
      <Section title="4. Cum le poți controla">
        <UL items={[
          "Poți șterge sau bloca cookie-urile din setările browserului. Fără cookie-ul de sesiune nu te poți autentifica.",
          "Tema și limba se pot schimba oricând din antetul paginii.",
          "Notificările push se opresc din pagina de profil sau din setările dispozitivului.",
        ]} />
      </Section>
      <Section title="5. Modificări și contact">
        <P>Dacă vom introduce alte tehnologii (de exemplu statistici de utilizare), vom actualiza această politică și vom cere consimțământul tău înainte, acolo unde legea o impune. Întrebări: {COMPANY.email}. Vezi și Politica de confidențialitate.</P>
      </Section>
    </LegalPage>
  );
}
