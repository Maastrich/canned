import { Change, diffLines } from "diff";
import { ChangeType } from "../types";
interface Merge {
  type: "default" | "conflict";
  lines?: Array<string>;
  current?: Array<string>;
  incoming?: Array<string>;
}

function merge(current: string, incoming: string): Array<{ lineNumber: number, value: string }>
function merge(current: string, incoming: string, option: { stringify: boolean }): string
function merge(current: string, incoming: string, { stringify = false }: { stringify?: boolean } = {}): Array<{ lineNumber: number, value: string }> | string {
  const mergeOutput: Array<Merge> = [];
  const diffs = diffLines(current, incoming, {
    ignoreCase: false,
  });

  let currentMerge: Merge = {
    type: "default",
    lines: [],
  }
  diffs.forEach((diff: Change): void => {
    const value = diff.value.trimEnd();
    if (diff.added || diff.removed) {
      if (currentMerge.type === "default") {
        mergeOutput.push(currentMerge);
        currentMerge = {
          type: "conflict",
          current: [],
          incoming: [],
        }
      }
      if (diff.added) {
        currentMerge.incoming.push(...value.split("\n"));
      }
      if (diff.removed) {
        currentMerge.current.push(...value.split("\n"));
      }
    } else {
      if (currentMerge.type === "conflict") {
        mergeOutput.push(currentMerge);
        currentMerge = {
          type: "default",
          lines: [],
        }
      }
      currentMerge.lines.push(...value.split("\n"));
    }


  })

  const lines: Array<{ value: string, type: ChangeType }> = [];
  mergeOutput.forEach((merge) => {
    if (merge.type === "default") {
      lines.push(...merge.lines.map((line) => ({ value: line, type: "unchanged" as ChangeType })));
    } else {
      if (merge.current.length && merge.incoming.length) {
        lines.push({ value: "<<<<<<< HEAD", type: "removed" });
        lines.push(...merge.current.map((line) => ({ value: line, type: "removed" as ChangeType })));
        lines.push({ value: "=======", type: "unchanged" });
        lines.push(...merge.incoming.map((line) => ({ value: line, type: "added" as ChangeType })));
        lines.push({ value: ">>>>>>> incoming", type: "added" as ChangeType });
      } else {
        lines.push(...merge.incoming.map((line) => ({ value: line, type: "added" as ChangeType })));
        lines.push(...merge.current.map((line) => ({ value: line, type: "removed" as ChangeType })));
      }
    }
  })

  if (stringify) {
    return lines.map((line) => line.value).join("\n");
  }

  return lines.map((line, index) => ({
    ...line,
    lineNumber: index + 1,
  }));
}

export default merge;