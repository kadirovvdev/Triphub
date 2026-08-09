import React, {
  useRef,
  useState,
} from "react";

import {
  getToken,
} from "@/api/apiClient";

import {
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";


const API_URL =
  "http://127.0.0.1:8000";


export default function ImageUploader({
  value = [],
  onChange,
  max = 8,
}) {
  const inputRef =
    useRef(null);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // UPLOAD ONE FILE
  // ============================================================

  const uploadFile = async (
    file
  ) => {
    const token =
      getToken();

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        `${API_URL}/uploads/images`,
        {
          method: "POST",

          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},

          body: formData,
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          "Image upload failed"
      );
    }

    return data.file_url;
  };

  // ============================================================
  // HANDLE FILES
  // ============================================================

  const handleFiles = async (
    files
  ) => {
    setError("");

    if (
      !files ||
      !files.length
    ) {
      return;
    }

    if (
      value.length +
        files.length >
      max
    ) {
      setError(
        `You can attach at most ${max} images.`
      );

      return;
    }

    setBusy(true);

    try {
      const uploaded = [];

      for (
        const file
        of Array.from(files)
      ) {
        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          throw new Error(
            "Only image files are allowed."
          );
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          throw new Error(
            "Each image must be smaller than 5 MB."
          );
        }

        const fileUrl =
          await uploadFile(
            file
          );

        uploaded.push(
          fileUrl
        );
      }

      onChange([
        ...value,
        ...uploaded,
      ]);

    } catch (err) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Upload failed"
      );

    } finally {
      setBusy(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  };

  // ============================================================
  // REMOVE
  // ============================================================

  const remove = (
    index
  ) => {
    onChange(
      value.filter(
        (_, i) =>
          i !== index
      )
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

        {value.map(
          (
            url,
            index
          ) => (

            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >

              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  remove(index)
                }
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >

                <X size={14} />

              </button>

            </div>

          )
        )}

        {value.length <
          max && (

          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-60"
          >

            {busy ? (

              <Loader2
                size={20}
                className="animate-spin"
              />

            ) : (

              <ImagePlus
                size={22}
              />

            )}

            <span className="text-xs font-medium">
              Add image
            </span>

          </button>

        )}

      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) =>
          handleFiles(
            e.target.files
          )
        }
      />

      {error && (

        <p className="mt-2 text-sm text-destructive">
          {error}
        </p>

      )}

    </div>
  );
}