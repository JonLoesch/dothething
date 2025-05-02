import { fake } from "./fake";
import {
  layerOptions,
  withClientOptions,
  withMutation,
  withTRPC,
} from "./utils";

export const taskOptimisticUpdates = withTRPC(
  (trpc, queryClient) =>
    ({
      // addGroup: withClientOptions((clientOptions) =>
      //   layerOptions(
      //     trpc.task.addGroup,
      //     {
      //       async onMutate(variables) {
      //         await queryClient.cancelQueries(trpc.task.allGroups.pathFilter());
      //         const prevData = queryClient.getQueryData(
      //           trpc.task.allGroups.queryKey(),
      //         );
      //         queryClient.setQueryData(trpc.task.allGroups.queryKey(), (x) => {
      //           return [
      //             ...(x ?? []),
      //             {
      //               ...variables,
      //               id: fake.taskGroupId(),
      //               createdAt: new Date(),
      //               deletedAt: new Date(),
      //               tasks: [],
      //               updatedAt: new Date(),
      //               userId: fake.userId(),
      //               lastNotification: new Date().toDateString(),
      //             },
      //           ];
      //         });
      //         return { prevData };
      //       },
      //       onError(_error, _variables, context) {
      //         queryClient.setQueryData(
      //           trpc.task.allGroups.queryKey(),
      //           context?.prevData,
      //         );
      //       },
      //       onSettled(_data, _error, _variables, _context) {
      //         void queryClient.invalidateQueries(
      //           trpc.task.allGroups.pathFilter(),
      //         );
      //       },
      //     },
      //     clientOptions,
      //   ),
      // ),
      add: withClientOptions((clientOptions) =>
        layerOptions(
          trpc.task.add,
          {
            async onMutate(variables) {
              await queryClient.cancelQueries(trpc.task.allGroups.pathFilter());
              const prevData = queryClient.getQueryData(
                trpc.task.allGroups.queryKey(),
              );
              queryClient.setQueryData(trpc.task.allGroups.queryKey(), (x) => {
                return [
                  ...(x ?? []).map(({ tasks, ...group }) => ({
                    ...group,
                    tasks:
                      variables.groupId === group.id
                        ? [
                            ...tasks,
                            {
                              id: fake.taskId(),
                              groupId: fake.taskGroupId(),
                              title: variables.title,
                              createdAt: new Date(),
                              deletedAt: new Date(),
                              tasks: [],
                              updatedAt: new Date(),
                              nextDueDate: new Date().toDateString(),
                              userId: fake.userId(),
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
              queryClient.setQueryData(
                trpc.task.allGroups.queryKey(),
                context?.prevData,
              );
            },
            onSettled(_data, _error, _variables, _context) {
              void queryClient.invalidateQueries(
                trpc.task.allGroups.pathFilter(),
              );
            },
          },
          clientOptions,
        ),
      ),
      removeGroup: withClientOptions((clientOptions) =>
        layerOptions(
          trpc.task.removeGroup,
          {
            async onMutate(variables) {
              await queryClient.cancelQueries(trpc.task.allGroups.pathFilter());
              const prevData = queryClient.getQueryData(
                trpc.task.allGroups.queryKey(),
              );
              queryClient.setQueryData(trpc.task.allGroups.queryKey(), (x) => {
                return (x ?? []).filter((group) => group.id !== variables.id);
              });
              return { prevData };
            },
            onError(_error, _variables, context) {
              queryClient.setQueryData(
                trpc.task.allGroups.queryKey(),
                context?.prevData,
              );
            },
            // onSettled(_data, _error, _variables, _context) {
            // },
            async onSuccess() {
              await queryClient.invalidateQueries(
                trpc.task.allGroups.pathFilter(),
              );
            },
          },
          clientOptions,
        ),
      ),
    }) as const,
);
