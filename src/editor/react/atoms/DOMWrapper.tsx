import { useEffect, useRef } from 'react';

export function DOMWrapper(props: { el: HTMLElement }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.appendChild(props.el);
    } else {
      console.error(`DOMWrapper error: No mounted container.`);
    }
    return () => {
      if (containerRef.current?.contains(props.el)) {
        props.el.remove();
      }
    };
  }, []);

  return <div ref={containerRef}></div>;
}
