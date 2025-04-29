"use client";

import {
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  GridList,
  GridListItem,
  Group,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
  type GridListProps,
  type ModalRenderProps,
} from "react-aria-components";
import {
  Fragment,
  useMemo,
  useReducer,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { api } from "~/trpc/react";
import { type taskGroups, type recurringTasks } from "~/server/db/schema";
import { type Schedule } from "~/model/schedule";
import {
  layoutSection,
  PageLayout,
  SectionedLayout,
  type PropsWithSectionHooks,
} from "../_components/PageLayout";
import { _brand } from "../_util/brandId";
import type { TaskGroupId, TaskId } from "../_util/validators";
import { z } from "zod";
import { titles } from "../_util/titles";
import { type taskRouter } from "~/server/api/routers/task";
import { useWatchState } from "../_util/useWatchState";
import { Forms, useConform } from "../_components/Forms";
import { getFormProps } from "@conform-to/react";
import { useSelectId } from "../_util/useSelectState";
import { Icon } from "../_components/icons";
import { EmptyListDisplay, Explain } from "../_components/utilities";
import type { UseMutationResult } from "@tanstack/react-query";
import pluralize from "pluralize";
import { groupCollapsed } from "console";
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  subDays,
} from "date-fns";

type Group = Awaited<ReturnType<typeof taskRouter.allGroups>>[0];
type Task = Group["tasks"][0];

let dec = -1;

export const TaskListPage: FC = () => {
  const allTargets = api.notifications.allTargets.useQuery();
  const allGroups = api.task.allGroups.useQuery();
  const utils = api.useUtils();
  const [selectedGroup, selectGroup] = useSelectId(
    allGroups.isSuccess && allGroups.data,
  );
  const [selectedTask, selectTask] = useSelectId(selectedGroup?.tasks);
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

  return (
    <SectionedLayout
      levels={[
        layoutSection({
          Component: ViewGroups,
          title: titles.list,
          params: allGroups.isSuccess && {
            groups: allGroups.data,
            selectedGroup,
            selectGroup,
          },
          close: () => undefined,
        }),
        layoutSection({
          Component: ViewGroup,
          title: selectedGroup?.title,
          params: selectedGroup
            ? {
                ...selectedGroup,
                selectTask,
                selectedTask,
              }
            : null,
          close: () => selectGroup(null),
        }),
        layoutSection({
          Component: ViewTask,
          title: selectedTask?.title,
          params: selectedTask
            ? {
                ...selectedTask,
              }
            : null,
          close: () => selectTask(null),
        }),
      ]}
    />
  );
};

interface GroupIdSet extends Set<number> {
  currentKey: TaskGroupId;
}

function gridlistSelectionProps<T extends { id: number }>(
  items: T[],
  selected: T | null,
  select: (id: T["id"] | null) => void,
) {
  return {
    items,
    selectionMode: "single",
    selectedKeys: selected ? [selected.id] : [],
    onSelectionChange(keys) {
      if (keys instanceof Set) {
        if (
          keys.size === 1 &&
          "currentKey" in keys &&
          typeof keys.currentKey === "number"
        ) {
          select(keys.currentKey);
        }
      }
    },
  } satisfies GridListProps<T>;
}

const ViewGroups: FC<
  PropsWithSectionHooks<{
    groups: Group[];
    selectedGroup: Group | null;
    selectGroup: (g: TaskGroupId | null) => void;
  }>
> = (props) => {
  return (
    <div className="flex flex-col">
      <SectionTitle>Groups:</SectionTitle>
      <GridList
        aria-label="Your existing task groups"
        {...gridlistSelectionProps(
          props.groups,
          props.selectedGroup,
          props.selectGroup,
        )}
      >
        {(group) => (
          <GridListItem
            textValue={group.title}
            className="selected:bg-pink-300"
          >
            <span className="link link-secondary">{group.title}</span> (
            {group.tasks.length == 0
              ? "empty"
              : pluralize("task", group.tasks.length, true)}
            )
          </GridListItem>
        )}
      </GridList>
      <EmptyListDisplay items={props.groups}>
        You do not have any groups created yet. Please create a group below to
        get started.
      </EmptyListDisplay>
      <div className="divider" />
      <DialogTrigger>
        <Button className="btn">Create New Group</Button>
        <Modal isDismissable>
          {(m) => {
            return <AddGroupModal {...m} />;
          }}
        </Modal>
      </DialogTrigger>
    </div>
  );
};

