import type {
  OperationLink,
  TRPCClient,
  TRPCClientError,
  TRPCLink,
} from "@trpc/client";
import type {
  AnyTRPCProcedure,
  AnyTRPCRootTypes,
  AnyTRPCRouter,
  TRPCProcedureType,
  TRPCRouterRecord,
  inferProcedureInput,
  inferProcedureOutput,
  inferRouterOutputs,
} from "@trpc/server";
import { observable, tap } from "@trpc/server/observable";
import type { AppRouter } from "~/server/api/root";
import { fake } from "../optimisticUpdates/fake";
import type { TaskGroupId } from "~/app/_util/validators";
import type { QueryClient } from "@tanstack/react-query";
import type { useTRPC } from "~/trpc/react";
import type {
  DecorateProcedure,
  TRPCOptionsProxy,
  TRPCOptionsProxyOptions,
} from "node_modules/@trpc/tanstack-react-query/dist/internals/createOptionsProxy";
import type { TRPCQueryKey } from "@trpc/tanstack-react-query";

// type ScopedLinkOptions<TRouter extends AnyTRPCRouter> =
//   ScopedLinkOptionsRecursive<TRouter, TRouter["_def"]["record"]>;
// type ScopedLinkOptionsRecursive<
//   TRouter extends AnyTRPCRouter,
//   TRecord extends TRPCRouterRecord,
// > = {
//   [TKey in keyof TRecord]?: TRecord[TKey] extends infer $Value
//     ? $Value extends TRPCRouterRecord
//       ? ScopedLinkOptionsRecursive<TRouter, $Value>
//       : $Value extends AnyTRPCProcedure
//         ? ScopedLinkOptionsForProcedure<TRouter, $Value>
//         : never
//     : never;
// };
// type ScopedLinkOptionsForProcedure<
//   TRouter extends AnyTRPCRouter,
//   TProc extends AnyTRPCProcedure,
// > = OperationLink<
//   TRouter,
//   inferProcedureInput<TProc>,
//   inferProcedureOutput<TProc>
// > & { $proc: TProc };
// //   TProc extends Procedure<infer TProcType, infer TDef>
// //     ? OperationLink<
// //         TRouter,
// //         inferProcedureInput<TProc>,
// //         inferProcedureOutput<TProc>
// //       >
// //     : never;

// type AnyScopedLinkOptions<TRouter extends AnyTRPCRouter> =
//   | {
//       [T in string]: AnyScopedLinkOptions<TRouter>;
//     }
//   | OperationLink<TRouter>;

// export function scopedLinkOld<TRouter extends AnyTRPCRouter>(
//   options: ScopedLinkOptions<TRouter>,
// ): TRPCLink<TRouter> {
//   return () => {
//     return ({ next, op }) => {
//       const matchedLink = op.path
//         .split(".")
//         .reduce<
//           AnyScopedLinkOptions<TRouter> | undefined
//         >((links, pathSegment) => (typeof links === "function" ? links : links?.[pathSegment]), options as AnyScopedLinkOptions<TRouter>);
//       if (typeof matchedLink === "function") {
//         return matchedLink({ next, op });
//       } else {
//         return next(op);
//       }
//     };
//   };
// }
// export function _proc<
//   TRouter extends AnyTRPCRouter,
//   TProc extends AnyTRPCProcedure,
// >(
//   link: OperationLink<
//     TRouter,
//     inferProcedureInput<TProc>,
//     inferProcedureOutput<TProc>
//   >,
// ) {
//   return link as ScopedLinkOptionsForProcedure<TRouter, TProc>;
// }

export function scopedLink<
  TDecProc extends DecorateProcedure<
    "query",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { input: void; output: any; transformer: any; errorShape: any }
  >,
  TRouter extends AnyTRPCRouter,
