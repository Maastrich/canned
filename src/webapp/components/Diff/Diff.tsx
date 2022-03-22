import React, { EventHandler, MouseEvent } from "react";
import styled from "styled-components"
import DiffViewer from "../DiffView/DiffView";

const ContainerUI = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 60%;
  align-items: center;
`;

ContainerUI.displayName = "ContainerUI";

const DiffContainerUI = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #2f323e;
  border-radius: 8px;

  width: 100%;
  padding: 10px 0;
  gap: 10px;
`;

const TitleUI = styled.span`
  font-size: 16px;
  font-weight: bold;
  width: 100%;
  padding: 0 10px;
  color: #fff;
`;

TitleUI.displayName = "TitleUI";

const ButtonsUI = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

ButtonsUI.displayName = "ButtonsUI";

const ButtonUI = styled.button`
  background: ${({ name }) => name === "incomming" ? "#4476ab" : "#44ab7d"};
  border-radius: 8px;
  padding: 10px;
`;

ButtonUI.displayName = "ButtonUI";

const DiffUI = styled.div`
  border-top: 1px solid #353846;
  width: 100%;
  `;


interface DiffProps {
  onClick: EventHandler<MouseEvent<HTMLButtonElement>>;
  diff?: {
    oldContent: string;
    newContent: string;
    path: string;
  }
}

function Diff({ onClick, diff }: DiffProps): JSX.Element {

  if (!diff) {
    return <div>No diff</div>
  }

  return (
    <ContainerUI>
      <DiffContainerUI>
        <TitleUI>{diff.path}</TitleUI>
        <DiffUI>
          <DiffViewer
            useDarkTheme
            leftTitle="Current"
            rightTitle="Incomming"
            oldValue={diff.oldContent}
            newValue={diff.newContent}
            splitView
          />
        </DiffUI>
        <ButtonsUI>
          <ButtonUI onClick={onClick} name='current'>Accept Current</ButtonUI>
          <ButtonUI onClick={onClick} name='incomming'>Accept Incomming</ButtonUI>
        </ButtonsUI>
      </DiffContainerUI>
    </ContainerUI>
  );
}

export default Diff;