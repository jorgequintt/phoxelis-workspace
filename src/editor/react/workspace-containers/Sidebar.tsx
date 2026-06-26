import type { PropsWithChildren } from 'react';
import styled from 'styled-components';

export function Sidebar(props: PropsWithChildren) {
  return <Container>{props.children}</Container>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