const AddGroupModal: FC<ModalRenderProps> = (props) => {
  const utils = api.useUtils();
  const addGroup = api.task.addGroup.useMutation({
    async onMutate(variables) {
      await utils.task.allGroups.cancel();
      const prevData = utils.task.allGroups.getData();
      utils.task.allGroups.setData(undefined, (x) => {
        return [
          ...(x ?? []),
          {
            id: _brand(dec--),
            title: variables.title,
            createdAt: new Date(),
            deletedAt: new Date(),
            tasks: [],
            updatedAt: new Date(),
            userId: _brand(""),
            lastNotification: new Date().toDateString(),
          },
        ];
      });
      return { prevData };
    },
    onError(_error, _variables, context) {
      utils.task.allGroups.setData(undefined, context?.prevData);
    },
    onSettled(_data, _error, _variables, _context) {
      void utils.task.allGroups.invalidate();
    },
    onSuccess: () => props.state.close(),
  });
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
            console.log(props.state, props);
            return props.state.close();
          }}
        />
      </Forms.ButtonGroup>
      {errorDisplay}
    </form>
  );
};

const DeleteGroupModal: FC<ModalRenderProps & Group> = (props) => {
  const utils = api.useUtils();
  const removeGroup = api.task.removeGroup.useMutation({
    async onMutate(variables) {
      await utils.task.allGroups.cancel();
      const prevData = utils.task.allGroups.getData();
      utils.task.allGroups.setData(undefined, (x) => {
        return (x ?? []).filter((group) => group.id !== variables.id);
      });
      return { prevData };
    },
    onError(_error, _variables, context) {
      utils.task.allGroups.setData(undefined, context?.prevData);
    },
    // onSettled(_data, _error, _variables, _context) {
    // },
    async onSuccess() {
      await utils.task.allGroups.invalidate();
      props.state.close();
    },
  });
  return (
    <Forms.ConfirmDelete
      {...useConform(z.object({}), () => removeGroup.mutate(props))}
      close={() => props.state.close()}
    >
      {`Are you sure you want to delete the group "${props.title}"`}
    </Forms.ConfirmDelete>
  );
};

const ViewGroup: FC<
  PropsWithSectionHooks<
    Group & {
      selectTask: (task: TaskId | null) => void;
      selectedTask: Task | null;
    }
  >
