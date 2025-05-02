import type {
  AnyTRPCRouter,
  TRPCRouterRecord,
  AnyTRPCProcedure,
  inferProcedureInput,
  inferTransformedProcedureOutput,
  TRPCProcedureType,
} from "@trpc/server";
import { createRecursiveProxy } from "@trpc/server/unstable-core-do-not-import";
import type { TRPCMutationKey, TRPCQueryKey } from "@trpc/tanstack-react-query";
import type { AppRouter } from "~/server/api/root";
import { isFunction, isObject } from "@trpc/server/unstable-core-do-not-import";
import { skipToken, type QueryClient } from "@tanstack/react-query";
import type { OperationLink, TRPCLink } from "@trpc/client";
import { map, tap } from "@trpc/server/observable";
import { fake } from "../optimisticUpdates/fake";

/**
 * To allow easy interactions with groups of related queries, such as
 * invalidating all queries of a router, we use an array as the path when
 * storing in tanstack query.
 *
 * @internal
 */
function getQueryKeyInternal(
  path: readonly string[],
  input?: unknown,
  type?: "any" | "infinite" | "query",
): TRPCQueryKey {
  // Construct a query key that is easy to destructure and flexible for
  // partial selecting etc.
  // https://github.com/trpc/trpc/issues/3128

  // some parts of the path may be dot-separated, split them up
  const splitPath = path.flatMap((part) => part.split("."));

  if (!input && (!type || type === "any")) {
    // this matches also all mutations (see `getMutationKeyInternal`)

    // for `utils.invalidate()` to match all queries (including vanilla react-query)
    // we don't want nested array if path is empty, i.e. `[]` instead of `[[]]`
    return splitPath.length ? [splitPath] : ([] as unknown as TRPCQueryKey);
  }

  if (
    type === "infinite" &&
    isObject(input) &&
    ("direction" in input || "cursor" in input)
  ) {
    const {
      cursor: _,
      direction: __,
      ...inputWithoutCursorAndDirection
    } = input;
    return [
      splitPath,
      {
        input: inputWithoutCursorAndDirection,
        type: "infinite",
      },
    ];
  }

  return [
    splitPath,
    {
      ...(typeof input !== "undefined" &&
        input !== skipToken && { input: input }),
      ...(type && type !== "any" && { type: type }),
    },
  ];
}

/**
 * @internal
 */
export function getMutationKeyInternal(
  path: readonly string[],
): TRPCMutationKey {
  // some parts of the path may be dot-separated, split them up
  const splitPath = path.flatMap((part) => part.split("."));

  return splitPath.length ? [splitPath] : ([] as unknown as TRPCMutationKey);
}

type EndpointProxy<TRouter extends AnyTRPCRouter> = EndpointProxyRecord<
  TRouter["_def"]["_config"]["$types"],
  TRouter["_def"]["record"]
>;
type EndpointProxyRecord<
  TRouter extends AnyTRPCRouter,
  TRecord extends TRPCRouterRecord,
> = {
  [TKey in keyof TRecord]: TRecord[TKey] extends infer $Value
    ? $Value extends TRPCRouterRecord
      ? EndpointProxyRecord<TRouter, $Value>
      : $Value extends AnyTRPCProcedure
        ? Endpoint<
            $Value["_def"]["type"],
            inferProcedureInput<$Value>,
            inferTransformedProcedureOutput<
              TRouter["_def"]["_config"]["$types"],
              $Value
            >
            // TRouter["_def"]["_config"]["$types"]["errorShape"],
            // TRouter["_def"]["_config"]["$types"]["transformer"]
          >
        : never
    : never;
};

type Endpoint<TEndpointType extends TRPCProcedureType, TInput, TOutput> = {
  pathKey: () => TRPCQueryKey;
} & (TEndpointType extends "query"
  ? {
      queryKey: (input: TInput) => TRPCQueryKey;
      optimisticCache: (
        defaultValue: TOutput,
        sources: AnyOptimisticCacheSource<TInput, TOutput>[],
      ) => TRPCLink<AnyTRPCRouter>[];
    }
  : TEndpointType extends "mutation"
    ? {
        mutationKey: () => TRPCQueryKey;
        optimisticDataSource: <TTargetInput, TTargetOutput>(
          onMutate: (
            input: TInput,
          ) => MutationMethods<
            TTargetInput,
            TTargetOutput,
            TOutput
          >,
        ) => OptimisticCacheSource<
          TTargetInput,
          TTargetOutput,
          TInput,
          TOutput
        >;
      }
    : {
        subscriptionKey: (input: TInput) => TRPCQueryKey;
      });

type CacheHandler<TOutput> = (
  fromServer: TOutput,
) => { stop: false; value: TOutput } | { stop: true };
type MutationMethods<TTargetInput, TTargetOutput, TOutput> = {
  injectOptimisticData: CacheHandler<TTargetOutput>;
  queryParameters: TTargetInput;
  onSuccess?: (mutationResult: TOutput) => void;
};

type OptimisticCacheSource<TTargetInput, TTargetOutput, TInput, TOutput> = {
  mutationPathKey: TRPCQueryKey,
  onMutate: (
    input: TInput,
  ) => MutationMethods<TTargetInput, TTargetOutput, TOutput>;
};
type AnyOptimisticCacheSource<TTargetInput, TTargetOutput> =
  OptimisticCacheSource<
    TTargetInput,
    TTargetOutput,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;

