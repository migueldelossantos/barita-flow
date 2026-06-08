"use client";

import { cn } from "@/lib/cn";
import Image from "next/image";
import { useEffect, useState } from "react";

interface CollapsibleBannerProps {
  name: string;
  slogan: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  scrollContainerId?: string;
}

export function CollapsibleBanner({
  name,
  slogan,
  bannerUrl,
  logoUrl,
  scrollContainerId = "menu-scroll",
}: CollapsibleBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = document.getElementById(scrollContainerId);
    if (!el) return;

    const onScroll = () => setCollapsed(el.scrollTop > 60);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerId]);

  const imageSrc =
    bannerUrl ??
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 overflow-hidden bg-white transition-all duration-300",
        collapsed ? "h-14 shadow-sm" : "h-36"
      )}
    >
      <div className="relative h-full w-full">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 flex items-end gap-3 p-4 text-white transition-all",
            collapsed && "p-2"
          )}
        >
          {logoUrl && !collapsed && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white">
              <Image src={logoUrl} alt="" fill className="object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={cn(
                "font-bold leading-tight",
                collapsed ? "text-base" : "text-xl"
              )}
            >
              {name}
            </h1>
            {slogan && !collapsed && (
              <p className="truncate text-sm text-white/90">{slogan}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
