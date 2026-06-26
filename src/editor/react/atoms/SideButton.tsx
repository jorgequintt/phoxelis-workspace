import { useState } from 'react';
import styled from 'styled-components';

interface Props extends React.ComponentPropsWithoutRef<'button'> {
  active?: boolean;
}

export function SideButton(props: Props) {
  const { active, children, ...buttonProps } = props;
  const [isHovered, setIsHovered] = useState(false);
  const handleHover = () => {
    setIsHovered(true);
  };

  const handleHoverOut = () => {
    setIsHovered(false);
  };

  return (
    <Button
      $hovered={isHovered}
      $active={active}
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverOut}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}

const Button = styled.button<{ $active?: boolean; $hovered?: boolean }>`
  background: ${(p) => (p.$active ? '#888' : p.$hovered ? '#666' : '#444')};
  color: #ccc;
  border: 1px solid #555;
  border-radius: 3px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
`;
