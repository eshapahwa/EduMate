// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:w-4 [&_svg]:h-4 shrink-0 outline-none focus-visible:border-blue-400 focus-visible:ring-blue-400",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow hover:bg-blue-500",
        destructive: "bg-red-600 text-white shadow hover:bg-red-500",
        outline: "border bg-transparent shadow hover:bg-gray-100",
        secondary: "bg-gray-600 text-white shadow hover:bg-gray-500",
        ghost: "bg-transparent hover:bg-gray-100",
        link: "text-blue-600 underline hover:text-blue-500",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3",
        lg: "h-12 px-6",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button };
