/**
 * components/LoadingOverlay.tsx
 * ---------------------------------------------------------------------------
 * Full-area loading spinner for in-progress operations.
 */

import React from "react";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { ProgressCircle } from "@dynatrace/strato-components-preview/content";
import { Text } from "@dynatrace/strato-components/typography";

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Loading…",
}) => (
  <Flex
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    gap={20}
    padding={64}
    style={{ animation: "fadeInScale 0.3s ease both" }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--ltm-accent-soft-1), var(--ltm-accent-soft-2))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <ProgressCircle />
    </div>
    <Text style={{ fontWeight: 500, letterSpacing: "0.01em" }}>{message}</Text>
  </Flex>
);
