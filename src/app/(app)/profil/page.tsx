import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Card, LinkButton, PageTitle } from "@/components/ui";
import { ProfileForm } from "./profile-form";
import { t } from "@/lib/texts";

export const metadata: Metadata = { title: t.profile.title };

export default async function ProfilePage() {
  const viewer = await requireUser();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <PageTitle title={t.profile.title} />
      <Card>
        <ProfileForm firstName={viewer.firstName} lastName={viewer.lastName} email={viewer.email} />
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{t.profile.changePassword}</h2>
          <p className="mt-1 text-sm text-muted">Alege o parolă nouă de cel puțin 10 caractere.</p>
        </div>
        <LinkButton href="/setare-parola" variant="secondary">{t.profile.changePassword}</LinkButton>
      </Card>
    </div>
  );
}
