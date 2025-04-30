import type { ModalRenderProps } from "react-aria-components";
import type { Group } from "./common";
import type { FC } from "react";
import { GroupForm } from "./GroupForm";
import { api } from "~/trpc/react";

export const EditGroupModal: FC<ModalRenderProps & Group> = (props) => {
  const utils = api.useUtils();
  const editGroup = api.task.editGroup.useMutation({
    onSettled: async () => {
      await utils.task.allGroups.invalidate();
      props.state.close();
    },
  });

  return (
    <GroupForm
      initialValues={props}
      mode="edit"
      groupId={props.id}
      onCancel={() => props.state.close()}
      onSubmit={(x) => editGroup.mutate({ ...x, id: props.id })}
    />
  );
};
