import { Stack, Text, Title } from '@mantine/core';

export function StartModal() {
  return (
    <Stack gap="sm">
      <Title order={4}>Getting started</Title>
      <Text size="sm" c="dimmed">
        This is a placeholder for the "How to use" guide. Detailed instructions
        on drawing phoxels, layers, motions, and versioning will appear here
        soon.
      </Text>
    </Stack>
  );
}