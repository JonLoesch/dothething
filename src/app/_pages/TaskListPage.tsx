"use client";

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
import { ChevronDoubleRightIcon, TrashIcon } from "@heroicons/react/24/outline";
import { titles } from "../_util/titles";
import { Disclosure } from "@headlessui/react";
import { type taskRouter } from "~/server/api/routers/task";
import { useWatchState } from "../_util/useWatchState";
import { Forms, useConform } from "../_components/Forms";
import { getFormProps } from "@conform-to/react";
import { useSelectId } from "../_util/useSelectState";

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
  const [state, setState] = useState<
    | null
    | "addGroup"
    | "deleteGroup"
    | "editGroup"
    | "addTask"
    | "editTask"
    | "deleteTask"
  >(null);

  return (
    <SectionedLayout
      levels={[
        layoutSection({
          Component: ViewGroups,
          title: titles.list,
          params: allGroups.isSuccess && {
            groups: allGroups.data,
            selectGroup,
            addGroup: () => setState("addGroup"),
          },
          close: () => undefined,
        }),
        layoutSection({
          Component: AddGroup,
          params: state === "addGroup",
          close: () => setState(null),
          title: "New Task Group",
        }),
        layoutSection({
          Component: ViewGroup,
          title: selectedGroup?.title,
          params: selectedGroup
            ? {
                ...selectedGroup,
                selectTask,
                addTask: () => setState("addTask"),
                delete: () => setState("deleteGroup"),
              }
            : null,
          close: () => selectGroup(null),
        }),
        layoutSection({
          Component: DeleteGroup,
          title: "Delete",
          params: state === "deleteGroup" && selectedGroup,
          close: () => setState(null),
        }),
        layoutSection({
          Component: AddTask,
          title: "New Task",
          params: state === "addTask" && selectedGroup,
          close: () => setState(null),
        }),
        layoutSection({
          Component: ViewTask,
          title: selectedTask?.title,
          params: selectedTask
            ? {
                ...selectedTask,
                openEdit: () => setState("editTask"),
                delete: () => setState('deleteTask'),
              }
            : null,
          close: () => selectTask(null),
        }),
        layoutSection({
          Component: EditTask,
          title: "Edit",
          params: state === "editTask" && selectedTask ? {
            ...selectedTask,
          } : null,
          close: () => setState(null),
        }),
        layoutSection({
          Component: DeleteTask,
          title: "Edit",
          params: state === "deleteTask" && selectedTask ? {
            ...selectedTask,
          } : null,
          close: () => setState(null),
        }),
      ]}
    />
  );
};

const ViewGroups: FC<
  PropsWithSectionHooks<{
    groups: Group[];
    selectGroup: (g: TaskGroupId) => void;
    addGroup: () => void;
  }>
> = (props) => {
  return (
    <div className="flex flex-col">
      <div role="tablist" className="tabs flex flex-col items-start">
        {props.groups.map((group) => (
          <a
            role="tab"
            className="tab self-start p-0 text-ellipsis"
            // aria-selected={group.id === selectedGroup?.id}
            key={group.id}
            onClick={() => props.selectGroup(group.id)}
          >
            {group.title}
          </a>
        ))}
      </div>
      <button className="btn" onClick={props.addGroup}>
        Create New Group
      </button>
    </div>
  );
};

const AddGroup: FC<PropsWithSectionHooks> = (props) => {
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
    onSuccess: props.close,
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
    <form {...getFormProps(form)}>
      <Forms.Labelled label="Title" fields={[fields.title]}>
        <Forms.TextField field={fields.title} initialValue="" />
      </Forms.Labelled>
      <Forms.ButtonGroup>
        <Forms.SubmitButton label="Create new Group" />
        <Forms.Button label="Cancel" onClick={props.close} />
      </Forms.ButtonGroup>
      {errorDisplay}
    </form>
  );
};

const DeleteGroup: FC<PropsWithSectionHooks<Group>> = (group) => {
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
      group.close();
    },
  });
  return (
    <Forms.ConfirmDelete
      {...useConform(z.object({}), () => removeGroup.mutate(group))}
      close={group.close}
    >
      {`Are you sure you want to delete the group "${group.title}"`}
    </Forms.ConfirmDelete>
  );
};

const ViewGroup: FC<
  PropsWithSectionHooks<
    Group & {
      selectTask: (task: TaskId) => void;
      addTask: () => void;
      delete: () => void;
    }
  >
> = (group) => {
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
      <div className="self-center font-bold uppercase">{group.title}</div>
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
          {group.tasks.map((task) => (
            <Fragment key={task.id}>
              <tr
                tabIndex={-1}
                className="lg:pointer-events-none not-focus:[&+*]:hidden max-sm:[&>td]:nth-[n+2]:hidden"
                onClick={() => group.selectTask(task.id)}
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
                  <TrashIcon />
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
        <button className="btn" onClick={group.addTask}>
          {" "}
          Add new task{" "}
        </button>

        <button className="btn" onClick={group.delete}>
          <TrashIcon className="h-full" />
          Delete group
        </button>
      </Forms.ButtonGroup>
    </div>
  );
};
const ViewTask: FC<PropsWithSectionHooks<Task & { openEdit: () => void, delete: () => void }>> = (
  task,
) => {
  return (
    <>
      This task should be completed: {displaySchedule(task.schedule)}
      <Forms.ButtonGroup>
      <button className="btn" onClick={task.openEdit}>
        Edit
      </button>
        <button className="btn" onClick={task.delete}>
          <TrashIcon className="h-full" />
          Delete task
        </button>
      </Forms.ButtonGroup>
      
    </>
  );
};

const EditTask: FC<PropsWithSectionHooks<Task>> = (task) => {
  const utils = api.useUtils();
  const edit = api.task.edit.useMutation({
    onSettled: () => void utils.task.allGroups.invalidate(),
    onSuccess: task.close,
  });

  return (
    <TaskForm
      submitLabel="Save Changes"
      onCancel={task.close}
      initialValues={FromDbObject(task)}
      onSubmit={(values) => {
        void edit
          .mutateAsync({ ...AsDbObject(values), id: task.id })
          .then(() => task.close());
      }}
    />
  );
};

const AddTask: FC<PropsWithSectionHooks<Group>> = (group) => {
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
    onSuccess: group.close,
  });

  return (
    <TaskForm
      submitLabel="Add new Task"
      initialValues={{
        frequency: "1",
        frequencyType: "monthly",
        title: "",
      }}
      onCancel={group.close}
      onSubmit={(values) =>
        add.mutate({ ...AsDbObject(values), groupId: group.id })
      }
    />
  );
};

const DeleteTask: FC<PropsWithSectionHooks<Task>> = (task) => {
  const utils = api.useUtils();
  const remove = api.task.remove.useMutation({
    onSettled(_data, _error, _variables, _context) {
      void utils.task.allGroups.invalidate();
    },
    onSuccess() {
      task.close();
    },
  });
  return (
    <Forms.ConfirmDelete
      {...useConform(z.object({}), () => remove.mutate(task))}
      close={task.close}
    >
      {`Are you sure you want to delete the task "${task.title}"`}
    </Forms.ConfirmDelete>
  );
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
          field={fields.title}
          initialValue={props.initialValues.title}
        />
      </Forms.Labelled>
      <Forms.Labelled
        label="Every"
        fields={[fields.frequency, fields.frequencyType]}
      >
        <div className="join join-vertical">
          <Forms.TextField
            field={fields.frequency}
            initialValue={props.initialValues.frequency}
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
