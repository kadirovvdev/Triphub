import * as React from "react";

import { cn } from "@/lib/utils";


const FALLBACK_IMAGE_URL =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800"
      height="600"
      viewBox="0 0 800 600"
    >
      <rect
        width="800"
        height="600"
        fill="#f1f5f9"
      />

      <g
        fill="none"
        stroke="#94a3b8"
        stroke-width="18"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect
          x="225"
          y="150"
          width="350"
          height="300"
          rx="24"
        />

        <circle
          cx="325"
          cy="245"
          r="35"
        />

        <path
          d="M250 410
             L360 300
             L430 370
             L485 315
             L550 410"
        />
      </g>
    </svg>
  `);


const Image = React.forwardRef(
  (
    {
      src,
      alt = "",
      fittingType = "fill",
      className,
      style,
      onError,
      ...props
    },
    ref
  ) => {
    const [imageSrc, setImageSrc] =
      React.useState(
        src || FALLBACK_IMAGE_URL
      );


    React.useEffect(() => {
      setImageSrc(
        src || FALLBACK_IMAGE_URL
      );
    }, [src]);


    const handleError = (
      event
    ) => {
      if (
        imageSrc !==
        FALLBACK_IMAGE_URL
      ) {
        setImageSrc(
          FALLBACK_IMAGE_URL
        );
      }

      if (onError) {
        onError(
          event
        );
      }
    };


    const objectFit =
      fittingType === "fit"
        ? "contain"
        : "cover";


    return (
      <img
        ref={ref}
        src={imageSrc}
        alt={alt}
        loading="lazy"
        onError={
          handleError
        }
        className={cn(
          "block",
          className
        )}
        style={{
          objectFit,
          ...style,
        }}
        {...props}
      />
    );
  }
);


Image.displayName =
  "Image";


export {
  Image,
};