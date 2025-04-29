import { api } from "~/trpc/react";
import type { Task } from "./common";
import type { FC } from "react";
import type { ModalRenderProps } from "react-aria-components";
import { Forms, useConform } from "~/app/_components/Forms";
import { z } from "zod";


export const DeleteTaskModal: FC<ModalRenderProps & Task> = (props) => {
    const utils = api.useUtils();
    const remove = api.task.remove.useMutation({
      onSettled(_data, _error, _variables, _context) {
        void utils.task.allGroups.invalidate();
      },
      onSuccess() {
        props.state.close();
      },
    });
    return (
      <Forms.ConfirmDelete
        {...useConform(z.object({}), () => remove.mutate({id: props.id}))}
        close={() => props.state.close()}
      >
        {`Are you sure you want to delete the task "${props.title}"`}
      </Forms.ConfirmDelete>
    );
  };