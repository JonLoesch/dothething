import type { ModalRenderProps } from "react-aria-components";
import type { Group } from "./common";
import type { FC } from "react";
import { GroupForm } from "./GroupForm";
import { useTRPC } from "~/trpc/react";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export const EditGroupModal: FC<ModalRenderProps & Group> = (props) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const editGroup = useMutation(api.task.editGroup.mutationOptions({
    onSettled: async () => {
      await queryClient.invalidateQueries(api.task.allGroups.pathFilter());
      props.state.close();
    },
  }));

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
