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
    gap={16}
    padding={48}
  >
    <ProgressCircle />
    <Text>{message}</Text>
  </Flex>
);
