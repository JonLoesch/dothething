import type { FC } from "react";
import type { ModalRenderProps } from "react-aria-components";
import type { Task } from "./common";
import { TaskForm, FromDbObject, AsDbObject } from "./TaskForm";
import { useTRPC } from "~/trpc/react";


import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";


export const EditTaskModal: FC<ModalRenderProps & Task> = (task) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const edit = useMutation(api.task.edit.mutationOptions({
    onSettled: () => void queryClient.invalidateQueries(api.task.allGroups.pathFilter()),
    onSuccess: () => task.state.close(),
  }));

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