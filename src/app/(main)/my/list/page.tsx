import { TaskList } from "~/app/_components/TaskList";
import { api } from "~/trpc/server";

export default async function ListPage() {
  await api.task.allGroups.prefetch();

  return <TaskList />;
}
