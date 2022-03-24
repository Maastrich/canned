import React from "react";
import styled from "styled-components";
import { DiffElement, DiffElementType } from "../../../../compute/DiffComputer";

export interface LineProps {
  line: DiffElement<"*">;
}

const LineUI = styled.div<{ $type: DiffElementType }>`
  font-size: 13px;
  line-height: 25px;
  font-family:monospace;
  flex-direction: row;
  display: flex;
  gap: 10px;
  color: #eeeeee;
  background-color: #632F34;
  width: 50%;
  background-color: ${({ $type }) => {
    switch ($type) {
      case "added": return "#044B53";
      case "removed": return "#632F34";
      default: return "#363946";
    }
  }
  };
`;

LineUI.displayName = "LineUI";

const TextUI = styled.pre`
margin: 0;
  white-space: pre-wrap;
`;

const LineNumber = styled.div<{ $type: DiffElementType }>`
  width: 50px;
  height: 100%;
  padding: 0px 10px;
  text-align: right;
  background-color: ${({ $type }) => {
    switch ($type) {
      case "added": return "#034148";
      case "removed": return "#632b30";
      default: return "#2c2f3a";
    }
  }};
`;

LineNumber.displayName = "LineNumber";

const SubTextUI = styled.span<{ $type: DiffElementType, $splitted?: boolean }>`
display: inline-flex;
  background-color: ${({ $type, $splitted }) => {
    if (!$splitted) {
      return "transparent";
    }
    switch ($type) {
      case "added": return "#055d67";
      case "removed": return "red";
      default: return "transparent";
    }
  }};
`;

const lineprefix = {
  "unchanged": "",
  "added": "+",
  "removed": "-",
}

export default function Line({ line: currentLine }: LineProps): JSX.Element {
  const line = {
    type: "unchanged",
    ...currentLine,
  };
  return (
    <LineUI $type={line.type}>
      <LineNumber $type={line.type}>
        {line?.lineNumber}
      </LineNumber>
      <span>
        {lineprefix[line.type]}
      </span>
      <TextUI>
        {line.value && (typeof line.value === "string" ? (<SubTextUI $type={line.type}> {line.value}</SubTextUI>) : line.value.map((v, i) => v ? (
          <SubTextUI key={`splitted-${i}`} $type={v.type} $splitted> {v.value}</SubTextUI>
        ) : null))}
      </TextUI>
    </LineUI>
  )
}
