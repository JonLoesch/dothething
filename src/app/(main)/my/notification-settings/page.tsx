import { NotificationSettingsPage } from "~/app/_pages/NotificationSettingsPage";
import { titles } from "~/app/_util/titles";

export const metadata = { title: titles.notificationSettings };

export default async function Profile() {
  return <NotificationSettingsPage />;
}
