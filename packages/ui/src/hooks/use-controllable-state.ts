import * as React from "react";

type UseControllableStateParams<T> = {
  prop: T | undefined;
  defaultProp: T;
  onChange?: (value: T) => void;
};

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;

  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (next) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      if (resolved === value) return;
      if (!isControlled) setUncontrolled(resolved);
      onChangeRef.current?.(resolved);
    },
    [isControlled, value],
  );

  return [value, setValue];
}
