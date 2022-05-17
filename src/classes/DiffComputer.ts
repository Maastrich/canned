import * as d from "diff";
import { diffLines } from "diff";

export type DiffMethod =
  | "diffChars"
  | "diffWords"
  | "diffWordsWithSpace"
  | "diffLines"
  | "diffTrimmedLines"
  | "diffSentences"
  | "diffCss";

export interface JsDiffChangeObject {
  added?: boolean;
  removed?: boolean;
  value?: string;
}

export type DiffElementType = "added" | "removed" | "unchanged";

type SpreadAll<T extends DiffElementType | "*"> = T extends "*"
  ? "added" | "removed" | "unchanged"
  : T extends "added"
  ? "added" | "default"
  : T extends "removed"
  ? "removed" | "default"
  : T;

export interface ChildDiffElement<
  T extends DiffElementType | "*" = "unchanged"
> {
  type: SpreadAll<T>;
  value: string;
  lineNumber?: number;
}

export interface DiffElement<T extends DiffElementType | "*" = "unchanged"> {
  type: SpreadAll<T>;
  value: Array<DiffElement<"*">> | string;
  lineNumber?: number;
}

export interface LineInformations {
  old?: DiffElement<"*">;
  new?: DiffElement<"*">;
}

interface ComputedLineInformations {
  old: Array<ChildDiffElement<"*">> | string;
  new: Array<ChildDiffElement<"*">> | string;
}

interface DiffConfig {
  path: string;
  oldValue: string;
  newValue: string;
  disableWordDiff?: boolean;
  compareMethod?: DiffMethod;
  linesOffset?: number;
}

interface Diff {
  value: string | Array<Diff>;
  added?: boolean;
  removed?: boolean;
}

class Line {
  private id: string = new Date().toISOString();
  private counter = 0;
  private lines: string[] = [];
  public infos: Array<LineInformations>;
  private type: "added" | "removed" | "unchanged";

  private constructLines(value: string): Array<string> {
    if (!value || !value.length) {
      return [];
    }
    return value.replace(/(\n)+$/, "").split("\n");
  }

  constructor(
    private diffs: Array<Diff>,
    public computedLines: Array<string>,
    public oldIndex: number,
    public newIndex: number,
    private compareMethod: DiffMethod = "diffWords",
    value: string,
    private diffIndex: number,
    added: boolean,
    removed: boolean,
    private evaluateOnlyFirstLine?: boolean
  ) {
    this.type = added ? "added" : removed ? "removed" : "unchanged";
    this.lines = this.constructLines(value);
  }

  private pushComputedLine(line: string): void {
    this.computedLines.push(line);
  }

  private pushInfo(info: LineInformations): Line {
    if (!this.infos) {
      this.infos = [];
    }
    this.infos.push(info);
    return this;
  }

  private computeDefault(value: string): Line {
    this.newIndex++;
    this.oldIndex++;
    const element: DiffElement<"*"> = {
      type: "unchanged",
      value,
    };
    return this.pushInfo({
      old: {
        ...element,
        lineNumber: this.oldIndex,
      },
      new: {
        ...element,
        lineNumber: this.newIndex,
      },
    });
  }

  private computeAdded(value: string): Line {
    this.newIndex++;
    const element: DiffElement<"*"> = {
      type: "added",
      value,
      lineNumber: this.newIndex,
    };
    return this.pushInfo({ old: undefined, new: element });
  }

  private computeNext(
    oldValue: string,
    newValue: string,
    index: number
  ): ComputedLineInformations {
    const { old, new: newDiff } = this.computeDiff(oldValue, newValue);
    this.computedLines.push(`${this.diffIndex + 1}-${index}`);
    if (
      !(newDiff as Array<DiffElement<"*">>).find((d) => d.type === "unchanged")
    ) {
      return { old: oldValue, new: newValue };
    }
    return { old, new: newDiff };
  }

  private computeRemoved(value: string, index: number): Line {
    this.oldIndex++;
    const oldElement: LineInformations["old"] = {
      type: "removed",
      value,
      lineNumber: this.oldIndex,
    };
    const nextDiff = this.diffs[this.diffIndex + 1];
    if (!nextDiff || !nextDiff.added) {
      return this.pushInfo({ old: oldElement, new: undefined });
    }
    const nextDiffLines = this.constructLines(nextDiff.value as string)[index];
    if (!nextDiffLines) {
      return this.pushInfo({ old: oldElement, new: undefined });
    }
    const next = this.computeNext(value, nextDiffLines, index);
    if (!next.new) {
      return this.pushInfo({ old: oldElement, new: undefined });
    }
    oldElement.value = next.old;
    this.newIndex++;
    const newElement: DiffElement<"*"> = {
      type: "added",
      value: next.new,
      lineNumber: this.newIndex,
    };
    return this.pushInfo({ old: oldElement, new: newElement });
  }

  private computeDiff(
    oldValue: string,
    newValue: string
  ): ComputedLineInformations {
    const diffArray: JsDiffChangeObject[] = d[this.compareMethod](
      oldValue.trimEnd(),
      newValue.trimEnd()
    );
    const oldInfos: Array<ChildDiffElement<"*">> = [];
    const newInfos: Array<ChildDiffElement<"*">> = [];
    diffArray.forEach(({ added, removed, value }): void => {
      if (added) {
        newInfos.push({
          type: "added",
          value,
        });
      } else if (removed) {
        oldInfos.push({
          type: "removed",
          value,
        });
      } else {
        const elem: ChildDiffElement<"*"> = {
          type: "unchanged",
          value,
        };
        oldInfos.push(elem);
        newInfos.push(elem);
      }
    });
    return {
      old: oldInfos,
      new: newInfos,
    };
  }

  compute(): Line {
    this.lines.forEach((line, index) => {
      if (
        this.computedLines.includes(`${this.diffIndex}-${index}`) ||
        (this.evaluateOnlyFirstLine && index !== 0)
      ) {
        return;
      }
      switch (this.type) {
        case "added": {
          this.computeAdded(line);
          break;
        }
        case "removed": {
          this.computeRemoved(line, index);
          break;
        }
        default: {
          this.computeDefault(line);
        }
      }
    });
    return this;
  }
}

export default class DiffComputer {
  private diffs: Array<Diff> = [];
  public lineInfos: Array<LineInformations> = [];

  constructor(private config: DiffConfig) {
    this.config.disableWordDiff = this.config.disableWordDiff ?? false;
    this.config.compareMethod = this.config.compareMethod ?? "diffWords";
    this.config.linesOffset = this.config.linesOffset ?? 0;
    this.diffs = diffLines(this.config.oldValue, this.config.newValue, {
      ignoreCase: false,
    });
  }

  private computedLines: string[] = [];

  private oldIndex = 0;
  private newIndex = 0;

  public compute(): DiffComputer {
    this.diffs.forEach((diff: d.Change, index: number): void => {
      const line = new Line(
        this.diffs,
        this.computedLines,
        this.oldIndex,
        this.newIndex,
        this.config.compareMethod,
        diff.value,
        index,
        diff.added,
        diff.removed
      );
      const { oldIndex, newIndex, computedLines, infos } = line.compute();
      this.oldIndex = oldIndex;
      this.newIndex = newIndex;
      if (computedLines) {
        this.computedLines.push(...computedLines);
      }
      if (infos) {
        this.lineInfos.push(...infos);
      }
    });
    return this;
  }
}
