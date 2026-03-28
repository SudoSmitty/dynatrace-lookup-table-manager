# Lookup Table Manager – Dynatrace AppEngine Application

A polished Dynatrace AppEngine app for creating, viewing, updating, and deleting **Grail lookup tables** within a Dynatrace SaaS tenant.

---

## Features

| Feature | Description |
|---------|-------------|
| **List** | Browse all lookup tables in a searchable, sortable DataTable with pagination. |
| **Create** | Upload a new lookup table via a guided form with drag-and-drop file upload. |
| **View** | Inspect a table's metadata and preview up to 100 rows of data. |
| **Update** | Replace an existing table's data by re-uploading a file (overwrite mode). |
| **Delete** | Remove a table with a confirmation dialog and success/error feedback. |

---

## Tech Stack

- **React 18** + **TypeScript** (frontend)
- **Strato Design System** (`@dynatrace/strato-components-preview`) for all UI
- **Dynatrace Platform APIs** (Resource Store, DQL Query)
- **Dynatrace AppEngine** packaging & deployment

---

## Project Structure

```
dynatrace-lookup-table-manager/
├── app.config.ts                # dt-app CLI configuration (git-ignored)
├── manifest.yaml                # Dynatrace app manifest (scopes, modules)
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
└── ui/
    ├── main.tsx                 # React entry – mounts the app
    ├── App.tsx                  # Root component with routing
    ├── types.ts                 # Shared TypeScript interfaces
    ├── dynatrace.d.ts           # Dynatrace platform type declarations
    ├── tsconfig.json            # UI-specific TypeScript config
    ├── api/
    │   ├── platformFetch.ts     # Low-level fetch wrapper for platform APIs
    │   ├── lookupTableService.ts# CRUD operations (list, upload, delete, preview)
    │   └── index.ts
    ├── hooks/
    │   ├── useLookupTables.ts   # Hook for listing tables
    │   ├── useLookupPreview.ts  # Hook for previewing table data
    │   ├── useNotifications.ts  # Toast notification state
    │   └── index.ts
    ├── components/
    │   ├── AppHeader.tsx        # Reusable page header
    │   ├── ConfirmDialog.tsx    # Delete confirmation modal
    │   ├── DataPreviewPanel.tsx # Table data preview display
    │   ├── EmptyState.tsx       # Friendly "no data" placeholder
    │   ├── FileDropZone.tsx     # Drag-and-drop file selector
    │   ├── LoadingOverlay.tsx   # Spinner overlay
    │   ├── NotificationBar.tsx  # Toast-style notifications
    │   └── index.ts
    ├── pages/
    │   ├── ListLookupTablesPage.tsx    # Main table list view
    │   ├── LookupTableDetailPage.tsx   # Single table detail/preview
    │   ├── UploadLookupTablePage.tsx   # Create / Update form
    │   └── index.ts
    ├── utils/
    │   └── dplInference.ts      # DPL parse-pattern inference logic
    ├── styles/
    │   └── global.css           # Minimal global styles & animations
    └── assets/
        └── logo.png.placeholder # App logo placeholder
```

---

## Prerequisites

1. **Node.js** ≥ 18
2. **Dynatrace App Toolkit** (`dt-app`) – install globally:
   ```bash
   npm install -g @dynatrace/dt-app
   ```
3. A **Dynatrace SaaS** environment with AppEngine enabled.

---

## Setup

```bash
# Clone the project
git clone https://github.com/SudoSmitty/dynatrace-lookup-table-manager.git
cd dynatrace-lookup-table-manager

# Install dependencies
npm install
```

Edit `app.config.ts` and set your **environmentUrl**:

```ts
environmentUrl: "https://YOUR_ENVIRONMENT.apps.dynatrace.com",
```

---

## Development

```bash
# Start the dev server with hot reload
npm start
# or
dt-app dev
```

This opens a proxied browser session pointed at your Dynatrace environment.

---

## Build & Deploy

```bash
# Build the production bundle
npm run build

# Deploy to your Dynatrace environment
npm run deploy
# or
dt-app deploy
```

The deployment will:
1. Package the app according to `manifest.yaml`.
2. Upload it to your Dynatrace environment.
3. Request the OAuth scopes listed in the manifest (storage:files:read/write/delete, etc.).

---

## Required Scopes

| Scope | Purpose |
|-------|---------|
| `storage:files:read` | Read lookup table files from the Resource Store |
| `storage:files:write` | Upload and update lookup table files |
| `storage:files:delete` | Delete lookup table files |
| `storage:system:read` | Query dt.system.files to list lookup tables |
| `storage:buckets:read` | Allow DQL queries to access Grail storage |

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/platform/storage/resource-store/v1/files/tabular/lookup:upload` | POST | Create / update a lookup table |
| `/platform/storage/resource-store/v1/files/tabular/lookup:test-pattern` | POST | Validate a DPL parse pattern |
| `/platform/storage/resource-store/v1/files:delete` | POST | Delete a lookup table |
| `/platform/storage/query/v1/query:execute` | POST | Execute DQL (list files, preview data) |

---

## Key DQL Queries

**List all lookup tables:**
```dql
fetch dt.system.files
| filter matchesPhrase(path, "/lookups/")
| fields filePath = path, displayName = file_name,
         description = toString(metadata),
         sizeBytes = file_size, lastModified = timestamp
| sort lastModified desc
```

**Preview a table's data:**
```dql
load "/lookups/my_table.csv"
| limit 100
```

**Count records:**
```dql
load "/lookups/my_table.csv"
| summarize count()
```

---

## Notes

- The **Resource Store upload** endpoint expects `multipart/form-data` with two parts:
  - `request` – a JSON blob containing `filePath`, `lookupField`, and optionally `parsePattern`, `displayName`, `description`.
  - `content` – the actual data file.
- When creating a new table, omit the `?overwrite=true` query parameter (or set `overwrite=false`).
- When updating, add `?overwrite=true` to fully replace the existing file.
- The app does **not** support appending rows; updates replace the entire table.
- Permissions are also enforced server-side by Dynatrace. If a user lacks the necessary scopes, the API will return a 403 and the app will display a friendly error.

---

## License

This project is unlicensed / internal. Adjust as needed for your organization.
