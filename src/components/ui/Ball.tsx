import * as React from "react";
import { cn } from "./utils";

// A ping-pong ball: size it with h-/w- classes, put a number inside if you like
export default function Ball({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-extrabold leading-none text-ink-950",
        "bg-[radial-gradient(circle_at_32%_28%,#ffffff,#f4f0e8_45%,#bfb8a9)] shadow-[inset_0_-2px_3px_rgb(0_0_0/0.2)]",
        className
      )}
      {...props}
    />
  );
}
