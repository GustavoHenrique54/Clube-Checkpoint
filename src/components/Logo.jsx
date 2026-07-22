import React from "react";
import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";

/**
 * Logo component for Clube Checkpoint
 * @param {Object} props
 * @param {'black' | 'white' | 'auto'} [props.variant='auto'] - Force 'black' (black logo for white/light bg), 'white' (white logo for dark/blue bg), or 'auto' (adapts to light/dark mode)
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

  return (
    <div className="inline-flex items-center">
      <img src={logoBlack} alt={alt} className={`dark:hidden ${className}`} />
      <img src={logoWhite} alt={alt} className={`hidden dark:block ${className}`} />
    </div>
  );
}
