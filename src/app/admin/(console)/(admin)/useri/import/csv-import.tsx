"use client";
import { useState } from "react";
import Papa from "papaparse";
import { Alert, btn } from "@/components/ui";
import { importUsers, type ImportResult, type ImportRow } from "../actions";

const CHUNK = 20;
const pick = (row: Record<string, string>, keys: string[]) => {
  for (const k of Object.keys(row)) {
    const norm = k.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
    if (keys.includes(norm)) return (row[k] ?? "").trim();
  }
  return "";
};

export function CsvImport() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResults([]);
    setError("");
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data
          .map((r) => ({ email: pick(r, ["email", "e-mail"]), firstName: pick(r, ["prenume", "firstname", "first_name"]), lastName: pick(r, ["nume", "lastname", "last_name"]), tags: pick(r, ["taguri", "tag", "grupuri", "mentormed", "tags"]) }))
          .filter((r) => r.email);
        if (!parsed.length) setError("Nu am găsit nicio linie cu email. Coloanele așteptate: email, prenume, nume, taguri.");
        setRows(parsed);
      },
      error: () => setError("Fișierul nu a putut fi citit."),
    });
  }

  async function run() {
    setBusy(true);
    setResults([]);
    const all: ImportResult[] = [];
    for (let i = 0; i < rows.length; i += CHUNK) {
      try {
        all.push(...(await importUsers(rows.slice(i, i + CHUNK))));
      } catch {
        rows.slice(i, i + CHUNK).forEach((r) => all.push({ email: r.email, status: "error", message: "Eroare de rețea" }));
      }
      setResults([...all]);
    }
    setBusy(false);
  }

  const created = results.filter((r) => r.status === "created").length;
  const exists = results.filter((r) => r.status === "exists").length;
  const errors = results.filter((r) => r.status === "error");

  return (
    <div className="flex flex-col gap-5">
      <label className={`${btn.secondary} w-fit cursor-pointer`}>
        Alege fișier CSV
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" disabled={busy} />
      </label>
      {error && <Alert>{error}</Alert>}
      {rows.length > 0 && (
        <>
          <p className="text-sm">{rows.length} useri găsiți. Primele rânduri:</p>
          <ul className="divide-y divide-line rounded-control border border-line text-sm">
            {rows.slice(0, 5).map((r) => <li key={r.email} className="flex flex-col gap-1 p-3 sm:flex-row sm:justify-between"><span>{r.firstName} {r.lastName} · {r.email}</span><span className="text-muted">{r.tags || "fără taguri"}</span></li>)}
          </ul>
          <div><button onClick={run} disabled={busy} className={btn.primary}>{busy ? `Se importă ${results.length} din ${rows.length}` : "Importă userii"}</button></div>
        </>
      )}
      {results.length > 0 && !busy && (
        <div className="flex flex-col gap-2">
          <Alert kind="ok">{created} creați, {exists} existenți, {errors.length} erori.</Alert>
          {errors.length > 0 && <Alert>{errors.map((e) => `${e.email}: ${e.message}`).join(" · ")}</Alert>}
        </div>
      )}
    </div>
  );
}
