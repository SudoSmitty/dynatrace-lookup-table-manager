/**
 * App.tsx
 * ---------------------------------------------------------------------------
 * Root application component.
 * Sets up the Strato AppShell and React Router for page navigation.
 */

import React from "react";
import { Route, Routes } from "react-router-dom";
import { AppRoot } from "@dynatrace/strato-components-preview/core";

import {
  ListLookupTablesPage,
  LookupTableDetailPage,
  UploadLookupTablePage,
} from "./pages";

export const App: React.FC = () => (
  <AppRoot>
    <Routes>
      {/* Main list of all lookup tables */}
      <Route path="/" element={<ListLookupTablesPage />} />

      {/* Detail / preview view for a single table */}
      <Route path="/detail" element={<LookupTableDetailPage />} />

      {/* Create new table or update an existing one */}
      <Route path="/upload" element={<UploadLookupTablePage />} />
    </Routes>
  </AppRoot>
);
