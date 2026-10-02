import {useCallback, useEffect, useRef, useState} from "react";

export default function useApiData<T>(loader: () => Promise<T>, key: string) {
  const latest = useRef(loader);
  latest.current = loader;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{key: string; data?: T; error?: Error; loading: boolean}>({key, loading: true});
  useEffect(() => {
    let active = true;
    setState({key, loading: true});
    latest.current().then(data => {if (active) setState({key, data, loading: false});}, error => {if (active) setState({key, error: error instanceof Error ? error : new Error("Unable to load data"), loading: false});});
    return () => {active = false;};
  }, [key, revision]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return {...(state.key === key ? state : {key, loading: true}), reload};
}
