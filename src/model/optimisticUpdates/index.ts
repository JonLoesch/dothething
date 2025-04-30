import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTRPC } from "~/trpc/react";
import { taskOptimisticUpdates } from "./tasks";

export function useTRPCOptimisticMutations() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
  
    return useMemo(
      () =>
        ({
          task: taskOptimisticUpdates(trpc, queryClient),
        }) as const,
      [trpc, queryClient],
    );
  }