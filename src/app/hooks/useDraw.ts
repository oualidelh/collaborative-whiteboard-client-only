// import { computePointInCanvas } from "@/utils/computePoints";
// import { useEffect, useRef, useState } from "react";
// export const useDraw = (
//   onDraw: ({ ctx, currentPoint, prevPoint }: Draw) => void,
//   canvasRef: React.RefObject<HTMLCanvasElement | null>
// ) => {
//   const [mouseDown, setMouseDown] = useState(false);

//   const prevPoint = useRef<null | Point>(null);

//   const onMouseDown = () => setMouseDown(true);

//   useEffect(() => {
//     const canvas = canvasRef.current; // Store the current value
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     const mouseMoveHandler = (e: MouseEvent) => {
//       if (!mouseDown) return;
//       const currentPoint = computePointInCanvas(e, canvas);

//       if (!ctx || !currentPoint) return;

//       onDraw({ ctx, currentPoint, prevPoint: prevPoint.current });
//       prevPoint.current = currentPoint;
//     };

//     const mouseUpHandler = () => {
//       setMouseDown(false);
//       prevPoint.current = null;
//     };
//     const handleMouseLeave = () => {
//       prevPoint.current = null;
//     };

//     // ✅ Use the stored canvas reference
//     canvas.addEventListener("mousemove", mouseMoveHandler);
//     canvas.addEventListener("mouseleave", handleMouseLeave);
//     window.addEventListener("mouseup", mouseUpHandler);

//     return () => {
//       // ✅ Cleanup should use the stored canvas
//       canvas.removeEventListener("mousemove", mouseMoveHandler);
//       canvas.removeEventListener("mouseleave", handleMouseLeave);
//       window.removeEventListener("mouseup", mouseUpHandler);
//     };
//   }, [onDraw, mouseDown, canvasRef]); // ✅ Remove canvasRef from dependencies

//   return { onMouseDown };
// };

import { computePointInCanvas } from "@/utils/computePoints";
import { useEffect, useRef, useState } from "react";

export const useDraw = (
  onDraw: ({ ctx, currentPoint, prevPoint }: Draw) => void,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  const [mouseDown, setMouseDown] = useState(false);
  const prevPoint = useRef<null | Point>(null);

  const onMouseDown = () => setMouseDown(true);
  const onTouchStart = () => setMouseDown(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🖱️ Mouse Move
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!mouseDown) return;
      const currentPoint = computePointInCanvas(e, canvas);
      if (!ctx || !currentPoint) return;

      onDraw({ ctx, currentPoint, prevPoint: prevPoint.current });
      prevPoint.current = currentPoint;
    };

    const mouseUpHandler = () => {
      setMouseDown(false);
      prevPoint.current = null;
    };

    const handleMouseLeave = () => {
      prevPoint.current = null;
    };

    // 📱 Touch Move
    const touchMoveHandler = (e: TouchEvent) => {
      if (!mouseDown) return;
      const touch = e.touches[0];
      if (!touch) return;

      const touchEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent;

      const currentPoint = computePointInCanvas(touchEvent, canvas);
      if (!ctx || !currentPoint) return;

      onDraw({ ctx, currentPoint, prevPoint: prevPoint.current });
      prevPoint.current = currentPoint;
    };

    const touchEndHandler = () => {
      setMouseDown(false);
      prevPoint.current = null;
    };

    // ✅ Register event listeners
    canvas.addEventListener("mousemove", mouseMoveHandler);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchmove", touchMoveHandler);
    window.addEventListener("mouseup", mouseUpHandler);
    window.addEventListener("touchend", touchEndHandler);

    // ✅ Cleanup
    return () => {
      canvas.removeEventListener("mousemove", mouseMoveHandler);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchmove", touchMoveHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
      window.removeEventListener("touchend", touchEndHandler);
    };
  }, [onDraw, mouseDown, canvasRef]);

  return {
    onMouseDown,
    onTouchStart,
  };
};
