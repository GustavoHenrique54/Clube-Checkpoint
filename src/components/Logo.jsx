import React from "react";
import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";
import logoBlue from "@/assets/logo-blue.png";

/**
 * Logo component for Clube Checkpoint
 * @param {Object} props
 * @param {'black' | 'white' | 'blue' | 'auto'} [props.variant='auto']
 *        - 'blue': Blue logo (for light backgrounds)
 *        - 'white': White logo (for dark or blue backgrounds)
 *        - 'black': Black logo
 *        - 'auto': Automatically uses blue logo in light mode and white logo in dark mode
 * @param {string} [props.className] - Tailwind / CSS classes for height, width, etc.
 * @param {string} [props.alt] - Accessible alt text
 */
export default function Logo({
  variant = "auto",
  className = "h-8 w-auto object-contain",
  alt = "Clube Checkpoint"
}) {
  if (variant === "black") {
    return <img src={logoBlack} alt={alt} className={className} />;
  }

  if (variant === "white") {
    return <img src={logoWhite} alt={alt} className={className} />;
  }

  if (variant === "blue") {
    return <img src={logoBlue} alt={alt} className={className} />;
  }

  return (
    <div className="inline-flex items-center">
      <img src={logoBlue} alt={alt} className={`dark:hidden ${className}`} />
      <img src={logoWhite} alt={alt} className={`hidden dark:block ${className}`} />
    </div>
  );
}
