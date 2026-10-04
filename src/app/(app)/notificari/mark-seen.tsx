"use client";
import { useEffect } from "react";
import { markNotificationsSeen } from "./actions";

// Clears the bell badge once the list has been shown.
export function MarkSeen({ needed }: { needed: boolean }) {
  useEffect(() => {
    if (needed) void markNotificationsSeen();
  }, [needed]);
  return null;
}