>(
  endpoint: TDecProc,
  link: OperationLink<
    TRouter,
    TDecProc["~types"]["input"],
    TDecProc["~types"]["output"]
  >,
): TRPCLink<TRouter> {
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const path = endpoint.pathKey().flat().join(".");
  return () =>
    ({ next, op }) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      op.path.startsWith(path) ? link({ next, op: op as any }) : next(op);
}

export function listenForEventsLink<
  TInput,
  TOutput,
  //   TProc extends AnyTRPCProcedure,
  TRouter extends AnyTRPCRouter,
  TToken = void,
>(handler: {
  onInput: (value: TInput) => TToken;
  onError?: (error: TRPCClientError<TRouter>, token: TToken) => void;
  onSuccess?: (result: TOutput, token: TToken) => void;
  onSettled?: (token: TToken) => void;
}): OperationLink<TRouter, TInput, TOutput> {
  return ({ op, next }) => {
    const token = handler.onInput(op.input);
    return next(op).pipe(
      tap({
        next(value) {
          if (value.result.data) {
            handler.onSuccess?.(value.result.data, token);
          }
        },
        error(err) {
          handler.onError?.(err, token);
        },
        complete() {
          handler.onSettled?.(token);
        },
      }),
    );
  };
}

export function alterResultLink<T>(
  alteration: (valueFromServer: T) => T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): OperationLink<any, any, T> {
  return ({ op, next }) =>
    observable((observer) =>
      next(op).subscribe({
        next(value) {
          observer.next(
            value.result.data
              ? ({
                  ...value,
                  result: {
                    ...value.result,
                    data: alteration(value.result.data),
                  },
                } as typeof value)
              : value,
          );
        },
        error: observer.error,
        complete: observer.complete,
      }),
    );
}

interface HasLink {
  link: TRPCLink<AnyTRPCRouter>;
}

type AnyProcedure<TEndpointType extends TRPCProcedureType> = DecorateProcedure<
  TEndpointType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { input: any; output: any; transformer: any; errorShape: any }
>;

abstract class EndpointSpecific<
  TEndpointType extends "query" | "mutation",
  TEndpoint extends AnyProcedure<TEndpointType>,
> implements HasLink
{
  constructor(
    protected readonly endpoint: TEndpoint,
    private readonly endpointType: TEndpointType,
  ) {}
  protected abstract run: OperationLink<
    AnyTRPCRouter,
    TEndpoint["~types"]["input"],
    TEndpoint["~types"]["output"]
  >;
  link: TRPCLink<AnyTRPCRouter> = () => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const pathPrefix = (
      this.endpointType === "query"
        ? (this.endpoint as AnyProcedure<"query">).pathKey()
        : (this.endpoint as AnyProcedure<"mutation">).mutationKey()
    )
      .flat()
      .join(".");
    return ({ next, op }) =>
      op.path.startsWith(pathPrefix)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          this.run({ next, op: op as any })
        : next(op);
  };
}

abstract class ProvideFakeValuesForQuery<
  TEndpoint extends DecorateProcedure<
    "query",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { input: void; output: any; transformer: any; errorShape: any }
  >,
> extends EndpointSpecific<"query", TEndpoint> {
  constructor(
    private readonly queryClient: QueryClient,
    endpoint: TEndpoint,
  ) {
    super(endpoint, "query");
  }
  protected run: EndpointSpecific<"query", TEndpoint>["run"] = alterResultLink(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (x) => this.alter(x),
  );

  private lastRealResult: TEndpoint["~types"]["output"] = undefined!;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  public readonly getLatestCachedValue = () => this.alter(this.lastRealResult);
  protected abstract alter(
    value: TEndpoint["~types"]["output"],
  ): TEndpoint["~types"]["output"];
  protected invalidate() {
    void this.queryClient.invalidateQueries({
      queryKey: this.endpoint.queryKey(),
    });
  }
  public refreshClientDataWithoutRefetching() {
    this.queryClient.setQueryData(
      this.endpoint.queryKey(),
      this.getLatestCachedValue(),
    );
  }
}

