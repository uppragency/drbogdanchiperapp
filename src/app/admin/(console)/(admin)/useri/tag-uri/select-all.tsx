"use client";
import { btn } from "@/components/ui";

export function SelectAll() {
  return (
    <button
      type="button"
      className={btn.secondary}
      onClick={(e) => {
        const boxes = Array.from(e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="userIds"]') ?? []);
        const all = boxes.every((b) => b.checked);
        boxes.forEach((b) => (b.checked = !all));
      }}
    >
      Selectează / deselectează toți
    </button>
  );
}
