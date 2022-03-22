import { useMemo } from "react";
import { DiffElement, LineInformations } from "../../../compute/DiffComputer";

interface SectionBaseProps {
  diffs: Array<LineInformations>;
  type: "old" | "new";
}

function SectionBase({ diffs, type }: SectionBaseProps): JSX.Element {
  const lines = useMemo(() => {
    if (!diffs) {
      return [];
    }
    return diffs.map((diff) => {
      const element = diff[type];
      if (!element) {
        return;
      }
      if (typeof element.value !== "string") {
        element.value = (element.value as Array<DiffElement<"*">>).filter((value) => {
          const filter = type === "new" ? ["added", "unchanged"] : ["removed", "unchanged"];
          return filter.includes(value.type);
        })
      }
      return element;
    }).filter((value) => {
      const filter = type === "new" ? ["added", "unchanged"] : ["removed", "unchanged"];
      return filter.includes(value.type);
    })
  }, [])
  console.log({ lines });
  return (null)
}

export default SectionBase;