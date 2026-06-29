import type { PropsWithChildren } from 'react';
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { ModalsProvider } from '@mantine/modals';

const theme = createTheme({
  scale: 0.95,
  spacing: {
    xs: '0.3rem',
    sm: '0.45rem',
    md: '0.55rem',
    lg: '0.9rem',
    xl: '1.5rem',
  },
  radius: {
    xs: '0.0rem',
    sm: '0.1rem',
    md: '0.2rem',
    lg: '0.4rem',
    xl: '0.6rem',
  },
});

export function Mantine(props: PropsWithChildren) {
  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <ModalsProvider>{props.children}</ModalsProvider>
    </MantineProvider>
  );
}
