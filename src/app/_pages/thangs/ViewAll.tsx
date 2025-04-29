import pluralize from "pluralize";
import type { FC } from "react";
import {
  GridList,
  GridListItem,
  DialogTrigger,
  Button,
  Modal,
  type ModalRenderProps,
} from "react-aria-components";
import { EmptyListDisplay } from "~/app/_fragments/EmptyListDisplay";
import { ListSection } from "~/app/_fragments/ListSection";
import { ModalTriggerButton } from "~/app/_fragments/ModalTriggerButton";
import type { PropsWithSectionHooks } from "~/app/_layout/PageWithSections";
import type { TaskGroupId } from "~/app/_util/validators";
import type { taskRouter } from "~/server/api/routers/task";
import { AddGroupModal } from "./AddGroupModal";
import type { Group } from "./common";

export const ViewAll: FC<
  PropsWithSectionHooks<{
    groups: Group[];
    selectedGroup: Group | null;
    selectGroup: (g: TaskGroupId | null) => void;
  }>
> = (props) => {
  return (
    <ListSection
      items={props.groups}
      select={props.selectGroup}
      selected={props.selectedGroup}
      sectionTitle="Groups"
      empty="You do not have any groups created yet. Please create a group below to get started."
      item={(group) => ({
        title: group.title,
        children: (
          <span>
            (
            {group.tasks.length == 0
              ? "empty"
              : pluralize("task", group.tasks.length, true)}
            )
          </span>
        ),
      })}
    >
      <div className="divider" />
      <ModalTriggerButton modal={AddGroupModal}>
        Create New Group
      </ModalTriggerButton>
    </ListSection>
  );
};
