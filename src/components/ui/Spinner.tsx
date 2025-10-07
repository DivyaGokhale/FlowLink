import React from "react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 24, className = "" }) => {
  const stroke = Math.max(2, Math.round(size / 12));
  return (
    <svg
      className={`animate-spin text-[hsl(var(--primary))] ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
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
