# Platforma MentorMed

Platformă de curs pentru membri, la `platforma.drbogdanchiper.ro`. Next.js 16, Supabase (Auth, Postgres cu RLS, Storage), Resend, Vercel.

## Variabile de mediu (Vercel, Production și Preview)

| Variabilă | Valoare |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | https://cvzsuggmfyrynqnronol.supabase.co |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | cheia publishable din Supabase, API Keys |
| SUPABASE_SERVICE_ROLE_KEY | cheia secret din Supabase, API Keys (doar pe server) |
| RESEND_API_KEY | cheia Resend cu drept de trimitere |
| EMAIL_FROM | MentorMed <platforma@drbogdanchiper.ro> |
| NEXT_PUBLIC_SITE_URL | https://platforma.drbogdanchiper.ro |
| ADMIN_NOTIFY_EMAIL | Opțional. Email-ul care primește notificări pentru cereri de acces și mesaje de contact |
| NEXT_PUBLIC_SENTRY_DSN | Opțional. Fără el, raportarea erorilor este oprită |

## Pași de lansare

1. Vercel: importă proiectul, adaugă variabilele, adaugă domeniul `platforma.drbogdanchiper.ro` (CNAME `platforma` către `cname.vercel-dns.com`).
2. Resend: verifică domeniul `drbogdanchiper.ro` (SPF, DKIM, DMARC) înainte de prima invitație.
3. Supabase, Authentication, URL Configuration: Site URL `https://platforma.drbogdanchiper.ro`, Redirect URL `https://platforma.drbogdanchiper.ro/**`.
4. Supabase, Authentication, Providers, Email: dezactivează înscrierea publică (Allow new users to sign up: off), setează expirarea OTP la 86400 secunde.
5. Primul admin: creează un cont în Supabase Auth, apoi în SQL Editor: `update public.profiles set role = 'admin' where email = 'EMAILUL_TAU';`. La prima intrare în Administrare se activează verificarea în doi pași.
6. Înlocuiește textele provizorii din `src/app/legal/*` cu cele validate juridic.
7. Import: Administrare, Useri, Import CSV (email, prenume, nume, taguri). Apoi Invitații, câte 30 pe apăsare (limita zilnică Resend gratuit este de 100).

## Dezvoltare

```
cp .env.example .env.local   # completează cheile
npm install
npm run dev
```

Textele interfeței sunt în `src/lib/texts.ts`. Schema bazei de date este aplicată prin migrațiile din proiectul Supabase.

## Securitate

- RLS pe toate tabelele, vizibilitatea resurselor se decide în baza de date pe baza grupurilor MentorMed.
- Maximum 2 sesiuni active per cont, limitare de încercări la autentificare, parole de minimum 10 caractere verificate la HIBP.
- Administrarea cere verificare în doi pași (TOTP).
- Fișierele sunt într-un bucket privat, servite prin linkuri semnate de 60 de secunde.
