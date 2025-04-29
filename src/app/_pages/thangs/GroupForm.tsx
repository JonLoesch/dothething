import { getFormProps } from "@conform-to/react";
import { z } from "zod";
import { Forms, useConform } from "~/app/_components/Forms";
import { Explain } from "~/app/_fragments/Explain";
import type { TargetId, TaskGroupId } from "~/app/_util/validators";
import { api } from "~/trpc/react";
import type { Target } from "./common";
import { Switch } from "react-aria-components";
import { useReducer, useState } from "react";
import { Icon } from "~/app/_fragments/Icon";

const groupFormSchema = z.object({
  title: z.string(),
});
type GroupFormData = z.infer<typeof groupFormSchema>;
export function GroupForm(props: {
  groupId: TaskGroupId | null;
  mode: "add" | "edit";
  onSubmit?: (values: GroupFormData) => void;
  onCancel?: () => void;
  initialValues: GroupFormData;
}) {
  const { form, fields, errorDisplay } = useConform(
    groupFormSchema,
    props.onSubmit,
  );
  const allTargets = api.notifications.allTargets.useQuery();

  return (
    <form {...getFormProps(form)}>
      {props.mode === "add" && (
        <Explain short="New task group" className="pb-6">
          <p>
            You can give different groups different notification settings, for
            example to have aggresive text notifications for watering the
            plants, but being more chill about notifications for things like
            changing the oil in your car.
          </p>
          <p>
            If you&apos;re not sure what to do, just create a single group and
            add all the tasks into it. You can always move them around later
          </p>
        </Explain>
      )}
      <Forms.Labelled label="Title" fields={[fields.title]}>
        <Forms.TextField
          autoFocus
          field={fields.title}
          defaultValue={props.initialValues.title}
        />
      </Forms.Labelled>
      {allTargets.isSuccess &&
        allTargets.data.map(
          (t) =>
            props.groupId && (
              <NotificationWidget
                key={t.id}
                target={t}
                groupId={props.groupId}
              />
            ),
        )}
      <Forms.ButtonGroup>
        <Forms.SubmitButton
          label={props.mode === "add" ? "Create new Group" : "Save Changes"}
        />
        <Forms.Button label="Cancel" onClick={props.onCancel} />
      </Forms.ButtonGroup>
      {errorDisplay}
    </form>
  );
}

function NotificationWidget(props: { groupId: TaskGroupId; target: Target }) {
  const utils = api.useUtils();
  const subscribe = api.notifications.subscribe.useMutation({
    onSettled(_data, _error, _variables, _context) {
      void utils.notifications.allTargets.invalidate();
    },
  });
  const unsubscribe = api.notifications.unsubscribe.useMutation({
    onSettled(_data, _error, _variables, _context) {
      void utils.notifications.allTargets.invalidate();
    },
  });

  const isSubscribed = !!props.target.subscriptions.find(
    (s) => s.groupId === props.groupId,
  );

  return (
    <div className="flex flex-row">
      <div className="relative self-center">
        {isSubscribed ? (
          <Icon.NotificationsOn
            className="size-8 cursor-pointer"
            onClick={() =>
              unsubscribe.mutate({
                groupId: props.groupId,
                targetId: props.target.id,
              })
            }
          />
        ) : (
          <Icon.NotificationsOff
            className="size-8 cursor-pointer"
            onClick={() =>
              subscribe.mutate({
                groupId: props.groupId,
                targetId: props.target.id,
              })
            }
          />
        )}
        {(subscribe.isPending || unsubscribe.isPending) && (
          <div className="absolute inset-0">
            <Icon.ConcentricCircles className="animate-in fade-in-50 repeat-infinite zoom-in-5 h-full w-full opacity-0 duration-1000"></Icon.ConcentricCircles>
          </div>
        )}
      </div>
      <span className="ml-4">{props.target.title}</span>
    </div>
    // <input
    //   type="checkbox"
    //   className="toggle"
    //   checked={

    //   }
    //   onChange={(e => {
    //     console.log(e.currentTarget.)
    //   })}
    // />
  );
}
