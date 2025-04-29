import { getFormProps } from "@conform-to/react";
import { type FC, useMemo } from "react";
import type { ModalRenderProps } from "react-aria-components";
import { z } from "zod";
import { useConform, Forms } from "~/app/_components/Forms";
import { Explain } from "~/app/_fragments/Explain";
import { _brand } from "~/app/_util/brandId";
import { useAddGroup } from "~/model/optimisticUpdates";
import { api } from "~/trpc/react";

export const AddGroupModal: FC<ModalRenderProps> = (props) => {
    const addGroup = useAddGroup({onSuccess: () => props.state.close()});
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

  return (
    <form {...getFormProps(form)} className="flex flex-col">
      <Explain short="New task group" className="pb-6">
        <p>
          You can give different groups different notification settings, for
          example to have aggresive text notifications for watering the plants,
          but being more chill about notifications for things like changing the
          oil in your car.
        </p>
        <p>
          If you&apos;re not sure what to do, just create a single group and add
          all the tasks into it. You can always move them around later
        </p>
      </Explain>
      <Forms.Labelled label="Title" fields={[fields.title]}>
        <Forms.TextField field={fields.title} autoFocus />
      </Forms.Labelled>
      <Forms.ButtonGroup>
        <Forms.SubmitButton label="Create new Group" />
        <Forms.Button
          label="Cancel"
          onClick={() => {
            return props.state.close();
          }}
        />
      </Forms.ButtonGroup>
      {errorDisplay}
    </form>
  );
};