import { TaskList } from "~/app/_components/TaskList";
import type { NextServerComponent } from "~/app/_util/NextTypes";

const ListPage: NextServerComponent = async () => {
  return <TaskList/>
};
export default ListPage;
