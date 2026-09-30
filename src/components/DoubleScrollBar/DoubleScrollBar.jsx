import { useEffect, useRef, useState } from "react";

export function BottomHScroll({ children, maxHeight = "560px" }) {
  const mainRef = useRef(null);
  const bottomRef = useRef(null);
  const [scrollW, setScrollW] = useState(0);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const update = () => setScrollW(el.scrollWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const syncBottom = () => {
    if (!mainRef.current || !bottomRef.current) return;
    mainRef.current.scrollLeft = bottomRef.current.scrollLeft;
  };

  const syncMain = () => {
    if (!mainRef.current || !bottomRef.current) return;
    bottomRef.current.scrollLeft = mainRef.current.scrollLeft;
  };

  return (
    <div className="relative w-full">
      {/* Área principal: scroll vertical + horizontal real */}
      <div
        ref={mainRef}
        onScroll={syncMain}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        {children}
      </div>

      {/* Barra horizontal fija abajo */}
      <div className="sticky bottom-0 z-50 bg-white/80 backdrop-blur">
        <div
          ref={bottomRef}
          onScroll={syncBottom}
          className="overflow-x-auto overflow-y-hidden h-4"
        >
          <div style={{ width: scrollW }} />
        </div>
      </div>
    </div>
  );
}