import { useValue } from '@legendapp/state/react';
import { useMemo, type ReactNode } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../App';
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { GitBranchIcon } from '@phosphor-icons/react/dist/csr/GitBranch';
import { ArrowLineUpIcon } from '@phosphor-icons/react/dist/csr/ArrowLineUp';
import { EraserIcon } from '@phosphor-icons/react/dist/csr/Eraser';
import type { Branch } from '../../../workspace/Workspace';
import {
  addVersion,
  createBranch,
  resetVersioning,
} from '../../../workspace/modules/Actions';

type BranchNode = {
  name: string;
  children: BranchNode[];
};

function buildBranchTree(branches: Record<string, Branch>): BranchNode[] {
  const childrenMap: Record<string, string[]> = {};
  for (const name of Object.keys(branches)) {
    const parent = branches[name].base?.branch ?? '__root__';
    if (!childrenMap[parent]) childrenMap[parent] = [];
    childrenMap[parent].push(name);
  }
  const build = (name: string): BranchNode => ({
    name,
    children: (childrenMap[name] ?? []).map(build),
  });
  return (childrenMap['__root__'] ?? []).map(build);
}

export default function VersioningPanel() {
  const { ws } = useAppContext();
  const layers = useValue(ws.data$.layers);
  const activeLayer = useValue(ws.state$.activeLayer);

  const layer = activeLayer ? layers[activeLayer] : undefined;
  if (!layer) return null;

  const branches = layer.branches ?? {};
  const currentBranch = layer.currentBranch;
  const branch = branches[currentBranch];
  const branchHistory = branch?.history ?? [];
  const branchStep = layer.branchStep ?? 0;

  const tree = useMemo(() => buildBranchTree(branches), [branches]);

  const noHistory = branchHistory.length === 0;
  const nextDisabled = noHistory || branchStep >= branchHistory.length - 1;
  const prevDisabled = noHistory || branchStep <= 0;

  const stepOptions = branchHistory.map((_, i) => ({
    value: String(i),
    label: `Step ${i}`,
  }));

  const renderNode = (
    node: BranchNode,
    depth: number,
    isLast: boolean,
    ancestorPrefix: string,
  ): ReactNode => {
    const connector = depth === 0 ? '' : isLast ? '└─ ' : '├─ ';
    const childPrefix = depth === 0 ? '' : ancestorPrefix + (isLast ? '   ' : '│  ');
    return (
      <div key={node.name}>
        <Tooltip label={`Switch to "${node.name}"`} withArrow>
          <Button
            variant={node.name === currentBranch ? 'filled' : 'subtle'}
            size="compact-xs"
            fullWidth
            justify="flex-start"
            h={20}
            pl={4}
            pr={4}
            color={node.name === currentBranch ? undefined : 'gray'}
            onClick={() => ws.versioningManager.switchBranch(activeLayer, node.name)}
          >
            {depth > 0 && <Connector>{ancestorPrefix + connector}</Connector>}
            {node.name}
          </Button>
        </Tooltip>
        {node.children.map((child, i) =>
          renderNode(child, depth + 1, i === node.children.length - 1, childPrefix),
        )}
      </div>
    );
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={600}>
          Versioning
        </Text>

        <Group gap={4}>
          <Tooltip label="Previous version" withArrow>
            <ActionIcon
              variant="default"
              size="sm"
              disabled={prevDisabled}
              onClick={() => ws.versioningManager.goPrevious(activeLayer)}
            >
              <ArrowLeftIcon />
            </ActionIcon>
          </Tooltip>
          <Select
            size="xs"
            flex={1}
            data={stepOptions}
            value={String(branchStep)}
            disabled={noHistory}
            onChange={(v) => v !== null && ws.versioningManager.goTo(activeLayer, Number(v))}
          />
          <Tooltip label="Next version" withArrow>
            <ActionIcon
              variant="default"
              size="sm"
              disabled={nextDisabled}
              onClick={() => ws.versioningManager.goNext(activeLayer)}
            >
              <ArrowRightIcon />
            </ActionIcon>
          </Tooltip>
        </Group>

        <ScrollArea.Autosize mah={120} offsetScrollbars>
          <Stack gap={2}>{tree.map((node) => renderNode(node, 0, true, ''))}</Stack>
        </ScrollArea.Autosize>

        <Group gap={4}>
          <Tooltip label="New branch" withArrow>
            <ActionIcon
              variant="default"
              size="sm"
              onClick={() => ws.dispatchAction(createBranch, activeLayer)}
            >
              <GitBranchIcon />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Add version" withArrow>
            <ActionIcon
              variant="default"
              size="sm"
              onClick={() => ws.dispatchAction(addVersion, activeLayer)}
            >
              <PlusIcon />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Go to parent branch" withArrow>
            <ActionIcon
              variant="default"
              size="sm"
              onClick={() => ws.versioningManager.goToParentBranch(activeLayer)}
            >
              <ArrowLineUpIcon />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset versioning" withArrow>
            <ActionIcon
              variant="default"
              size="sm"
              onClick={() => ws.dispatchAction(resetVersioning, activeLayer)}
            >
              <EraserIcon />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Stack>
    </Paper>
  );
}

const Connector = styled.span`
  font-family: monospace;
  color: #666;
  white-space: pre;
  user-select: none;
  flex-shrink: 0;
`;
