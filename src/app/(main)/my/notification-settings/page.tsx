import { NotificationSettingsPage } from "~/app/_pages/NotificationSettingsPage";
import { titles } from "~/app/_util/titles";
import { auth, requireAuth, signIn } from "~/server/auth";
import { getQueryClient, trpc } from "~/trpc/server";

export const metadata = { title: titles.notificationSettings };

export default async function NotificationSettings() {
  await requireAuth();

  await getQueryClient().prefetchQuery(trpc.notifications.allTargets.queryOptions());

  return <NotificationSettingsPage />;
}
