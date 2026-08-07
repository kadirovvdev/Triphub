import React from "react";
import { Star } from "lucide-react";
import { classNames } from "@/lib/triphub";

// Render N filled/half stars from a numeric rating.
export default function RatingStars({ value = 0, size = 16, className }) {
  const v = Number(value) || 0;
  return (
    <div className={classNames("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${v} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, v - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-amber-300" strokeWidth={1.5} />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star size={size} className="text-amber-400 fill-amber-400" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </div>
  );
}