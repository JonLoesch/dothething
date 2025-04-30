import type { FC } from "react";
import type { ModalRenderProps } from "react-aria-components";
import { z } from "zod";
import { Forms, useConform } from "~/app/_components/Forms";
import { useTRPCOptimisticMutations } from "~/model/optimisticUpdates";
import type { taskRouter } from "~/server/api/routers/task";
import type { Group } from "./common";
import { useMutation } from "@tanstack/react-query";

export const DeleteGroupModal: FC<ModalRenderProps & Group> = (props) => {
  const removeGroup = useMutation(useTRPCOptimisticMutations().task.removeGroup({
    onSuccess: () => props.state.close(),
  }))
  return (
    <Forms.ConfirmDelete
      {...useConform(z.object({}), () => removeGroup.mutate(props))}
      close={() => props.state.close()}
    >
      {`Are you sure you want to delete the group "${props.title}"`}
    </Forms.ConfirmDelete>
  );
};
