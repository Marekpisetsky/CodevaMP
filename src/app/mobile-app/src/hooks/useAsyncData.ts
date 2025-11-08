import { useEffect, useState } from "react";

type AsyncState<T> = {
  data?: T;
  loading: boolean;
  error?: Error;
};

export function useAsyncData<T>(loader: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });

    loader()
      .then((data) => {
        if (cancelled) return;
        setState({ loading: false, data });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setState({ loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  return state;
}