/**
 * components/AppHeader.tsx
 * ---------------------------------------------------------------------------
 * Application header shown above every page, with title and optional actions.
 */

import React from "react";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Heading } from "@dynatrace/strato-components/typography";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => (
  <Flex
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center"
    padding={24}
    gap={16}
    style={{
      borderBottom: "1px solid var(--dt-colors-border-neutral-default)",
      background: "var(--dt-colors-surface-default)",
    }}
  >
    <Flex flexDirection="column" gap={4}>
      <Heading level={4}>{title}</Heading>
      {subtitle && (
        <span
          style={{
            color: "var(--dt-colors-text-neutral-default)",
            fontSize: "var(--dt-text-small-font-size, 13px)",
          }}
        >
          {subtitle}
        </span>
      )}
    </Flex>
    {actions && (
      <Flex flexDirection="row" gap={8} alignItems="center">
        {actions}
      </Flex>
    )}
  </Flex>
);
