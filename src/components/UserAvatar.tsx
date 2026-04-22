"use client";

import Image from "next/image";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  lastname?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
}

function getInitials(name?: string | null, lastname?: string | null): string {
  const first = name?.[0]?.toUpperCase() ?? "";
  const last = lastname?.[0]?.toUpperCase() ?? "";
  return first + last || "?";
}

function getTextSize(width?: number): string {
  if (!width) return "text-lg";
  if (width >= 96) return "text-3xl";
  if (width >= 64) return "text-xl";
  return "text-base";
}

export function UserAvatar({
  src,
  name,
  lastname,
  alt,
  width,
  height,
  fill,
  className = "",
  sizes,
}: UserAvatarProps) {
  const initials = getInitials(name, lastname);
  const resolvedAlt = alt ?? (`${name ?? ""} ${lastname ?? ""}`.trim() || initials);

  if (src) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={resolvedAlt}
          fill
          className={`object-cover ${className}`}
          sizes={sizes}
          unoptimized={!src.startsWith("http")}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={resolvedAlt}
        width={width}
        height={height}
        className={className}
        unoptimized={!src.startsWith("http")}
      />
    );
  }

  if (fill) {
    return (
      <div
        className={`w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg select-none ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{ width, height }}
      className={`bg-blue-100 flex items-center justify-center text-blue-600 font-semibold select-none ${getTextSize(width)} ${className}`}
    >
      {initials}
    </div>
  );
}
