import { ProfilePage } from "~/app/_pages/ProfilePage";
import { titles } from "~/app/_util/titles";

export const metadata = { title: titles.profile };

export default async function Profile() {
  return <ProfilePage />;
}
