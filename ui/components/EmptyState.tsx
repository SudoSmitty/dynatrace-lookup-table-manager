/**
 * components/EmptyState.tsx
 * ---------------------------------------------------------------------------
 * Friendly empty-state placeholder when there's no data to show.
 */

import React from "react";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Heading, Text } from "@dynatrace/strato-components/typography";

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  action,
}) => (
  <Flex
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    gap={12}
    padding={48}
    style={{ textAlign: "center" }}
  >
    <Heading level={5}>{title}</Heading>
    {message && (
      <Text
        style={{
          maxWidth: 400,
          color: "var(--dt-colors-text-neutral-default)",
        }}
      >
        {message}
      </Text>
    )}
    {action}
  </Flex>
);
