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
  inferTransformedProcedureOutput,
} from "@trpc/server";
import {
  map,
  observable,
  tap,
  type Observable,
  type Observer,
} from "@trpc/server/observable";
import type { AppRouter } from "~/server/api/root";
import { fake } from "../optimisticUpdates/fake";
import type { TaskGroupId } from "~/app/_util/validators";
import type { QueryClient } from "@tanstack/react-query";
import type { useTRPC } from "~/trpc/react";
import {
  createTRPCOptionsProxy,
  type DecorateProcedure,
  type DecorateRouterKeyable,
  type DecorateSubscriptionProcedure,
  type TRPCOptionsProxy,
  type TRPCOptionsProxyOptions,
} from "node_modules/@trpc/tanstack-react-query/dist/internals/createOptionsProxy";
import type { ResolverDef, TRPCQueryKey } from "@trpc/tanstack-react-query";

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

type ResolverDefProxy<TRouter extends AnyTRPCRouter> = ResolverDefProxyRecord<
  TRouter["_def"]["_config"]["$types"],
  TRouter["_def"]["record"]
>;
type ResolverDefProxyRecord<
  TRouter extends AnyTRPCRouter,
  TRecord extends TRPCRouterRecord,
> = {
  [TKey in keyof TRecord]: TRecord[TKey] extends infer $Value
    ? $Value extends TRPCRouterRecord
      ? ResolverDefProxyRecord<TRouter, $Value>
      : $Value extends AnyTRPCProcedure
        ? Endpoint<
            TRouter,
            $Value["_def"]["type"],
            inferProcedureInput<$Value>,
            inferTransformedProcedureOutput<
              TRouter["_def"]["_config"]["$types"],
              $Value
            >,
            TRouter["_def"]["_config"]["$types"]["errorShape"],
            TRouter["_def"]["_config"]["$types"]["transformer"]
          >
        : never
    : never;
};
type Endpoint<
  TRouter extends AnyTRPCRouter,
  TEndpointType extends TRPCProcedureType,
  TInput,
  TOutput,
  TError,
  TTransformer extends boolean,
