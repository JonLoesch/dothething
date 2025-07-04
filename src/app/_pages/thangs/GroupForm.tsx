import { getFormProps } from "@conform-to/react";
import { z } from "zod";
import { Forms, useConform } from "~/app/_components/Forms";
import { Explain } from "~/app/_fragments/Explain";
import type { TargetId, TaskGroupId } from "~/app/_util/validators";
import { useTRPC } from "~/trpc/react";
import type { Target } from "./common";
import {
  DateInput,
  DateSegment,
  Switch,
  TimeField,
} from "react-aria-components";
import { useMemo, useReducer, useState } from "react";
import { Icon } from "~/app/_fragments/Icon";
import { getLocalTimeZone, Time, ZonedDateTime } from "@internationalized/date";
import { TZDate } from "@date-fns/tz";
import { formatDate, formatISO } from "date-fns";
import { currentTimezone, formatTimezone } from "~/app/_util/timeZone";

import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

const groupFormSchema = z.object({
  title: z.string().min(1),
  hour: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).transform(x => parseInt(x.slice(0, 2), 10)),
  zone: z.string().min(1),
});
type GroupFormData = z.infer<typeof groupFormSchema>;
export function GroupForm(props: {
  groupId: TaskGroupId | null;
  mode: "add" | "edit";
  onSubmit?: (values: GroupFormData) => void;
  onCancel?: () => void;
  initialValues: GroupFormData;
}) {
  const api = useTRPC();
  const { form, fields, errorDisplay } = useConform(groupFormSchema, props.onSubmit);
  const allTargets = useQuery(api.notifications.allTargets.queryOptions());
  const formattedZone = useMemo(() => formatTimezone(props.initialValues.zone), [props.initialValues.zone]);

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
      <input type="hidden" name="zone" value={props.initialValues.zone} />
      <Forms.Labelled label="Notify me daily" fields={[fields.hour]}>
        <TimeField
          granularity="hour"
          className="flex flex-row flex-wrap h-auto items-center"
          name="hour"
          defaultValue={new Time(props.initialValues.hour)}
          aria-label="Notify me daily"
        >
          <DateInput className='input input-ghost '>
            {(segment) => <DateSegment segment={segment} />}
          </DateInput>
          <div className="grow-1 shrink-1 text-right mb-3">{formattedZone}</div>
        </TimeField>
      </Forms.Labelled>
      <Forms.ButtonGroup>
        <Forms.SubmitButton
          label={props.mode === "add" ? "Create new Group" : "Save Changes"}
        />
        <Forms.Button label="Cancel" onClick={props.onCancel} />
      </Forms.ButtonGroup>
      <div className="divider"/>

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
      {errorDisplay}
    </form>
  );
}

function NotificationWidget(props: { groupId: TaskGroupId; target: Target }) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const subscribe = useMutation(api.notifications.subscribe.mutationOptions({
    onSettled(_data, _error, _variables, _context) {
      void queryClient.invalidateQueries(api.notifications.allTargets.pathFilter());
    },
  }));
  const unsubscribe = useMutation(api.notifications.unsubscribe.mutationOptions({
    onSettled(_data, _error, _variables, _context) {
      void queryClient.invalidateQueries(api.notifications.allTargets.pathFilter());
    },
  }));

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
  );
}
