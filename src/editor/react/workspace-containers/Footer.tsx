import type { PropsWithChildren } from 'react';
import styled from 'styled-components';

export function Footer(props: PropsWithChildren) {
  return <Container>{props.children}</Container>;
}

const Container = styled.div`
  overflow-x: scroll;
`;
