import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

const toastDurationMS = 5000;

export function ErrorDisplay() {
  const [isMounted, setMounted] = useState(true);
  useEffect(() => () => setMounted(false), []);
  const trpcClient = useQueryClient();
  const mutCache = useMemo(() => trpcClient.getMutationCache(), [trpcClient]);
  const getFailingMuts = useCallback(
    () => mutCache.findAll({ status: "error" }),
    [mutCache],
  );
  const [allFailingMutations, triggerRefetch] = useReducer(
    getFailingMuts,
    undefined,
    getFailingMuts,
  );
  const [nonce, inc] = useReducer(x => x + 1, 0);
  useEffect(() => mutCache.subscribe(inc), [mutCache]);
  useEffect(() => triggerRefetch, [nonce]);
  const seenMutIds = useRef<Set<number>>(new Set());
  const [staleMutIds, addStaleMutId] = useReducer<Set<number>, [number]>(
    (s, a) => new Set([...s, a]),
    new Set(),
  );
  useEffect(() => {
    for (const m of allFailingMutations) {
      if (
        !seenMutIds.current.has(m.mutationId) &&
        !staleMutIds.has(m.mutationId)
      ) {
        seenMutIds.current.add(m.mutationId);
        setTimeout(
          () => isMounted && addStaleMutId(m.mutationId),
          toastDurationMS,
        );
      }
    }
  });
  const recentErrors = useMemo(
    () => allFailingMutations.filter((m) => !staleMutIds.has(m.mutationId)),
    [allFailingMutations, staleMutIds],
  );

  return <>
    {recentErrors.map(e => (<div className="alert alert-error" key={e.mutationId}>
        {e.state.error?.message}
    </div>))}
  </>;
}
