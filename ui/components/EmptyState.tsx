/**
 * components/EmptyState.tsx
 * ---------------------------------------------------------------------------
 * Friendly empty-state placeholder when there's no data to show.
 */

import React from "react";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Heading, Text } from "@dynatrace/strato-components/typography";
import { IconClipboard } from "./Icons";

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
    gap={16}
    padding={64}
    style={{ textAlign: "center", animation: "fadeInUp 0.5s ease both" }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--ltm-accent-soft-1), var(--ltm-accent-soft-2))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        animation: "float 3s ease-in-out infinite",
      }}
    >
      <IconClipboard size={28} color="var(--ltm-accent-1)" />
    </div>
    <Heading level={5}>
      <span className="gradient-text">{title}</span>
    </Heading>
    {message && (
      <Text
        style={{
          maxWidth: 420,
          color: "var(--dt-colors-text-neutral-default)",
          lineHeight: 1.6,
        }}
      >
        {message}
      </Text>
    )}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </Flex>
);