> = {
  "~types": {
    router: TRouter;
    endpointType: TEndpointType;
    input: TInput;
    output: TOutput;
    transformer: TTransformer;
    errorShape: TError;
  };
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEndpoint = Endpoint<any, any, any, any, any, any>;

function _cast<TEndpoint extends AnyEndpoint>(endpoint: TEndpoint) {
  return endpoint as unknown as DecorateProcedure<
    TEndpoint["~types"]["endpointType"],
    TEndpoint["~types"]
  > &
    DecorateRouterKeyable;
}
const trpc = createTRPCOptionsProxy(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  {} as any,
) as unknown as ResolverDefProxy<AppRouter>;

// function pathKey(endpoint: AnyEndpoint) {
//   return _cast(endpoint).pathKey();
//   return (endpoint as unknown as DecorateRouterKeyable).pathKey();
// }
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function queryKey<T>(endpoint: Endpoint<any, "query", T, any>) {
//   return (endpoint as unknown as DecorateRouterKeyable).pathKey();
// }

type ErrorOf<TRouter extends AnyTRPCRouter> =
  TRouter["_def"]["_config"]["$types"]["errorShape"];
type DefOf<TRouter extends AnyTRPCRouter, TInput, TOutput> = {
  input: TInput;
  output: TOutput;
  errorShape: ErrorOf<TRouter>;
  transformer: TRouter["_def"]["_config"]["$types"]["transformer"];
};
type OldEndpoint<
  TRouter extends AnyTRPCRouter,
  TEndpointType extends TRPCProcedureType,
  TInput,
  TOutput,
> = DecorateProcedure<TEndpointType, DefOf<TRouter, TInput, TOutput>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function combineLinks(...links: TRPCLink<any>[]): TRPCLink<any> {
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const l = links.map((l) => l(undefined as any));
    return l.reduce<(typeof l)[0]>(
      (x, y) =>
        ({ next, op }) =>
          x({ op, next: (o) => y({ next, op: o }) }),
      ({ next, op }) => next(op),
    );
  };
}
export function scopedLink<TEndpoint extends AnyEndpoint>(
  endpoint: TEndpoint,
  link: OperationLink<
    TEndpoint["~types"]["router"],
    TEndpoint["~types"]["input"],
    TEndpoint["~types"]["output"]
  >,
): TRPCLink<TEndpoint["~types"]["router"]> {
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const prefix = _cast(endpoint).pathKey().flat().join(".");
  return () =>
    ({ next, op }) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      op.path.startsWith(prefix) ? link({ next, op: op as any }) : next(op);
}

type ServerResultObserver<TRouter extends AnyTRPCRouter, TOutput> = Partial<
  Observer<TOutput, ErrorOf<TRouter>> & { disconnect: () => void }
>;
export function watchLink<TRouter extends AnyTRPCRouter, TInput, TOutput>(
  events: (input: TInput) => ServerResultObserver<TRouter, TOutput>[],
): OperationLink<TRouter, TInput, TOutput> {
  return ({ next, op }) => {
    const handlers = events(op.input);
    return observable((s) => {
      const subscription = next(op)
        .pipe(
          tap({
            next(value) {
              const data = value.result.data;
              if (data) handlers.forEach((h) => h.next?.(data));
            },
            error(err) {
              handlers.forEach((h) => h.error?.(err));
            },
            complete() {
              handlers.forEach((h) => h.complete?.());
            },
          }),
        )
        .subscribe(s);
      return () => {
        subscription.unsubscribe();
        handlers.forEach((h) => h.disconnect?.());
      };
    });
  };
}

export function injectLink<TRouter extends AnyTRPCRouter, TInput, TOutput>(
  alter: (input: TInput) => (output: TOutput) => TOutput,
): OperationLink<TRouter, TInput, TOutput> {
  return ({ next, op }) => {
    const alteration = alter(op.input);
    return next(op).pipe(
      map((value) =>
        value.result.data
          ? ({
              ...value,
              result: {
                ...value.result,
                data: alteration(value.result.data),
              },
            } as typeof value)
          : value,
      ),
    );
  };
}

type CacheHandler<TOutput> = (
  fromServer: TOutput,
) => { stop: false; value: TOutput } | { stop: true };
export function injectableLink<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEndpoint extends Endpoint<any, "query", any, any, any, any>,
>(
  endpoint: TEndpoint,
): {
  link: TRPCLink<AnyTRPCRouter>;
  inject(
    handler: CacheHandler<TEndpoint["~types"]["output"]>,
    input: TEndpoint["~types"]["input"],
  ): void;
  evaluate: (
    input: TEndpoint["~types"]["input"],
    fromServer: TEndpoint["~types"]["output"],
  ) => TEndpoint["~types"]["output"];
} {
  const alterationsByQueryKey: Record<
    string,
    Array<CacheHandler<TEndpoint["~types"]["output"]>>
  > &
    object = {};
  const getAlterations = (input: TEndpoint["~types"]["input"]) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const queryKey = _cast(endpoint).queryKey(input).flat().join(".");
    return (
      alterationsByQueryKey[queryKey] ?? (alterationsByQueryKey[queryKey] = [])
    );
  };

  function evaluate(
    input: TEndpoint["~types"]["input"],
    fromServer: TEndpoint["~types"]["output"],
  ) {
    const alterationsForThisInput = getAlterations(input);
    const toRemove: number[] = [];
    alterationsForThisInput.forEach((alteration, index) => {
      const altered = alteration(fromServer);
      if (altered.stop) {
        toRemove.push(index);
      } else {
        fromServer = altered.value;
      }
    });
    toRemove.forEach((r) => alterationsForThisInput.splice(r, 1));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fromServer;
  }

  return {
    evaluate,
    link: scopedLink(
      endpoint,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      injectLink((input) => (value) => evaluate(input, value)),
    ),
    inject: (x, input) => getAlterations(input).push(x),
  };
}

