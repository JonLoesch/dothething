import { getFormProps } from "@conform-to/react";
import { type FC, useMemo } from "react";
import type { ModalRenderProps } from "react-aria-components";
import { z } from "zod";
import { useConform, Forms } from "~/app/_components/Forms";
import { Explain } from "~/app/_fragments/Explain";
import { GroupForm } from "./GroupForm";
import { currentTimezone } from "~/app/_util/timeZone";
import { useMutation } from "@tanstack/react-query";
import { useTRPCOptimisticMutations } from "~/model/optimisticUpdates/index";

export const AddGroupModal: FC<ModalRenderProps> = (props) => {
  const addGroup = useMutation(useTRPCOptimisticMutations().task.addGroup({
    onSuccess: () => props.state.close()
  }))
  return (
    <GroupForm
      initialValues={{
        title: "",
        hour: 9, // 9AM local time by default
        zone: currentTimezone(),
      }}
      mode="add"
      groupId={null}
      onSubmit={(formData) => addGroup.mutate(formData)}
      onCancel={() => props.state.close()}
    />
  );
};
