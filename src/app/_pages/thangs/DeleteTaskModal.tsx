import { useTRPC } from "~/trpc/react";
import type { Task } from "./common";
import type { FC } from "react";
import type { ModalRenderProps } from "react-aria-components";
import { Forms, useConform } from "~/app/_components/Forms";
import { z } from "zod";


import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";


export const DeleteTaskModal: FC<ModalRenderProps & Task> = (props) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const remove = useMutation(api.task.remove.mutationOptions({
    onSettled(_data, _error, _variables, _context) {
      void queryClient.invalidateQueries(api.task.allGroups.pathFilter());
    },
    onSuccess() {
      props.state.close();
    },
  }));
  return (
    <Forms.ConfirmDelete
      {...useConform(z.object({}), () => remove.mutate({id: props.id}))}
      close={() => props.state.close()}
    >
      {`Are you sure you want to delete the task "${props.title}"`}
    </Forms.ConfirmDelete>
  );
};