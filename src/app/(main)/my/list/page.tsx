import type { Metadata } from "next";
import { TaskList } from "~/app/_components/TaskList";
import { titles } from "~/app/_util/titles";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
    title: titles.list,
}

export default async function ListPage() {
  await api.task.allGroups.prefetch();

  return <TaskList />;
}
