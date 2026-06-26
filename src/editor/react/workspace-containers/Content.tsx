import type { PropsWithChildren } from 'react';
import styled from 'styled-components';

export function Content(props: PropsWithChildren) {
  return <Container>{props.children}</Container>
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
`;
