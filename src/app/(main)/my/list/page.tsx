import type { Metadata } from "next";
import { TaskListPage } from "~/app/_pages/TaskListPage";
import { titles } from "~/app/_util/titles";
import { auth, requireAuth, signIn } from "~/server/auth";
import { getQueryClient, trpc } from "~/trpc/server";

export const metadata: Metadata = {
  title: titles.list,
};

export default async function ListPage() {
  await requireAuth();
  
  await getQueryClient().prefetchQuery(trpc.task.allGroups.queryOptions());
  await getQueryClient().prefetchQuery(trpc.notifications.allTargets.queryOptions());

  return <TaskListPage />;
}
