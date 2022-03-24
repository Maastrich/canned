import React from "react";
import styled from "styled-components";
import { LineInformations } from "../../../compute/DiffComputer";
import LineBase from "./Line/Line";

interface SectionProps {
  diffs: LineInformations[];
}

const SectionUI = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #363946; ;
`;

SectionUI.displayName = "SectionUI";

const LineUI = styled.div`
display: flex;
  width: 100%;
  flex-direction: row;
`;

LineUI.displayName = "LineUI";

function Section({ diffs }: SectionProps): JSX.Element {
  if (!diffs) {
    return null;
  }
  return (
    <SectionUI >
      {diffs.map((line, index) => (
        <LineUI key={index}>
          <LineBase key={`old-${index}`} line={line.old} />
          <LineBase key={`new-${index}`} line={line.new} />
        </LineUI>
      ))}
    </SectionUI>
  )
}

export default Section;