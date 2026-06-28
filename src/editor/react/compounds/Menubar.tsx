import { Menu, Menubar as MMenubar, Text } from '@mantine/core';

export interface MenubarItem {
  name: string;
  menu: MenuEntry[];
  width: number;
}

export interface MenuOption {
  type: 'option';
  checked?: boolean;
  name: string;
  command: () => any;
  hotkey?: string;
}

export interface MenuDivider {
  type: 'divider';
}

export type MenuEntry = MenuOption | MenuDivider | SubMenu;

export interface SubMenu {
  type: 'submenu';
  name: 'string';
  options: MenuEntry[];
}

function renderMenuItems(menuEntries: MenuEntry[]) {
  return menuEntries.map((o) => {
    if (o.type === 'option') {
      return o.checked !== undefined ? (
        <Menu.CheckboxItem
          key={`check-${o.name}`}
          onClick={o.command}
          checked={o.checked}
          rightSection={
            o.hotkey ? (
              <Text size="xs" c="dimmed">
                {o.hotkey}
              </Text>
            ) : undefined
          }
        >
          {o.name}
        </Menu.CheckboxItem>
      ) : (
        <Menu.Item
          key={`item-${o.name}`}
          onClick={o.command}
          rightSection={
            o.hotkey ? (
              <Text size="xs" c="dimmed">
                {o.hotkey}
              </Text>
            ) : undefined
          }
        >
          {o.name}
        </Menu.Item>
      );
    }

    if (o.type === 'divider') {
      return <Menu.Divider />;
    }

    if (o.type === 'submenu') {
      return (
        <>
          <Menu.Sub.Target key={`target-${o.name}`}>
            <Menu.Sub.Item key={`subitem-${o.name}`}>{o.name}</Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown key={`dropdown-${o.name}`}>
            {renderMenuItems(o.options)}
          </Menu.Sub.Dropdown>
        </>
      );
    }

    return;
  });
}

export function Menubar(props: { items: MenubarItem[] }) {
  return (
    <MMenubar>
      {props.items.map((m) => (
        <>
          <MMenubar.Menu key={`menu-${m.name}`} width={m.width}>
            <MMenubar.Target key={`target-${m.name}`}>{m.name}</MMenubar.Target>
            <MMenubar.Dropdown key={`dropdown-${m.name}`}>
              {renderMenuItems(m.menu)}
            </MMenubar.Dropdown>
          </MMenubar.Menu>
        </>
      ))}
    </MMenubar>
  );
}
