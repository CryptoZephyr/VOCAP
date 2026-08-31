import { useCallback, useEffect, useRef, type MouseEvent, type ReactNode } from "react";

type Spark = {
  x: number;
  y: number;
  angle: number;
  startTime: number;
};

type ClickSparkProps = {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  extraScale?: number;
  children?: ReactNode;
};

export function ClickSpark({
  sparkColor = "#f85000",
  sparkSize = 10,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 400,
  extraScale = 1,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(parent);
    resizeCanvas();
    return () => ro.disconnect();
  }, [reduceMotion]);

  const easeOut = useCallback((t: number) => t * (2 - t), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId = 0;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;
        const eased = easeOut(elapsed / duration);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
        ctx.lineTo(
          spark.x + (distance + lineLength) * Math.cos(spark.angle),
          spark.y + (distance + lineLength) * Math.sin(spark.angle),
        );
        ctx.stroke();
        return true;
      });
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [duration, easeOut, extraScale, reduceMotion, sparkColor, sparkRadius, sparkSize]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return;
    const rect = canvas.getBoundingClientRect();
    const now = performance.now();
    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, i) => ({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      })),
    );
  };

  if (reduceMotion) return <>{children}</>;

  return (
    <div className="relative h-full w-full" onClick={handleClick}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />
      {children}
    </div>
  );
}
