/* eslint-disable @typescript-eslint/prefer-function-type */
import type { UseMutationOptions, QueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { DistributiveOmit } from "@trpc/server/unstable-core-do-not-import";
import type {
  ResolverDef,
  TRPCMutationOptions,
  DecorateMutationProcedure,
  TRPCQueryOptionsResult,
  TRPCMutationKey,
  TRPCQueryBaseOptions,
} from "@trpc/tanstack-react-query";
import type { useTRPC } from "~/trpc/react";

// export type ExposedOptionsOld<TDef extends ResolverDef, TContext> = Pick<
//   UseMutationOptions<
//     TDef["output"],
//     TRPCClientErrorLike<TDef>,
//     TDef["input"],
//     TContext
//   >,
//   "onError" | "onSettled" | "onSuccess" | "onMutate"
// >;

interface MergedOptionsOut<TProc extends Mutation,
TInnerContext,
TOuterContext> extends OptionsOut<
TProc,
{
  inner: TInnerContext;
  outer: TOuterContext;
}
> {
    _fake_do_not_use_proc: TProc,
    _fake_do_not_use_inner: TInnerContext,
    _fake_do_not_use_outer: TOuterContext,
}
export function layerOptions<
  TProc extends Mutation,
  TInnerContext,
  TOuterContext,
>(
  mutation: TProc,
  {
    onMutate: innerMutate,
    onError: innerError,
    onSuccess: innerSuccess,
    onSettled: innerSettled,
    ...innerOptions
  }: OptionsIn<TProc, TInnerContext>,
  outerOptions?: ExposedOptionsIn<TProc, TOuterContext>,
): MergedOptionsOut<TProc, TInnerContext, TOuterContext> {
  const result: OptionsOut<
  TProc,
  {
    inner: TInnerContext;
    outer: TOuterContext;
  }
> = mutation.mutationOptions({
    ...innerOptions,
    async onMutate(variables: InputOf<TProc>) {
      const inner = await innerMutate?.(variables);
      const outer = await outerOptions?.onMutate?.(variables);
      return { inner, outer } as { inner: TInnerContext; outer: TOuterContext };
    },
    async onError(error: ErrorOf<TProc>, variables: InputOf<TProc>, context) {
      await innerError?.(error, variables, context?.inner);
      await outerOptions?.onError?.(error, variables, context?.outer);
    },
    async onSuccess(data: OutputOf<TProc>, variables: InputOf<TProc>, context) {
      await innerSuccess?.(data, variables, context.inner);
      await outerOptions?.onSuccess?.(data, variables, context.outer);
    },
    async onSettled(
      data: OutputOf<TProc>,
      error: ErrorOf<TProc> | null,
      variables: InputOf<TProc>,
      context,
    ) {
      await innerSettled?.(data, error, variables, context?.inner);
      await outerOptions?.onSettled?.(data, error, variables, context?.outer);
    },
  });
  return result as MergedOptionsOut<TProc, TInnerContext, TOuterContext>;
}

// From TRPC library:
interface TRPCMutationOptionsIn<TInput, TError, TOutput, TContext>
  extends DistributiveOmit<
      UseMutationOptions<TOutput, TError, TInput, TContext>,
      "mutationKey" | "mutationFn"
    >,
    TRPCQueryBaseOptions {}
interface TRPCMutationOptionsOut<TInput, TError, TOutput, TContext>
  extends UseMutationOptions<TOutput, TError, TInput, TContext>,
    TRPCQueryOptionsResult {
  mutationKey: TRPCMutationKey;
}
// End from TRPC library

type TRPC = ReturnType<typeof useTRPC>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutation = DecorateMutationProcedure<any>;

type InputOf<TProc extends Mutation> = TProc["~types"]["input"];
type ErrorOf<TProc extends Mutation> = TRPCClientErrorLike<
  TProc["~types"]["errorShape"]
>;
type OutputOf<TProc extends Mutation> = TProc["~types"]["output"];

type OptionsIn<TProc extends Mutation, TContext> = TRPCMutationOptionsIn<
  InputOf<TProc>,
  ErrorOf<TProc>,
  OutputOf<TProc>,
  TContext
>;
type OptionsOut<TProc extends Mutation, TContext> = TRPCMutationOptionsOut<
  InputOf<TProc>,
  ErrorOf<TProc>,
  OutputOf<TProc>,
  TContext
>;

type ExposedOptionsIn<TProc extends Mutation, TContext> = Pick<
  OptionsIn<TProc, TContext>,
  "onError" | "onSettled" | "onSuccess" | "onMutate"
>;

interface MergedInterface<TProc extends Mutation, TInnerContext> {
  <TContext>(
    options: ExposedOptionsIn<TProc, TContext>,
  ): MergedOptionsOut<TProc, TInnerContext, TContext>;
}
interface ExposedInterface<TProc extends Mutation, TInnerContext> {
  <TContext>(
    options: ExposedOptionsIn<TProc, TContext>,
  ): OptionsOut<TProc, {inner: TInnerContext, outer: TContext}>;
}
export function withClientOptions<TProc extends Mutation, TInnerContext>(int: MergedInterface<TProc, TInnerContext>) {
    return int as ExposedInterface<TProc, TInnerContext>;
}

interface CastOptions<TProc extends Mutation> {
  <TContext>(options: OptionsIn<TProc, TContext>): OptionsIn<TProc, TContext>;
}
export function withMutation<TProc extends Mutation>(
  _proc: TProc,
): CastOptions<TProc> {
  return (x) => x;
}

interface OptimisticUpdateLogic<TProc extends Mutation, TInnerContext> {
  (trpc: TRPC, queryClient: QueryClient): ExposedInterface<TProc, TInnerContext>;
}
export function withTRPC<T>(
  factory: (trpc: TRPC, queryClient: QueryClient) => T,
) {
  return factory;
}
