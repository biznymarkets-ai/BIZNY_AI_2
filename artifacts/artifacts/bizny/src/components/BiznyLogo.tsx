import React, { useState } from "react";

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
  const [imgError, setImgError] = useState(false);

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
      {!imgError ? (
        <img
          src="/Bizny_Logo_final.png"
          alt="Bizny Logo"
          className={`${sizeMap[size]} object-contain rounded-xl shrink-0`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-xl bg-gradient-to-br from-[#033B4C] to-[#0A5D75] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
        >
          <span className="font-display">B</span>
        </div>
      )}
      {showText && (
        <span className={`font-bold font-display tracking-tight text-[#033B4C] dark:text-white ${textMap[size]}`}>
          Bizny
        </span>
      )}
    </div>
  );
};

export default BiznyLogo;