export function optimisticUpdateLink<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEndpoint extends Endpoint<any, "query", any, any, any, any>,
>(
  endpoint: TEndpoint,
  queryClient: QueryClient,
  defaultValue: TEndpoint["~types"]["output"],
): Omit<ReturnType<typeof injectableLink<TEndpoint>>, 'inject'> & {
  invalidateQueries: (input: TEndpoint["~types"]["input"]) => void;
  optimisticallyRefetchValues: (input: TEndpoint["~types"]["input"]) => void;

  inject(
    handler: CacheHandler<TEndpoint["~types"]["output"]>,
    input: TEndpoint["~types"]["input"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): ServerResultObserver<any, any>;
} {
  const injectable = injectableLink(endpoint);
  let latestValue = defaultValue;
  return {
    ...injectable,
    invalidateQueries: (input) =>
      void queryClient.invalidateQueries({
        queryKey: _cast(endpoint).queryKey(input),
      }),
    optimisticallyRefetchValues,
    inject,
    link: combineLinks(
      injectable.link,
      scopedLink(
        endpoint,
        watchLink(() => [
          {
            next(value) {
              latestValue = value;
            },
          },
        ]),
      ),
    ),
  };

  function inject(
    handler: CacheHandler<TEndpoint["~types"]["output"]>,
    input: TEndpoint["~types"]["input"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): ServerResultObserver<any, any> {
    let abort = false;
    injectable.inject(
      (fromServer) => (abort ? { stop: true } : handler(fromServer)),
      input,
    );
    optimisticallyRefetchValues(input);
    return {
      error: () => {
        abort = true;
      },
      complete() {
        abort = true;
      },
      disconnect() {
          abort = true;
      },
    };
  }

  function optimisticallyRefetchValues(input: TEndpoint["~types"]["input"]) {
    queryClient.setQueryData(
      _cast(endpoint).queryKey(input),
      injectable.evaluate(input, latestValue),
    );
  }
}

export function optimisticallyAddGroups(
  queryClient: QueryClient,
): TRPCLink<AppRouter>[] {
  const allGroups = optimisticUpdateLink(trpc.task.allGroups, queryClient, []);
  return [
    allGroups.link,
    scopedLink(
      trpc.task.addGroup,
      watchLink((newGroup) => {
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
        const injection = allGroups.inject((fromServer) => {
          if (realID && fromServer.find((x) => x.id === realID)) {
            return { stop: true };
          }
          return {
            stop: false,
            value: [...fromServer, fakeGroup],
          };
        });
        return [
          injection,
          {
            next(value) {
              realID = value; // on the next succesful fetch that includes the correct ID, we stop the injection
              allGroups.invalidateQueries(); // trigger a refresh (via invalidation) immediately
            },
          },
        ];
      }),
    ),
  ];
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
    console.log({ valuesFromServer });
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

// export function optimisticallyAddGroups(
//   queryClient: QueryClient,
// ): TRPCLink<AppRouter>[] {
//   const cache = new ExtraFakeValuesInArray(
//     queryClient,
//     trpc.task.allGroups,
//     (group) => group.id,
//   );
//   const updateCacheOnAdd = new ListenOnMutation(trpc.task.addGroup, {
//     onInput(value) {
//       const id = fake.taskGroupId();
//       cache.addFakeItem({
//         ...value,
//         id,
//         createdAt: new Date(),
//         deletedAt: new Date(),
//         tasks: [],
//         updatedAt: new Date(),
//         userId: fake.userId(),
//         lastNotification: new Date().toDateString(),
//       });
//       cache.refreshClientDataWithoutRefetching();
//       return id;
//     },
//     onError(error, token) {
//       cache.removeFakeItem(token);
//       cache.refreshClientDataWithoutRefetching();
//     },
//     onSuccess(result, token) {
//       cache.recordRealId(token, result);
//     },
//   });
//   return [cache.link, updateCacheOnAdd.link];
// }
