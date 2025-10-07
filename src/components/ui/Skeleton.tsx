import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full" }) => {
  return <div className={`skeleton ${className}`} />;
};

export default Skeleton;
