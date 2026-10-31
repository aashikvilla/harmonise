"use client";

import { useSearchParams } from "next/navigation";
import HarmoniseExperience from "@/components/harmonise-experience";
import type { EntryPath } from "@/lib/harmonise";

const validPaths: Exclude<EntryPath, null>[] = ["talk", "unsure", "quiet", "support"];

export default function ProductRoute() {
  const params = useSearchParams();
  const requestedPath = params.get("path");
  const requestedStory = params.get("story");
  const requestedScenario = params.get("scenario");
  const requestedHelp = params.get("help");
  const initialPath = requestedHelp === "safety"
    ? "help"
    : requestedStory === "arjun" || requestedScenario === "arjun"
      ? "arjun"
      : validPaths.includes(requestedPath as Exclude<EntryPath, null>)
        ? requestedPath as Exclude<EntryPath, null>
        : undefined;

  return <HarmoniseExperience initialPath={initialPath} />;
}
