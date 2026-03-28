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
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Decorative gradient accent line */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, var(--ltm-accent-1) 0%, var(--ltm-accent-2) 50%, var(--ltm-accent-1) 100%)",
        backgroundSize: "200% 100%",
        animation: "gradientShift 4s ease infinite",
      }}
    />
    <Flex flexDirection="column" gap={4} style={{ animation: "fadeInUp 0.3s ease both" }}>
      <Heading level={4}>
        <span className="gradient-text">{title}</span>
      </Heading>
      {subtitle && (
        <span
          style={{
            color: "var(--dt-colors-text-neutral-default)",
            fontSize: "var(--dt-text-small-font-size, 13px)",
            letterSpacing: "0.01em",
          }}
        >
          {subtitle}
        </span>
      )}
    </Flex>
    {actions && (
      <Flex
        flexDirection="row"
        gap={8}
        alignItems="center"
        style={{ animation: "fadeInUp 0.3s ease 0.1s both" }}
      >
        {actions}
      </Flex>
    )}
  </Flex>
);
