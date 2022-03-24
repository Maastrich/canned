import * as d from 'diff';
import { diffLines } from "diff"

export type DiffMethod =
  | 'diffChars'
  | 'diffWords'
  | 'diffWordsWithSpace'
  | 'diffLines'
  | 'diffTrimmedLines'
  | 'diffSentences'
  | 'diffCss';

export interface JsDiffChangeObject {
  added?: boolean;
  removed?: boolean;
  value?: string;
}

export type DiffElementType = 'added' | 'removed' | 'unchanged';

type SpreadAll<T extends DiffElementType | "*"> =
  T extends "*" ?
  "added" | "removed" | "unchanged"
  : T extends "added" ?
  "added" | "default"
  : T extends "removed" ?
  "removed" | "default"
  : T;

export interface DiffElement<T extends DiffElementType | "*" = "unchanged"> {
  type: SpreadAll<T>;
  value: string | Array<DiffElement<"*">>;
  lineNumber?: number;
}

export interface LineInformations {
  old?: DiffElement<'*'>
  new?: DiffElement<'*'>
}

interface ComputedLineInformations {
  old: Array<DiffElement<"*">>
  new: Array<DiffElement<"*">>
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
    return value.replace(/(\n)+$/, "").split('\n');
  }

  constructor(
    private diffs: Array<Diff>,
    public computedLines: Array<string>,
    public oldIndex: number,
    public newIndex: number,
    private compareMethod: DiffMethod = 'diffChars',
    value: string,
    private diffIndex: number,
    added: boolean,
    removed: boolean,
    private evaluateOnlyFirstLine?: boolean
  ) {
    this.type = added ? 'added' : removed ? 'removed' : 'unchanged';
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
      type: 'unchanged',
      value,
    };
    return this.pushInfo({
      old: {
        ...element,
        lineNumber: this.oldIndex,
      }, new: {
        ...element,
        lineNumber: this.newIndex,
      }
    });
  }

  private computeAdded(value: string): Line {
    this.newIndex++;
    const element: DiffElement<"*"> = {
      type: 'added',
      value,
      lineNumber: this.newIndex,
    };
    return this.pushInfo({ old: undefined, new: element });
  }

  private spawnNewElement(value: string): Line {
    return new Line(
      this.diffs, this.computedLines, this.oldIndex, this.newIndex, this.compareMethod, value, this.diffIndex, true, false, true);
  }

  private computeRemoved(value: string, index: number): Line {
    this.oldIndex++;
    const oldElement: LineInformations["old"] = {
      type: "removed",
      value,
      lineNumber: this.oldIndex
    }
    const nextDiff = this.diffs[this.diffIndex + 1];
    if (!nextDiff || !nextDiff.added) {
      return this.pushInfo({ old: oldElement, new: undefined });
    }
    const nextDiffLines = this.constructLines(nextDiff.value as string)[index];
    if (!nextDiffLines) {
      return this.pushInfo({ old: oldElement, new: undefined });
    }
    const right = this.spawnNewElement(nextDiff.value as string);
    const newElement = right.compute().infos[0].new;
    this.pushComputedLine(`${this.diffIndex + 1}-${index}`);
    const { old, new: newDiff } = this.computeDiff(
      value,
      newElement.value as string,
    )
    oldElement.value = old;
    this.newIndex++;
    newElement.lineNumber = this.newIndex;
    newElement.value = newDiff;
    return this.pushInfo({ old: oldElement, new: newElement });
  }

  private computeDiff(oldValue: string, newValue: string): ComputedLineInformations {
    const diffArray: JsDiffChangeObject[] = d[this.compareMethod](
      oldValue.trimEnd(),
      newValue.trimEnd(),
    );
    const oldInfos: Array<DiffElement<"*">> = [];
    const newInfos: Array<DiffElement<"*">> = [];
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
        const elem: DiffElement<"*"> = {
          type: "unchanged",
          value,
        }
        oldInfos.push(elem)
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
      if (this.computedLines.includes(`${this.diffIndex}-${index}`) || (this.evaluateOnlyFirstLine && index !== 0)) {
        return;
      }
      switch (this.type) {
        case 'added': {
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
  private diffs: Array<Diff> = []
  public lineInfos: Array<LineInformations> = [];

  constructor(private config: DiffConfig) {
    this.config.disableWordDiff = this.config.disableWordDiff ?? false;
    this.config.compareMethod = this.config.compareMethod ?? "diffChars";
    this.config.linesOffset = this.config.linesOffset ?? 0;
    this.diffs = diffLines(
      this.config.oldValue,
      this.config.newValue, {
      ignoreCase: false,
      newlineIsToken: true,
    });
    console.debug(config);
  }

  private computedLines: string[] = [];

  private oldIndex = 0;
  private newIndex = 0;

  private pushComputedLine(line: string): void {
    this.computedLines.push(line);
  }

  public compute(): DiffComputer {
    this.diffs.forEach(
      (diff: d.Change, index: number): void => {
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
        )
        const { oldIndex, newIndex, computedLines, infos } = line.compute()
        this.oldIndex = oldIndex;
        this.newIndex = newIndex;
        this.computedLines.push(...(computedLines) ?? []);
        if (infos) {
          this.lineInfos.push(...infos);
        }
      }
    )
    console.debug(this.lineInfos);
    return this;
  }

}
