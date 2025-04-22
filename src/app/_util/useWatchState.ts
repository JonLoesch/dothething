import { useEffect, useReducer, useState } from "react";

export function useWatchState<S>(initial: S, onChange?: () => void) {
//   const [handler, setHandler] = useState(() => onChange ?? (() => undefined));
//   useEffect(() => setHandler(onChange ?? (() => undefined)), [onChange]);
  return useReducer<S, [S]>((s, x) => {
    onChange?.call(undefined);
    return x;
  }, initial);
}