class ExtraFakeValuesInArray<
  TEndpoint extends DecorateProcedure<
    "query",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { input: void; output: any[]; transformer: any; errorShape: any }
  >,
  Id extends string | number,
> extends ProvideFakeValuesForQuery<TEndpoint> {
  constructor(
    queryClient: QueryClient,
    endpoint: TEndpoint,
    private readonly getId: (v: TEndpoint["~types"]["output"][0]) => Id,
  ) {
    super(queryClient, endpoint);
  }
  private fakeItems = {} as Record<Id, TEndpoint["~types"]["output"][0]>;
  private realIDMap = {} as Record<Id, Id>;

  public removeFakeItem(fakeID: Id) {
    delete this.fakeItems[fakeID];
  }
  protected alter(valuesFromServer: TEndpoint["~types"]["output"][0][]) {
    for (const value of valuesFromServer) {
      const id = this.getId(value);
      if (this.realIDMap[id]) {
        this.removeFakeItem(this.realIDMap[id]);
        delete this.realIDMap[id];
      }
    }
    return [
      ...valuesFromServer,
      ...Object.values<typeof valuesFromServer>(this.fakeItems),
    ];
  }
  public addFakeItem(item: TEndpoint["~types"]["output"][0]) {
    this.fakeItems[this.getId(item)] = item;
  }
  public recordRealId(fakeId: Id, realId: Id, invalidate = true) {
    this.realIDMap[realId] = fakeId;
    if (invalidate) {
      this.invalidate();
    }
  }
}

class ListenOnMutation<
  TEndpoint extends DecorateProcedure<
    "mutation",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { input: any; output: any; transformer: any; errorShape: any }
  >,
  TToken,
> extends EndpointSpecific<"mutation", TEndpoint> {
  constructor(
    endpoint: TEndpoint,
    private readonly handler: {
      onInput: (value: TEndpoint["~types"]["input"]) => TToken;
      onError?: (
        error: TEndpoint["~types"]["errorShape"],
        token: TToken,
      ) => void;
      onSuccess?: (
        result: TEndpoint["~types"]["output"],
        token: TToken,
      ) => void;
      onSettled?: (token: TToken) => void;
    },
  ) {
    super(endpoint, "mutation");
  }
  protected run: EndpointSpecific<"mutation", TEndpoint>["run"] = ({
    op,
    next,
  }) => {
    const handler = this.handler;
    const token = handler.onInput(op.input);

    return next(op).pipe(
      tap({
        next(value) {
          if (value.result.data) {
            handler.onSuccess?.(value.result.data, token);
          }
        },
        error(err) {
          handler.onError?.(err, token);
        },
        complete() {
          handler.onSettled?.(token);
        },
      }),
    );
  };
}

export function optimisticallyAddGroups(
  queryClient: QueryClient,
  trpc: TRPCOptionsProxy<AppRouter>,
): TRPCLink<AppRouter>[] {
  const cache = new ExtraFakeValuesInArray(
    queryClient,
    trpc.task.allGroups,
    (group) => group.id,
  );
  const updateCacheOnAdd = new ListenOnMutation(trpc.task.addGroup, {
    onInput(value) {
      const id = fake.taskGroupId();
      cache.addFakeItem({
        ...value,
        id,
        createdAt: new Date(),
        deletedAt: new Date(),
        tasks: [],
        updatedAt: new Date(),
        userId: fake.userId(),
        lastNotification: new Date().toDateString(),
      });
      cache.refreshClientDataWithoutRefetching();
      return id;
    },
    onError(error, token) {
      cache.removeFakeItem(token);
      cache.refreshClientDataWithoutRefetching();
    },
    onSuccess(result, token) {
      cache.recordRealId(token, result);
    },
  });
  return [cache.link, updateCacheOnAdd.link];
}
