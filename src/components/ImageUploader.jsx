import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ImagePlus, X, Loader2 } from "lucide-react";

// Multi-image uploader using the Core UploadFile integration (client-side, allowed).
// `value` is an array of URLs; `onChange` replaces it.
export default function ImageUploader({ value = [], onChange, max = 8 }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files) => {
    setError("");
    if (!files || !files.length) return;
    if (value.length + files.length > max) {
      setError(`You can attach at most ${max} images.`);
      return;
    }
    setBusy(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url, idx) => (
          <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-60"
          >
            {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={22} />}
            <span className="text-xs font-medium">Add image</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}