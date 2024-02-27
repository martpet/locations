import { ComponentChildren } from "preact";
import { StateUpdater, useEffect, useRef } from "preact/hooks";

interface ModalOverlayProps {
  children: ComponentChildren;
  setOpen: StateUpdater<boolean>;
}

export default function ModalOverlay({ children, setOpen }: ModalOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!containerRef.current!.contains(event.target as HTMLElement)) {
        setOpen(false);
        event.preventDefault();
        event.stopPropagation();
      }
    };
    addEventListener("click", listener, true);
    return () => removeEventListener("click", listener, true);
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
