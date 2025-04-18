import type { Metadata } from "next";
import { TaskListPage } from "~/app/_pages/TaskListPage";
import { titles } from "~/app/_util/titles";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
    title: titles.list,
}

export default async function ListPage() {
  await api.task.allGroups.prefetch();
  await api.notifications.allTargets.prefetch();

  return <TaskListPage />;
}