> = (props) => {
  return (
    <div className="flex flex-col">
      <SectionTitle>{props.title}</SectionTitle>
      <GridList
        aria-label="tasks within this group"
        {...gridlistSelectionProps(
          props.tasks,
          props.selectedTask,
          props.selectTask,
        )}
      >
        {(task) => {
          const days = differenceInDays(task.nextDueDate, new Date());
          const weeks = differenceInWeeks(task.nextDueDate, new Date());
          const months = differenceInMonths(task.nextDueDate, new Date());
          const years = differenceInYears(task.nextDueDate, new Date());

          const timespan =
            Math.abs(years) >= 2
              ? pluralize("year", Math.abs(years), true)
              : Math.abs(months) >= 2
                ? pluralize("month", Math.abs(months), true)
                : Math.abs(weeks) >= 2
                  ? pluralize("week", Math.abs(weeks), true)
                  : pluralize("day", Math.abs(days), true);

          return (
            <GridListItem textValue={task.title} className="selected:bg-black">
              <Group className="flex flex-col items-stretch py-2 [&>*]:not-first:ml-6">
                <span className="link link-secondary">{task.title}</span>
                {days > 0 ? (
                  <span>next in {timespan}</span>
                ) : days === 0 ? (
                  <span>today</span>
                ) : (
                  <span>{timespan} past time</span>
                )}
                <span> ({displaySchedule(task.schedule)}) </span>
              </Group>
            </GridListItem>
          );
        }}
      </GridList>
      <EmptyListDisplay items={props.tasks}>
        You do not have any tasks created yet in this group. Please add a task
        below to get started.
      </EmptyListDisplay>
      <DialogTrigger>
        <Button className="btn mt-4">Create New Task</Button>
        <Modal isDismissable>
          {(m) => {
            return <AddTaskModal {...m} groupId={props.id} />;
          }}
        </Modal>
      </DialogTrigger>
      <div className="divider" />
      <DialogTrigger>
        <Button className="btn">Edit this group</Button>
        <Modal isDismissable>
          {(m) => {
            return <Stub {...m} />;
          }}
        </Modal>
      </DialogTrigger>
      <DialogTrigger>
        <Button className="btn btn-error btn-outline">Delete this group</Button>
        <Modal isDismissable>
          {(m) => {
            return <DeleteGroupModal {...m} {...props} />;
          }}
        </Modal>
      </DialogTrigger>
    </div>
  );
  const utils = api.useUtils();
  const remove = api.task.remove.useMutation({
    async onMutate(variables) {
      await utils.task.allGroups.cancel();
      const prevData = utils.task.allGroups.getData();
      utils.task.allGroups.setData(undefined, (x) => {
        return [
          ...(x ?? []).map(({ tasks, ...group }) => ({
            ...group,
            tasks: tasks.filter((t) => t.id !== variables.id),
          })),
        ];
      });
      return { prevData };
    },
    onError(_error, _variables, context) {
      utils.task.allGroups.setData(undefined, context?.prevData);
    },
    onSettled(_data, _error, _variables, _context) {
      void utils.task.allGroups.invalidate();
    },
  });
  return (
    <div className="list gap-4">
      <div className="self-center font-bold uppercase">{props.title}</div>
      <table className="table">
        <thead className="max-lg:hidden">
          <tr>
            <th>Task</th>
            <th>Due next</th>
            <th>Period</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {props.tasks.map((task) => (
            <Fragment key={task.id}>
              <tr
                tabIndex={-1}
                className="lg:pointer-events-none not-focus:[&+*]:hidden max-sm:[&>td]:nth-[n+2]:hidden"
                onClick={() => props.selectTask(task.id)}
              >
                <td>{task.title}</td>
                <td>On {task.nextDueDate}</td>
                <td className="text-base-content/60">
                  ({displaySchedule(task.schedule)})
                </td>
                <td
                  className="btn btn-circle btn-ghost text-error"
                  onClick={() => {
                    void remove.mutateAsync({
                      id: task.id,
                    });
                  }}
                >
                  <Icon.Trash />
                </td>
              </tr>
              <tr className="p-4 max-lg:hidden">
                <td colSpan={4} className="border-2">
                  asdfasdfasdf
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
      <Forms.ButtonGroup>
        {/* <button className="btn" onClick={group.addTask}>
          {" "}
          Add new task{" "}
        </button> */}

        <DialogTrigger>
          <Button className="btn btn-error btn-outline">Delete group</Button>
          <Modal isDismissable>
            {(m) => <DeleteGroupModal {...m} {...props} />}
          </Modal>
        </DialogTrigger>
      </Forms.ButtonGroup>
    </div>
  );
};
const ViewTask: FC<
  PropsWithSectionHooks<Task>
> = (task) => {
  return (
    <>
      This task should be completed: {displaySchedule(task.schedule)}
      <Forms.ButtonGroup>
        <DialogTrigger>
          <Button className="btn">Edit Task</Button>
          <Modal isDismissable>
            {(m) => <EditTaskModal {...m} {...task} />}
          </Modal>
        </DialogTrigger>
        <DialogTrigger>
          <Button className="btn btn-error btn-outline">Delete task</Button>
          <Modal isDismissable>
            {(m) => <DeleteTaskModal {...m} {...task} />}
          </Modal>
        </DialogTrigger>
      </Forms.ButtonGroup>
    </>
  );
};

const EditTaskModal: FC<ModalRenderProps & Task> = (task) => {
  const utils = api.useUtils();
  const edit = api.task.edit.useMutation({
    onSettled: () => void utils.task.allGroups.invalidate(),
    onSuccess: () => task.state.close(),
  });

  return (
    <TaskForm
      submitLabel="Save Changes"
      onCancel={() => task.state.close()}
      initialValues={FromDbObject(task)}
      onSubmit={(values) => {
        void edit.mutate({ ...AsDbObject(values), id: task.id });
      }}
    />
  );
};

const AddTaskModal: FC<ModalRenderProps & { groupId: TaskGroupId }> = (
  props,
) => {
  const utils = api.useUtils();
  const add = api.task.add.useMutation({
    async onMutate(variables) {
      await utils.task.allGroups.cancel();
      const prevData = utils.task.allGroups.getData();
      utils.task.allGroups.setData(undefined, (x) => {
        return [
          ...(x ?? []).map(({ tasks, ...group }) => ({
            ...group,
            tasks:
              variables.groupId === group.id
                ? [
                    ...tasks,
                    {
                      id: _brand<"recurringTaskId">(dec--),
                      groupId: _brand<"taskGroupId">(dec--),
                      title: variables.title,
                      createdAt: new Date(),
                      deletedAt: new Date(),
                      tasks: [],
                      updatedAt: new Date(),
                      nextDueDate: new Date().toDateString(),
                      userId: _brand(""),
                      schedule: variables.schedule,
                      lastAccomplishedAt: new Date().toDateString(),
                    },
                  ]
                : tasks,
          })),
        ];
      });
      return { prevData };
    },
    onError(_error, _variables, context) {
      utils.task.allGroups.setData(undefined, context?.prevData);
    },
    onSettled(_data, _error, _variables, _context) {
      void utils.task.allGroups.invalidate();
    },
    onSuccess: () => props.state.close(),
  });

  return (
    <TaskForm
      submitLabel="Add new Task"
      initialValues={{
        frequency: "1",
        frequencyType: "monthly",
        title: "",
      }}
      onCancel={() => props.state.close()}
      onSubmit={(values) =>
        add.mutate({ ...AsDbObject(values), groupId: props.groupId })
      }
    />
  );
};

const DeleteTaskModal: FC<ModalRenderProps & Task> = (props) => {
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

const Stub: FC<ModalRenderProps> = (props) => {
  return <div>Not implemented yet. :(</div>;
};

const taskFormSchema = z.object({
  title: z.string(),
  frequency: z.string(),
  frequencyType: z.enum(["daily", "weekly", "monthly", "yearly"]),
});
type TaskFormData = z.infer<typeof taskFormSchema>;
function TaskForm(props: {
  submitLabel: string;
  onSubmit?: (values: TaskFormData) => void;
  onCancel?: () => void;
  initialValues: TaskFormData;
}) {
  const { form, fields, errorDisplay } = useConform(
    taskFormSchema,
    props.onSubmit,
  );

  return (
    <form {...getFormProps(form)}>
      <Forms.Labelled label="Title" fields={[fields.title]}>
        <Forms.TextField
          autoFocus
          field={fields.title}
          defaultValue={props.initialValues.title}
        />
      </Forms.Labelled>
      <Forms.Labelled
        label="Every"
        fields={[fields.frequency, fields.frequencyType]}
      >
        <div className="join join-vertical">
          <Forms.TextField
            field={fields.frequency}
            defaultValue={props.initialValues.frequency}
            placeholder="Input a number"
            type="number"
          />
          <Forms.SelectField
            field={fields.frequencyType}
            initialValue={props.initialValues.frequencyType}
            labels={{
              daily: "Days",
              weekly: "Weeks",
              monthly: "Months",
              yearly: "Years",
            }}
          />
        </div>
      </Forms.Labelled>
      <Forms.ButtonGroup>
        <Forms.SubmitButton label={props.submitLabel} />
        <Forms.Button label="Cancel" onClick={props.onCancel} />
      </Forms.ButtonGroup>
      {errorDisplay}
    </form>
  );
}

function AsDbObject(htmlTask: TaskFormData) {
  return {
    title: htmlTask.title,
    schedule: schedule(),
  };
  function schedule(): typeof recurringTasks.$inferSelect.schedule {
    switch (htmlTask.frequencyType) {
      case "daily":
        return {
          type: htmlTask.frequencyType,
          numberOfDays: parseInt(htmlTask.frequency),
        };
      case "weekly":
        return {
          type: htmlTask.frequencyType,
          numberOfWeeks: parseInt(htmlTask.frequency),
        };
      case "monthly":
        return {
          type: htmlTask.frequencyType,
          numberOfMonths: parseInt(htmlTask.frequency),
        };
      case "yearly":
        return {
          type: htmlTask.frequencyType,
          numberOfYears: parseInt(htmlTask.frequency),
        };
    }
  }
}
function FromDbObject(dbo: typeof recurringTasks.$inferSelect) {
  return {
    title: dbo.title,
    frequencyType: dbo.schedule.type,
    frequency: frequency(),
  };
  function frequency() {
    switch (dbo.schedule.type) {
      case "daily":
        return dbo.schedule.numberOfDays.toString();
      case "weekly":
        return dbo.schedule.numberOfWeeks.toString();
      case "monthly":
        return dbo.schedule.numberOfMonths.toString();
      case "yearly":
        return dbo.schedule.numberOfYears.toString();
    }
  }
}

function displaySchedule(schedule: Schedule) {
  switch (schedule.type) {
    case "daily":
      return `Every ${schedule.numberOfDays} days`;
    case "monthly":
      return `Every ${schedule.numberOfMonths} months`;
    case "weekly":
      return `Every ${schedule.numberOfWeeks} weeks`;
    case "yearly":
      return `Every ${schedule.numberOfYears} years`;
  }
}

const SectionTitle: FC<PropsWithChildren> = (props) => (
  <div className="mb-8 text-xl">{props.children} </div>
);
