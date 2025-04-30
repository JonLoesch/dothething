import type { FC } from "react";
import type { ModalRenderProps } from "react-aria-components";
import type { TaskGroupId } from "~/app/_util/validators";
import { AsDbObject, TaskForm } from "./TaskForm";
import { useMutation } from "@tanstack/react-query";
import { useTRPCOptimisticMutations } from "~/model/optimisticUpdates/index";

export const AddTaskModal: FC<ModalRenderProps & { groupId: TaskGroupId }> = (
  props,
) => {

  const add = useMutation(useTRPCOptimisticMutations().task.add({
    onSuccess: () => props.state.close(),
  }));

  return (
    <TaskForm
      submitLabel="Add new Task"
      initialValues={{
        frequency: "1",
        frequencyType: "monthly",
        title: "",
      }}
      onCancel={() => props.state.close()}
      onSubmit={(values) =>
        add.mutate({ ...AsDbObject(values), groupId: props.groupId })
      }
    />
  );
};
