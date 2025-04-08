"use client";

import { useCallback, useState, type FC } from "react";
import { api } from "~/trpc/react";
import {
  Accordion,
  AccordionContent,
  AccordionPanel,
  AccordionTitle,
  Button,
  Label,
  TextInput,
} from "flowbite-react";
import type { recurringTasks } from "~/server/db/schema";

export const TaskList: FC<{
  initialTasks: Array<typeof recurringTasks.$inferSelect>;
}> = (props) => {
  const all = api.task.all.useQuery(undefined, {
    initialData: props.initialTasks,
  });
  const add = api.task.add.useMutation();
  const [newTitle, setNewTitle] = useState("");

  const submitNewTask = useCallback(() => {
    void add.mutateAsync({ title: newTitle }).then(() => all.refetch());
    setNewTitle("");
  }, [add, all, newTitle, setNewTitle]);

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
      <div>
        <div className="mb-2 block">
          <Label htmlFor="title">New Task</Label>
        </div>
        <TextInput
          id="title"
          type="title"
          placeholder="Do The Thing!"
          required
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onSubmit={submitNewTask}
        />
      </div>

      <Button type="submit" onClick={submitNewTask}>
        Add New Task
      </Button>
    </div>
  );
};

const Task: FC<
  typeof recurringTasks.$inferSelect & {
    onChange?: () => void;
  }
> = (props) => {
  const remove = api.task.remove.useMutation();
  const deleteThis = useCallback(() => {
    void remove.mutateAsync({ id: props.id }).then(props.onChange);
  }, [props.id, props.onChange, remove]);
  return (
    <>
      <AccordionTitle>{props.title}</AccordionTitle>
      <AccordionContent>
        This is test content
        <Button color="red" onClick={deleteThis}>
          Delete
        </Button>
      </AccordionContent>
    </>
  );
};
