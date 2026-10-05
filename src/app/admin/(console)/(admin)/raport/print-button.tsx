"use client";
import { btn } from "@/components/ui";

// Prints with the light theme so the PDF is readable on paper, then restores the member's theme.
export function PrintButton() {
  return (
    <button
      type="button"
      className={btn.secondary}
      onClick={() => {
        const root = document.documentElement;
        const prev = root.getAttribute("data-theme");
        root.setAttribute("data-theme", "light");
        const restore = () => {
          if (prev === null) root.removeAttribute("data-theme");
          else root.setAttribute("data-theme", prev);
          window.removeEventListener("afterprint", restore);
        };
        window.addEventListener("afterprint", restore);
        window.print();
      }}
    >
      Tipărește sau salvează PDF
    </button>
  );
}
