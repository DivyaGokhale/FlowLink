import React from "react";
import { cn } from "../../lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl" | number;
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  variant = "primary", 
  className = "" 
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const actualSize = typeof size === "number" ? size : sizeMap[size];
  const stroke = Math.max(2, Math.round(actualSize / 12));

  const variantClasses = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  return (
    <svg
      className={cn(
        "animate-spin",
        variantClasses[variant],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      width={actualSize}
      height={actualSize}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
};

export default Spinner;
