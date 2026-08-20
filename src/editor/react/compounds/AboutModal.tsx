import { Anchor, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { GithubLogoIcon } from '@phosphor-icons/react/dist/csr/GithubLogo';

const DEVELOPER_GITHUB = 'https://github.com/jorgequintt';

export function AboutModal() {
  return (
    <Stack gap="xs">
      <Stack gap={0}>
        <Title order={3}>Phoebis</Title>
        <Text size="sm" c="dimmed">
          Version {__APP_VERSION__}
        </Text>
      </Stack>

      <Text size="sm" c="dimmed">
        A browser-based phoxel/ASCII art editor. Every cell is a phox: a glyph from a
        bitmap font combined with a foreground and a background color. Draw with layers,
        motions, and per-layer version history.
      </Text>

      <Divider my="xs" />

      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Developer
        </Text>
        <Text size="sm">Jorge Quintero</Text>
        <Anchor
          href={DEVELOPER_GITHUB}
          target="_blank"
          rel="noreferrer"
          size="sm"
          c="blue.3"
        >
          <Group gap={6} wrap="nowrap">
            <GithubLogoIcon size={16} />
            github.com/jorgequintt
          </Group>
        </Anchor>
      </Stack>

      <Divider my="xs" />

      <Stack gap={4}>
        <Text size="sm" fw={600}>
          Powered by the Phoxelis engine
        </Text>
        <Anchor
          href="https://github.com/jorgequintt/phoxelis"
          target="_blank"
          rel="noreferrer"
          size="sm"
          c="blue.3"
        >
          <Group gap={6} wrap="nowrap">
            <GithubLogoIcon size={16} />
            github.com/jorgequintt/phoxelis
          </Group>
        </Anchor>
      </Stack>
    </Stack>
  );
}