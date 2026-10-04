// A template remounts on every navigation, so the short fade runs on each page change.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
