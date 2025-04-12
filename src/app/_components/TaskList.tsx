"use client";

import { useCallback, useMemo, useState, type FC } from "react";
import { api } from "~/trpc/react";
import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
  Button,
  ButtonGroup,
  Label,
  Select,
  TextInput,
} from "flowbite-react";
import { scheduleValidator, type recurringTasks } from "~/server/db/schema";
import { z } from "zod";
import { EnumSelect } from "../_util/EnumSelect";
import { create } from "zustand";

function useTaskState(init?: {
  title: string,
  frequency: string,
  frequencyType: z.infer<typeof scheduleValidator>["type"]
}) {
  const [title, setTitle] = useState(init?.title ?? "");
  const [frequency, setFrequency] = useState(init?.frequency ?? "1");
  const [frequencyType, setFrequencyType] =
    useState<z.infer<typeof scheduleValidator>["type"]>(init?.frequencyType ?? "weekly");

  return useMemo(
    () => ({
      frequency,
      frequencyType,
      setFrequency,
      setFrequencyType,
      title,
      setTitle,
    }),
    [frequency, frequencyType, title],
  );
}
// const useTaskState = create<{
//   frequency: number;
//   setFrequency: (v: number) => void;
//   frequencyType: z.infer<typeof scheduleValidator>["type"];
//   setFrequencyType: (v: z.infer<typeof scheduleValidator>["type"]) => void;
// }>()((set) => ({
//   frequency: 1,
//   frequencyType: "weekly",
//   setFrequency: (v: number) => set({ frequency: v }),
//   setFrequencyType: (v: z.infer<typeof scheduleValidator>["type"]) =>
//     set({ frequencyType: v }),
// }));

export const TaskList: FC<{
  initialTasks: Array<typeof recurringTasks.$inferSelect>;
}> = (props) => {
  const all = api.task.all.useQuery(undefined, {
    initialData: props.initialTasks,
  });
  const newTask = useTaskState();
  const add = api.task.add.useMutation();
  useState<z.infer<typeof scheduleValidator>["type"]>("weekly");

  const submitNewTask = useCallback(() => {
    void add.mutateAsync(AsDbObject(newTask)).then(() => {
      void all.refetch();
      newTask.setTitle("");
    });
  }, [add, all, newTask]);

  return (
    <div className="flex max-w-md flex-col gap-4">
      {all.isSuccess && (
        <Accordion>
          {all.data.map((t) => (
            <AccordionPanel key={t.id}>
              <Task {...t} onChange={() => all.refetch()} />
            </AccordionPanel>
          ))}
        </Accordion>
      )}

      <TaskEdit
        state={newTask}
        completions={[
          {
            label: "Add New Task",
            primary: true,
            handler: submitNewTask,
          },
        ]}
      />
    </div>
  );
};

function FromDbObject(dbo: typeof recurringTasks.$inferSelect) {
  return {
    title: dbo.title,
    frequencyType: dbo.schedule.type,
    frequency: frequency(),
  };
  function frequency() {
    switch(dbo.schedule.type) {
      case 'daily': return dbo.schedule.numberOfDays.toString();
      case 'weekly': return dbo.schedule.numberOfWeeks.toString();
      case 'monthly': return dbo.schedule.numberOfMonths.toString();
      case 'yearly': return dbo.schedule.numberOfYears.toString();
    }
  }
}

function AsDbObject({
  title,
  frequency,
  frequencyType,
}: ReturnType<typeof useTaskState>): Pick<
  typeof recurringTasks.$inferSelect,
  "schedule" | "title"
> {
  return {
    title: title,
    schedule: schedule(),
  };
  function schedule():  typeof recurringTasks.$inferSelect.schedule {
    switch(frequencyType) {
      case 'daily': return {type: frequencyType, numberOfDays: parseInt(frequency)};
      case 'weekly': return {type: frequencyType, numberOfWeeks: parseInt(frequency)};
      case 'monthly': return {type: frequencyType, numberOfMonths: parseInt(frequency)};
      case 'yearly': return {type: frequencyType, numberOfYears: parseInt(frequency)};
    }
  }
}

function TaskEdit(props: {
  state: ReturnType<typeof useTaskState>;
  completions: Array<{
    label: string;
    primary?: boolean;
    handler: () => void;
  }>;
}) {
  return (
    <form className="flex flex-col gap-4">
      <div className="mb-2 block">
        <Label htmlFor="title">New Task</Label>
      </div>
      <TextInput
        id="title"
        type="text"
        placeholder="Do The Thing!"
        required
        value={props.state.title}
        onChange={(e) => props.state.setTitle(e.target.value)}
      />
      Every{" "}
      <TextInput
        id="frequency"
        type="number"
        required
        value={props.state.frequency}
        onChange={(e) => props.state.setFrequency(e.target.value)}
      />
      <EnumSelect
        value={props.state.frequencyType}
        setValue={props.state.setFrequencyType}
        enumLabels={{
          daily: "Days",
          weekly: "Weeks",
          monthly: "Months",
          yearly: "Years",
        }}
      />
      <ButtonGroup>
        {props.completions.map((c, index) => (
          <Button
            key={index}
            type={c.primary ? "submit" : undefined}
            onClick={c.handler}
            color={c.primary ? 'default' : 'alternative'}
          >
            {c.label}
          </Button>
        ))}
      </ButtonGroup>
    </form>
  );
}

const Task: FC<
  typeof recurringTasks.$inferSelect & {
    onChange?: () => void;
  }
> = (props) => {
  const remove = api.task.remove.useMutation();
  const edit = api.task.edit.useMutation();
  const deleteThis = useCallback(() => {
    void remove.mutateAsync({ id: props.id }).then(props.onChange);
  }, [props.id, props.onChange, remove]);
  const [editing, setEditing] = useState(false);
  const editBuffer = useTaskState(FromDbObject(props));

  return (
    <>
      <AccordionTitle>
        {props.title}
        <span className="opacity-50"> - {displaySchedule(props.schedule)}</span>
      </AccordionTitle>
      <AccordionContent>
        {editing ? (
          <TaskEdit
            state={editBuffer}
            completions={[
              {
                label: "Discard changes",
                handler: () => setEditing(false),
              },
              {
                label: "Save changes",
                primary: true,
                handler: () => {
                  void edit
                    .mutateAsync({ ...AsDbObject(editBuffer), id: props.id })
                    .then(() => {
                      setEditing(false);
                    })
                    .then(props.onChange);
                },
              },
            ]}
          />
        ) : (
          <ButtonGroup>
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button color="red" onClick={deleteThis}>
              Delete
            </Button>
          </ButtonGroup>
        )}
      </AccordionContent>
    </>
  );
};

function displaySchedule(schedule: z.infer<typeof scheduleValidator>) {
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
