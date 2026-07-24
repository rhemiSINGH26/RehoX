import { useRef, useState } from "react";

interface Props {
  label: string;
  onFile: (file: File) => void;
  accept?: string;
  loading?: boolean;
}

export function DropZone({ label, onFile, accept = ".pdf,.docx", loading }: Props) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files?.[0]; if (f) onFile(f);
      }}
      className={[
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors",
        drag ? "border-brass bg-brass/5" : "border-line bg-panel/40 hover:border-brass/60",
      ].join(" ")}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div className="mono text-[10px] uppercase tracking-widest text-muted-text">
        {loading ? "Reading…" : "Drop or click"}
      </div>
      <div className="mt-2 font-display text-lg text-ink-text">{label}</div>
      <div className="mt-1 text-xs text-muted-text">PDF or DOCX, up to 10MB</div>
    </label>
  );
}