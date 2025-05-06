type Draw = {
  ctx: CanvasRenderingContext2D;
  currentPoint: Point;
  prevPoint: Point | null;
};

type Point = { x: number; y: number };

type DrawLineProps = {
  prevPoint: Point | null;
  currentPoint: Point;
  color: string;
  tool: string | null;
  strokeWidth: number;
};
type userData = {
  id: string;
  email: string | undefined;
} | null;

interface User {
  socketId: string;
  userId: string;
  email: string;
  room: string;
  currentPoint: Point;
  tool: string;
  cursorColor: string;
}
