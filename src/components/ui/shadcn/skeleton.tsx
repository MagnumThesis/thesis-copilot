import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

type Props = SkeletonProps & React.ComponentProps<"div">;

function Skeleton({ className = "", width = "w-full", height = "h-4", rounded = "rounded-md", ...props }: Props) {
  return (
    <div
      data-slot="skeleton"
      className={cn(width, height, rounded, "bg-slate-200 dark:bg-slate-700/40 animate-pulse", className)}
      aria-hidden
      {...props}
    />
  );
}

export default Skeleton;
export { Skeleton };
