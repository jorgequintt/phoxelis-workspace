import { Button, Flex, Text } from '@mantine/core';

interface Props {
  onReload: () => void;
}

export function PwaUpdateMessage({ onReload }: Props) {
  return (
    <Flex align="center" gap="sm" wrap="nowrap">
      <Text size="sm">A new version of Phoebis is ready.</Text>
      <Button size="xs" variant="light" onClick={onReload}>
        Reload
      </Button>
    </Flex>
  );
}
