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
import { currentTimezone } from "~/app/_util/timeZone";

export const AddGroupModal: FC<ModalRenderProps> = (props) => {
  const addGroup = useAddGroup({ onSuccess: () => props.state.close() });
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
