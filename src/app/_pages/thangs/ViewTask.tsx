import type { FC } from "react";
import { DialogTrigger, Button, Modal } from "react-aria-components";
import { Forms } from "~/app/_components/Forms";
import type { PropsWithSectionHooks } from "~/app/_layout/PageWithSections";
import { displaySchedule, type Task } from "./common";
import { ModalTriggerButton } from "~/app/_fragments/ModalTriggerButton";
import { EditTaskModal } from "./EditTaskModal";
import { DeleteTaskModal } from "./DeleteTaskModal";

export const ViewTask: FC<PropsWithSectionHooks<Task>> = (task) => {
  return (
    <>
      This task should be completed: {displaySchedule(task.schedule)}
      <Forms.ButtonGroup>
        <ModalTriggerButton modal={EditTaskModal} {...task}>
          Edit Task
        </ModalTriggerButton>
        <ModalTriggerButton
          className="btn-error btn-outline"
          modal={DeleteTaskModal}
          {...task}
        >
          Delete Task
        </ModalTriggerButton>
      </Forms.ButtonGroup>
    </>
  );
};
