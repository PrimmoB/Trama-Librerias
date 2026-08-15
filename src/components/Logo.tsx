import React, { useState } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "compact" | "horizontal" | "imageOnly";
  showSubtext?: boolean;
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const [src, setSrc] = useState("/LogoWeb1.jpg");

  const sizes = {
    sm: "h-10 w-auto max-w-[150px]",
    md: "h-14 w-auto max-w-[200px]",
    lg: "h-20 w-auto max-w-[280px]",
    xl: "h-32 w-auto max-w-[400px]",
  };

  return (
    <img
      src={src}
      alt="Trama Librerías"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src === "/LogoWeb1.jpg") setSrc("/LogoWeb1.jpg");
      }}
      className={`object-contain ${sizes[size] || "h-14 w-auto"} ${className}`}
    />
  );
}






