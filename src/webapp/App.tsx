import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

import Diff from './components/Diff';

const GlobalStyle = createGlobalStyle`
  span {
    box-sizing: border-box;
  }
`;

const AppUI = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #23242b;
`;

function App(): JSX.Element {
  return (
    <AppUI>
      <GlobalStyle />
      <Diff />
    </AppUI>
  );
}

export default App;
