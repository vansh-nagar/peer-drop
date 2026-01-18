import React from "react";

const RainBowBar = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <>
      <div
        className={`animate-rainbow bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%]  ${className}`}
        style={style}
      />
    </>
  );
};

export default RainBowBar;
