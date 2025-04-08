import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
} from "flowbite-react";
import type { FC } from "react";
import { TaskList } from "~/app/_components/TaskList";
import type { NextServerComponent } from "~/app/_util/NextTypes";
import { api } from "~/trpc/server";

const ListPage: NextServerComponent = async (props) => {
  const tasks = await api.task.all();
  
  return <TaskList initialTasks={tasks}/>
};
export default ListPage;
