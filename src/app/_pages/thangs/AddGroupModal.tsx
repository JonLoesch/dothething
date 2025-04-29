import { getFormProps } from "@conform-to/react";
import { type FC, useMemo } from "react";
import type { ModalRenderProps } from "react-aria-components";
import { z } from "zod";
import { useConform, Forms } from "~/app/_components/Forms";
import { Explain } from "~/app/_fragments/Explain";
import { _brand } from "~/app/_util/brandId";
import { useAddGroup } from "~/model/optimisticUpdates";
import { api } from "~/trpc/react";
import { GroupForm } from "./GroupForm";

export const AddGroupModal: FC<ModalRenderProps> = (props) => {
  const addGroup = useAddGroup({ onSuccess: () => props.state.close() });
  const { form, fields, errorDisplay } = useConform(
    useMemo(
      () =>
        z.object({
          title: z.string(),
        }),
      [],
    ),
    (formData) => addGroup.mutate(formData),
  );
  return <GroupForm
  initialValues={{
    title: ''
  }}
  mode='add'
  groupId={null}
  onSubmit={(formData) => addGroup.mutate(formData)}
  onCancel={() => props.state.close()}/>
};

