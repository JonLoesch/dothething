"use client";

import { useCallback, useState, type FC } from "react";
import { api } from "~/trpc/react";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { Task } from "./Task";

export const TaskList: FC = () => {
  const all = api.task.schedule.useQuery();
  const add = api.task.add.useMutation();
  const [newTitle, setNewTitle] = useState("");

  const submitNewTask = useCallback(() => {
    void add.mutateAsync({ title: newTitle }).then(() => all.refetch());
    setNewTitle("");
  }, [add, all, newTitle, setNewTitle]);

  return (
    <div className="flex max-w-md flex-col gap-4">
      {all.isSuccess &&
        all.data.map((x) => <Task {...x} key={x.id} onChange={all.refetch} />)}
      <div>
        <div className="mb-2 block">
          <Label htmlFor="email1">New Task</Label>
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
