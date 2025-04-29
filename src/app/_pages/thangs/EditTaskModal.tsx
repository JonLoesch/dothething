import type { FC } from "react";
import type { ModalRenderProps } from "react-aria-components";
import type { Task } from "./common";
import { TaskForm, FromDbObject, AsDbObject } from "./TaskForm";
import { api } from "~/trpc/react";


export const EditTaskModal: FC<ModalRenderProps & Task> = (task) => {
  const utils = api.useUtils();
  const edit = api.task.edit.useMutation({
    onSettled: () => void utils.task.allGroups.invalidate(),
    onSuccess: () => task.state.close(),
  });

  return (
    <TaskForm
      submitLabel="Save Changes"
      onCancel={() => task.state.close()}
      initialValues={FromDbObject(task)}
      onSubmit={(values) => {
        void edit.mutate({ ...AsDbObject(values), id: task.id });
      }}
    />
  );
};