/**
 * dynatrace.d.ts
 * ---------------------------------------------------------------------------
 * Type declaration stubs for Dynatrace-private npm packages that are NOT
 * installed from the public registry.
 *
 * Strato packages are installed directly, so no stubs needed for those.
 */

/* ===================================================================
 * dt-app CLI config type
 * =================================================================== */
declare module "dt-app" {
  export interface OAuthScope {
    name: string;
    comment: string;
  }
  export interface AppOptions {
    id: string;
    name: string;
    version: string;
    description: string;
    icon?: string;
    scopes: OAuthScope[];
    hidden?: boolean;
    [key: string]: unknown;
  }
  export interface CliOptions {
    environmentUrl: string;
    app: AppOptions;
    build?: Record<string, unknown>;
    server?: Record<string, unknown>;
    injectSdk?: boolean;
    plugins?: unknown[];
  }
  /** @deprecated Use CliOptions */
  export type CliConfig = CliOptions;
}

/* ===================================================================
 * @dynatrace-sdk — Not directly imported in this app, but declared
 * for completeness.
 * =================================================================== */
declare module "@dynatrace-sdk/client-classic-environment-v2" {
  export const classicEnvironmentClient: any;
}

declare module "@dynatrace-sdk/client-query" {
  export const queryClient: any;
}
