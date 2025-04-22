import type { Metadata } from "next";
import { TaskListPage } from "~/app/_pages/TaskListPage";
import { titles } from "~/app/_util/titles";
import { auth, requireAuth, signIn } from "~/server/auth";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: titles.list,
};

export default async function ListPage() {
  await requireAuth();
  
  await api.task.allGroups.prefetch();
  await api.notifications.allTargets.prefetch();

  return <TaskListPage />;
}