function createTRPCLinkProxy<TRouter extends AnyTRPCRouter>(
  queryClient: QueryClient,
) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const methods = implementation() as Record<string, Function>;
  return createRecursiveProxy<EndpointProxy<TRouter>>(
    ({ path: _path, args }) => {
      const path = [..._path]; // _path is readonly, we make a copy first thing.
      const methodName = path.pop()!;
      return methods[methodName]!.call(methods, path, ...args);
    },
  );

  function implementation<TInput, TOutput>(): EndpointImplementation<
    TInput,
    TOutput
  > {
    return {
      mutationKey(path) {
        return getMutationKeyInternal(path);
      },
      queryKey(path, input) {
        return getQueryKeyInternal(path, input, "query");
      },
      subscriptionKey(path, input) {
        return getQueryKeyInternal(path, input, "any");
      },
      optimisticDataSource(path, onMutate) {
          return {
            mutationPathKey: this.pathKey(path),
            onMutate: onMutate,
            
          }
      },
      optimisticCache(path, defaultValue, sources) {
        const cache: Record<
          string,
          {
            attachedOptimisticUpdates: Array<
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              MutationMethods<TInput, TOutput, any>
            >;
            latestValueFromServer: TOutput;
          }
        > = {};

        const withInput = (input: TInput) => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          const queryKey = this.queryKey(path, input).flat().join(".");
          return (
            cache[queryKey] ??
            (cache[queryKey] = {
              attachedOptimisticUpdates: [],
              latestValueFromServer: defaultValue,
            })
          );
        };

        function evaluate(input: TInput, fromServer: TOutput) {
          const { attachedOptimisticUpdates } = withInput(input);
          const toRemove: number[] = [];
          attachedOptimisticUpdates.forEach((m, index) => {
            const altered = m.injectOptimisticData(fromServer);
            if (altered.stop) {
              toRemove.push(index);
            } else {
              fromServer = altered.value;
            }
          });
          toRemove.forEach((r) => attachedOptimisticUpdates.splice(r, 1));
          return fromServer;
        }

        const watchThis = scope(this.pathKey(path), ({ op, next }) => {
          return next(op).pipe(
            map((value) => {
              if (value.result.data) {
                withInput(op.input);
                return {
                  ...value,
                  result: {
                    ...value.result,
                    data: evaluate(op.input, value.result.data),
                  },
                } as typeof value;
              } else {
                return value;
              }
            }),
          );
        });

        const watchSources = sources.map((mutationDataSource) => {
          return scope(
            mutationDataSource.mutationPathKey,
            ({ op, next }) => {
              const mutationMethods = mutationDataSource.onMutate(op.input);
              let aborted = false;
              withInput(
                mutationMethods.queryParameters,
              ).attachedOptimisticUpdates.push({
                ...mutationMethods,
                injectOptimisticData: (fromServer) =>
                  aborted
                    ? { stop: true }
                    : mutationMethods.injectOptimisticData(fromServer),
              });
              return next(op).pipe(
                tap({
                  next(value) {
                    const data = value.result.data;
                    if (data) mutationMethods.onSuccess?.(data);
                  },
                  error(err) {
                    aborted = true;
                  },
                  complete() {
                    aborted = true;
                  },
                }),
              );
            },
          );
        });
        return [watchThis, ...watchSources];
      },
      pathKey(path) {
        return getQueryKeyInternal(path);
      },
    };
    function scope(
      key: TRPCQueryKey,
      link: OperationLink<TRouter, TInput, TOutput>,
    ): TRPCLink<AnyTRPCRouter> {
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const prefix = key.flat().join(".");
        return ({ op, next }) => {
          return op.path.startsWith(prefix)
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
              link({ next, op: op as any })
            : next(op);
        };
      };
    }
  }
}

type GenericE<TInput, TOutput> = Endpoint<"query", TInput, TOutput> &
  Endpoint<"mutation", TInput, TOutput> &
  Endpoint<"subscription", TInput, TOutput>;
type EndpointImplementation<TInput, TOutput> = {
  [K in keyof GenericE<TInput, TOutput>]: GenericE<TInput, TOutput>[K] extends (
    ...args: infer Args
  ) => infer Return
    ? (path: readonly string[], ...args: Args) => Return
    : never;
};

export function optimisticallyAddGroups(
  queryClient: QueryClient,
): TRPCLink<AppRouter>[] {
  const trpcLink = createTRPCLinkProxy<AppRouter>(queryClient);

  return trpcLink.task.allGroups.optimisticCache(
    [],
    [
        trpcLink.task.addGroup.optimisticDataSource(newGroup => {
            const fakeGroup = {
                ...newGroup,
                id: fake.taskGroupId(),
                //   createdAt: new Date(),
                //   deletedAt: new Date(),
                createdAt: "",
                deletedAt: "",
                tasks: [],
                updatedAt: "",
                userId: fake.userId(),
                lastNotification: new Date().toDateString(),
              };
              let realID: typeof fakeGroup.id | undefined;
              return {
                queryParameters: undefined,
                injectOptimisticData: (fromServer) =>
                  realID && fromServer.find((x) => x.id === realID)
                    ? { stop: true }
                    : { stop: false, value: [...fromServer, fakeGroup] },
                onSuccess(mutationResult) {
                  realID = mutationResult;
                },
              };
        })
    ],
  );
}
