import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/authz";
import { joinHousehold } from "@/actions/household";
import { verifyInviteToken, JoseErrors } from "@/lib/invite-token";
import { InviteLanding } from "@/components/auth/invite-landing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Einladung – RecipeScheduler",
};

function ErrorCard({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">
            RecipeScheduler
          </CardTitle>
          <CardDescription>Einladung</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive text-center">{message}</p>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorCard message="Ungültiger Einladungslink." />;
  }

  let payload: { email: string; hid: string };
  try {
    payload = await verifyInviteToken(token);
  } catch (err) {
    const isExpired = err instanceof JoseErrors.JWTExpired;
    return (
      <ErrorCard
        message={
          isExpired
            ? "Dieser Einladungslink ist abgelaufen. Bitte bitte den Einladenden, einen neuen Link zu senden."
            : "Ungültiger Einladungslink."
        }
      />
    );
  }

  const authUser = await getAuthUser();

  if (authUser) {
    if (authUser.email !== payload.email) {
      return (
        <ErrorCard
          message={`Dieser Link ist für ${payload.email} bestimmt. Du bist als ${authUser.email} eingeloggt. Bitte melde dich ab und öffne den Link erneut.`}
        />
      );
    }
    await joinHousehold(token);
    redirect("/recipes");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">
            RecipeScheduler
          </CardTitle>
          <CardDescription>
            Du wurdest eingeladen, diesem Haushalt beizutreten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteLanding invitedEmail={payload.email} token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
