import type { DefaultError, MutationOptions } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { UseTRPCMutationOptions } from "@trpc/react-query/shared";
import type {
  AnyProcedure,
  inferProcedureInput,
  inferProcedureOutput,
  inferTransformedProcedureOutput,
} from "@trpc/server";
import type { DecoratedMutation } from "node_modules/@trpc/react-query/dist/createTRPCReact";
import { options } from "prettier-plugin-tailwindcss";
import { useMemo } from "react";
import { _brand } from "~/app/_util/brandId";
import type { taskRouter } from "~/server/api/routers/task";
import { useTRPC } from "~/trpc/react";
import { type AppRouter } from "~/server/api/root";
import { currentTimezone } from "~/app/_util/timeZone";

import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

let dec = -1;

export function useAddGroup(
  extraOptions: ExposedOptions<InferDef<typeof taskRouter.addGroup>>,
) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  return useMutationWithExtraOptions(api.task.addGroup, extraOptions, {
    async onMutate(variables) {
      await queryClient.cancelQueries(api.task.allGroups.pathFilter());
      const prevData = queryClient.getQueryData(api.task.allGroups.queryKey());
      queryClient.setQueryData(api.task.allGroups.queryKey(), (x) => {
        return [
          ...(x ?? []),
          {
            ...variables,
            id: _brand(dec--),
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
      queryClient.setQueryData(api.task.allGroups.queryKey(), context?.prevData);
    },
    onSettled(_data, _error, _variables, _context) {
      void queryClient.invalidateQueries(api.task.allGroups.pathFilter());
    },
  });
}

export function useAddTask(
  extraOptions: ExposedOptions<InferDef<typeof taskRouter.add>>,
) {
  
  const queryClient = useQueryClient();
  return useMutationWithExtraOptions(api.task.add, extraOptions, {
    async onMutate(variables) {
      await queryClient.cancelQueries(api.task.allGroups.pathFilter());
      const prevData = queryClient.getQueryData(api.task.allGroups.queryKey());
      queryClient.setQueryData(api.task.allGroups.queryKey(), (x) => {
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
      queryClient.setQueryData(api.task.allGroups.queryKey(), context?.prevData);
    },
    onSettled(_data, _error, _variables, _context) {
      void queryClient.invalidateQueries(api.task.allGroups.pathFilter());
    },
  });
}

export function useRemoveGroup(extraOptions : ExposedOptions<InferDef<typeof taskRouter.removeGroup>>) {
  const api = useTRPC();

  const queryClient = useQueryClient();
  return useMutation(api.task.removeGroup.mutationOptions({
    async onMutate(variables) {
      await queryClient.cancelQueries(api.task.allGroups.pathFilter());
      const prevData = queryClient.getQueryData(api.task.allGroups.queryKey());
      queryClient.setQueryData(api.task.allGroups.queryKey(), (x) => {
        return (x ?? []).filter((group) => group.id !== variables.id);
      });
      return { prevData };
    },
    onError(_error, _variables, context) {
      queryClient.setQueryData(api.task.allGroups.queryKey(), context?.prevData);
    },
    // onSettled(_data, _error, _variables, _context) {
    // },
    async onSuccess() {
      await queryClient.invalidateQueries(api.task.allGroups.pathFilter());
    },
  }));
}

// There's probably a better way to do this, but this hacky thing works:

function useMutationWithExtraOptions<Def extends ResolverDef, Context>(
  mutation: DecoratedMutation<Def>,
  extraOptions: ExposedOptions<Def>,
  options: Options<Def, Context>,
) {
  const api = useTRPC();
  return useMutation(mutation.mutationOptions(
    useMemo(
      () => ({
        ...options,
        onMutate: mergeSingle(options.onMutate, extraOptions.onMutate),
        onError: mergeSingle(options.onError, extraOptions.onError),
        onSuccess: mergeSingle(options.onSuccess, extraOptions.onSuccess),
        onSettled: mergeSingle(options.onSettled, extraOptions.onSettled),
      }),
      [options, extraOptions],
    ),
  ));
}

type ResolverDef = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any;
  transformer: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorShape: any;
};

type Options<Def extends ResolverDef, Context> = UseTRPCMutationOptions<
  Def["input"],
  TRPCClientErrorLike<Def>,
  Def["output"],
  Context
>;
type ExposedOptions<Def extends ResolverDef, Context = unknown> = NoReturns<
  Pick<
    Options<Def, Context>,
    "onError" | "onSettled" | "onSuccess" | "onMutate"
  >
>;

type NoReturns<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]: Exclude<T[K], undefined> extends (...p: infer P) => any
    ? (...p: P) => Promise<void> | void
    : never;
};
function mergeSingle<Args extends unknown[], Result>(
  provided?: (...args: Args) => Promise<Result> | Result,
  exposed?: (...args: Args) => Promise<void> | void,
) {
  return async (...args: Args) => {
    const result = await provided?.call(null, ...args);
    await exposed?.call(null, ...args);
    return result;
  };
}

type InferDef<Procedure extends AnyProcedure> = {
  input: inferProcedureInput<Procedure>;
  output: inferTransformedProcedureOutput<AppRouter, Procedure>;
  transformer: AppRouter["_def"]["_config"]["$types"]["transformer"];
  errorShape: AppRouter["_def"]["_config"]["$types"]["errorShape"];
};
