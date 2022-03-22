import React, { useCallback, useEffect, useMemo, useState } from "react";
import { computeLineInformation } from "../../compute/compute-lines";
import DiffComputer from "../../compute/DiffComputer";

import Viewer from "./Viewer";

interface ViewerBaseProps {
  title: string;
}

export default function ViewerBase({ title }: ViewerBaseProps): JSX.Element {

  const [diff, setDiff] = useState<{ oldContent: string, newContent: string, path: string } | undefined>();
  const [loading, setLoading] = useState(true);

  const diffs = useMemo(() => {
    if (!diff) {
      console.log("no diff");
      return;
    }
    const test = new DiffComputer({
      oldValue: diff.oldContent,
      newValue: diff.newContent,
    })
    return test.compute().lineInfos;
  }, [diff]);

  const updateFiles = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8787/diff");
      const files = await response.json();
      setDiff(files);
    } catch {
      setDiff(undefined);
    }
    setLoading(false);
  }, []);

  const onClick = useCallback(async (e) => {
    setLoading(true);
    await fetch("http://localhost:8787/diff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accept: e.target.name,
        path: diff?.path
      })
    });
    updateFiles();
  }, [diff, updateFiles]);

  useEffect(() => {
    updateFiles();
  }, [updateFiles])

  return (
    <Viewer
      title={title}
      diffs={diffs}
    />

  )
}