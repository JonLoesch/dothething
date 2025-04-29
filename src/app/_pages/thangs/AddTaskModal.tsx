import type { FC } from "react";
import type { ModalRenderProps } from "react-aria-components";
import { _brand } from "~/app/_util/brandId";
import type { TaskGroupId } from "~/app/_util/validators";
import { api } from "~/trpc/react";
import { AsDbObject, TaskForm } from "./TaskForm";
import { useAddTask } from "~/model/optimisticUpdates";

export const AddTaskModal: FC<ModalRenderProps & { groupId: TaskGroupId }> = (
  props,
) => {
  const add = useAddTask({
    onSuccess: () => props.state.close(),
  });

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
