import React from "react";

interface BiznyLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const BiznyLogo: React.FC<BiznyLogoProps> = ({
  className = "",
  size = "md",
  showText = true,
}) => {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-14 w-14",
  };

  const textMap = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/Bizny_Logo_final.png"
        alt="Bizny Logo"
        className={`${sizeMap[size]} object-contain rounded-xl shrink-0`}
        onError={(e) => {
          // Fallback to logo.jpg if Bizny_Logo_final.png fails
          e.currentTarget.src = "/logo.jpg";
        }}
      />
      {showText && (
        <span className={`font-bold font-display tracking-tight text-[#033B4C] dark:text-white ${textMap[size]}`}>
          Bizny
        </span>
      )}
    </div>
  );
};
