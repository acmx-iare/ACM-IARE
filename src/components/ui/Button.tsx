import React, { ButtonHTMLAttributes, forwardRef, MouseEventHandler } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  href?: string;
  isExternal?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", href, isExternal, children, onClick, ...props }, ref) => {
    const baseStyles =
      "inline-flex min-h-11 items-center justify-center rounded-md font-medium touch-manipulation transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none";

    const variantStyles = {
      primary: "bg-[#14213d] text-white shadow-sm hover:bg-[#0b1324]",
      secondary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
      outline: "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
      ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
      danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
    };

    const sizeStyles = {
      sm: "min-h-10 gap-1.5 px-3 py-2 text-xs",
      md: "gap-2 px-4 py-2.5 text-sm",
      lg: "min-h-12 gap-2.5 px-6 py-3 text-base",
    };

    const combinedClassName = cn(
      "hover:-translate-y-px",
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    if (href) {
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClassName}
            onClick={onClick}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className={combinedClassName} onClick={onClick}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={combinedClassName} onClick={onClick} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
