import type { ModalRenderProps } from "react-aria-components";
import type { Group } from "./common";
import type { FC } from "react";
import { GroupForm } from "./GroupForm";

export const EditGroupModal: FC<ModalRenderProps & Group> = (props) => {
  return (
    <GroupForm
      initialValues={props}
      mode="edit"
      groupId={props.id}
      onCancel={() => props.state.close()}
    />
  );
};
