"use client";

import { useMemo, useState, type FC, type PropsWithChildren } from "react";
import { api } from "~/trpc/react";
import { type recurringTasks } from "~/server/db/schema";
import { type Schedule } from "~/model/schedule";
import { PageLayout } from "./Layout";
import { _brand } from "../_util/brandId";
import type { TaskGroupId } from "../_util/validators";
import { z } from "zod";
import { TrashIcon } from "@heroicons/react/24/outline";

let dec = -1;

export const TaskList: FC = () => {
  const allGroups = api.task.allGroups.useQuery();
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
  });
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
  });
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
    onSettled(_data, _error, _variables, _context) {
      void utils.task.allGroups.invalidate();
    },
  });
  const [selectedGroupId, selectGroup] = useState<null | TaskGroupId>(null);
  const selectedGroup = useMemo(
    () =>
      allGroups.isSuccess &&
      allGroups.data.find((x) => x.id === selectedGroupId),
    [allGroups, selectedGroupId],
  );

  const sidebar = !allGroups.isSuccess ? null : (
    <>
      <div role="tablist" className="tabs flex-col items-start">
        {allGroups.data.map((group) => (
          <a
            role="tab"
            className="tab self-start p-0 text-ellipsis"
            aria-selected={group.id === selectedGroupId}
            key={group.id}
            onClick={() => selectGroup(group.id)}
          >
            {group.title}
          </a>
        ))}
      </div>
      <Form
        onSubmit={(values) =>
          addGroup.mutate(
            z
              .object({
                title: z.string(),
              })
              .parse(values),
          )
        }
      >
        <input
          type="text"
          name="title"
          className="input w-full"
          placeholder="Create new Group"
        />
      </Form>
    </>
  );

  return (
    <PageLayout title="My Things (to do)" sidebar={sidebar}>
      {selectedGroup && (
        <div className="list bg-base-300 gap-4 rounded p-4">
          <div className="self-center font-bold uppercase">
            {selectedGroup.title}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Due next</th>
                <th>Period</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {selectedGroup.tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>On {t.nextDueDate}</td>
                  <td className="text-base-content/60">
                    ({displaySchedule(t.schedule)})
                  </td>
                  <td
                    className="btn btn-circle btn-ghost text-error"
                    onClick={() => {
                      void remove.mutateAsync({
                        id: t.id,
                      });
                    }}
                  >
                    <TrashIcon />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Form
            onSubmit={(values) => add.mutate(validateNewTaskForm.parse(values))}
          >
            <input type="submit" className="hidden" />
            <input
              type="text"
              name="title"
              className="input w-full"
              placeholder="Create new task"
            />
            <input name="frequency" type="number" required />
            <select
              name="frequencyType"
              className="select"
              defaultValue="weekly"
            >
              <option value="daily">Days</option>
              <option value="weekly">Weeks</option>
              <option value="monthly">Months</option>
              <option value="yearly">Years</option>
            </select>
          </Form>

          <button
            className="btn btn-ghost btn-outline text-error self-end"
            onClick={() => removeGroup.mutate(selectedGroup)}
          >
            <TrashIcon className="h-full" />
            Delete group
          </button>
        </div>
      )}
    </PageLayout>
  );
};

function Form(
  props: PropsWithChildren<{
    onSubmit: (values: Record<string, unknown>) => void;
  }>,
) {
  return (
    <form
      action="#"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit(
          Object.fromEntries(new FormData(e.target as HTMLFormElement)),
        );
      }}
    >
      {props.children}
    </form>
  );
}

const validateNewTaskForm = z
  .object({
    title: z.string(),
    frequency: z.string(),
    frequencyType: z.enum(["daily", "weekly", "monthly", "yearly"]),
  })
  .transform(function AsDbObject({ title, frequency, frequencyType }) {
    return {
      title: title,
      schedule: schedule(),
      groupId: 1 as unknown as number & { __brand: "taskGroupId" },
    };
    function schedule(): typeof recurringTasks.$inferSelect.schedule {
      switch (frequencyType) {
        case "daily":
          return { type: frequencyType, numberOfDays: parseInt(frequency) };
        case "weekly":
          return { type: frequencyType, numberOfWeeks: parseInt(frequency) };
        case "monthly":
          return { type: frequencyType, numberOfMonths: parseInt(frequency) };
        case "yearly":
          return { type: frequencyType, numberOfYears: parseInt(frequency) };
      }
    }
  });

// function FromDbObject(dbo: typeof recurringTasks.$inferSelect) {
//   return {
//     title: dbo.title,
//     frequencyType: dbo.schedule.type,
//     frequency: frequency(),
//   };
//   function frequency() {
//     switch (dbo.schedule.type) {
//       case "daily":
//         return dbo.schedule.numberOfDays.toString();
//       case "weekly":
//         return dbo.schedule.numberOfWeeks.toString();
//       case "monthly":
//         return dbo.schedule.numberOfMonths.toString();
//       case "yearly":
//         return dbo.schedule.numberOfYears.toString();
//     }
//   }
// }

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
