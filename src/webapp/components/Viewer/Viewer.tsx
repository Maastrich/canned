import React from "react";
import styled from "styled-components";
import { LineInformations } from "../../compute/DiffComputer";
import Section from "./Section";

interface ViewerProps {
  className?: string;
  title: string;
  diffs: Array<LineInformations>;
}

const ViewerUI = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #2f323e;
  gap: 10px;
  padding: 10px 0;
  border-radius: 8px;
`;

ViewerUI.displayName = "ViewerUI";

const TitleUI = styled.span`
  font-size: 16px;
  font-weight: bold;
  width: 100%;
  padding: 0 10px;
  color: #aaaaaa;
  box-sizing: border-box;
`;

TitleUI.displayName = "TitleUI";

export default function Viewer({ title, diffs, className }: ViewerProps): JSX.Element {
  return (
    <ViewerUI className={className}>
      <TitleUI>{title}</TitleUI>
      <Section type="old" diffs={diffs} />
    </ViewerUI>
  )
}