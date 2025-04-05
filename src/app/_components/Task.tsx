"use client";

import { Button, Card } from "flowbite-react";
import { useCallback, type FC } from "react";
import type { recurringTasks } from "~/server/db/schema";
import { api } from "~/trpc/react";

export const Task: FC<
  typeof recurringTasks.$inferSelect & {
    onChange?: () => void;
  }
> = (props) => {
  const remove = api.task.remove.useMutation();
  const deleteThis = useCallback(() => {
    void remove.mutateAsync({ id: props.id }).then(props.onChange);
  }, [props.id, props.onChange, remove]);
  return (
    <Card className="max-w-sm">
      <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {props.title}
      </h5>
      <p className="font-normal text-gray-700 dark:text-gray-400">
        Here are the biggest enterprise technology acquisitions of 2021 so far,
        in reverse chronological order.
      </p>
      <Button color="red" onClick={deleteThis}>
        Delete
      </Button>
    </Card>
  );
};
