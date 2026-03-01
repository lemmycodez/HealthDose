# HealthDose AI — Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [RAG Pipeline](#rag-pipeline)
5. [Cloud Functions API](#cloud-functions-api)
6. [Frontend Application](#frontend-application)
7. [Features Implemented](#features-implemented)
8. [Milestones](#milestones)
9. [Errors Encountered & Resolutions](#errors-encountered--resolutions)
10. [Deployment Guide](#deployment-guide)
11. [Configuration Reference](#configuration-reference)

---

## Project Overview

**HealthDose AI** is an intelligent pharmacology assistant built for Zambian healthcare contexts. It combines a Retrieval-Augmented Generation (RAG) knowledge base with Gemini AI to answer questions about drug dosages, side effects, mechanisms of action, and drug interactions.

The application was deployed and served at: `https://med-assist-9edf0.web.app`

**Core Capabilities:**

- Natural language Q&A about medications, backed by curated medical literature
- Three-tier answer sourcing: local knowledge base → FDA database → Gemini AI
- Drug interaction checking between two medications
- Response delivery in Zambian local languages (Bemba, Nyanja, Tonga, Lozi)
- Session-based chat history with full management (rename, delete, restore)
- Voice input via Web Speech API
- Dark/light theme
- First-time medical disclaimer modal

---

## Technology Stack

| Layer             | Technology                                         |
| ----------------- | -------------------------------------------------- |
| Frontend          | React 18, TypeScript, Tailwind CSS, Vite           |
| Backend           | Firebase Cloud Functions (Gen 2, Node.js 22)       |
| AI Generation     | Google Vertex AI — `gemini-2.0-flash-001`          |
| Embeddings        | Google Vertex AI — `text-embedding-004` (768 dims) |
| Database          | Cloud Firestore                                    |
| External Fallback | OpenFDA API (`api.fda.gov`)                        |
| Auth              | Firebase Authentication                            |
| Hosting           | Firebase Hosting                                   |
| RAG Pipeline      | Python 3.x scripts                                 |
| Package Manager   | pnpm (monorepo)                                    |

---

## System Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│  (Dashboard · Auth · ThemeContext)       │
└──────────────────┬──────────────────────┘
                   │ HTTPS fetch
┌──────────────────▼──────────────────────┐
│         Firebase Cloud Functions        │
│  ┌────────────────────────────────────┐ │
│  │  askHealthDose  (POST)             │ │
│  │  searchMeds     (GET)              │ │
│  │  getMedication  (GET)              │ │
│  │  checkDrugInteraction (POST)       │ │
│  │  drugInteractions (GET)            │ │
│  │  healthCheck    (GET)              │ │
│  │  testRag        (GET)              │ │
│  └───────────────┬────────────────────┘ │
└──────────────────┼──────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
  Firestore    Vertex AI   OpenFDA API
 (medical_   (Embeddings  (api.fda.gov)
  knowledge   + Gemini)
  collection)
```

### RAG Query Cascade

```
User Question
      │
      ▼
Generate Query Embedding (text-embedding-004)
      │
      ▼
Cosine Similarity Search over Firestore chunks
      │
  ┌───┴──────────────────┐
  │ similarity ≥ 0.5?    │
  │ (up to 5 chunks)     │
  └──┬───────────────────┘
     │YES                │NO
     ▼                   ▼
Build Context        Query OpenFDA API
    +                    │
Gemini Answer        ┌───┴─────────┐
    │                │  Found?     │
    ▼                └──┬──────────┘
 answerSource:         YES         NO
   'rag'               ▼           ▼
                  Gemini +    Gemini (base
                  FDA data    knowledge)
                      │           │
                      ▼           ▼
                 answerSource: answerSource:
                  'openFDA'    'gemini'
```

---

## RAG Pipeline

The RAG pipeline runs as a set of Python scripts in `rag-pipeline/`:

### Scripts (run in order)

| Script                       | Purpose                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `process_documents.py`       | Chunks PDFs, TXT, DOCX from `medical-documents/` and `docx/`     |
| `generate_embeddings.py`     | Calls Vertex AI `text-embedding-004` per chunk                   |
| `upload_to_firestore.py`     | Uploads all chunks + embeddings to Firestore `medical_knowledge` |
| `retry_failed_embeddings.py` | Re-generates embeddings only for failed chunks, then uploads     |

### Knowledge Base

The `medical_knowledge` Firestore collection contains **261 chunks** across these sources:

| Source Document            | Type       |
| -------------------------- | ---------- |
| Pharmacotherapy Handbook   | PDF        |
| Principles of Pharmacology | PDF        |
| RAG.pdf                    | PDF        |
| projectPlan.md             | Markdown   |
| common-meds.pdf            | PDF        |
| amoxicillin.txt            | Plain text |
| ibuprofen.txt              | Plain text |
| warfarin.txt               | Plain text |

Each Firestore document contains:

```json
{
  "chunk_id": "unique-id",
  "doc_id": "source-document-id",
  "filename": "ibuprofen.txt",
  "title": "Ibuprofen — Side Effects",
  "drug_name": "Ibuprofen",
  "chunk_index": 2,
  "text": "...",
  "word_count": 180,
  "embedding": [0.012, -0.034, ...],  // 768 dimensions
  "created_at": "server timestamp"
}
```

### Adding New Documents

1. Drop the PDF, DOCX, or TXT file into `docx/` or `medical-documents/`
2. From the `rag-pipeline/` directory, run (in Windows cmd.exe with gcloud authenticated):
   ```
   set PYTHONUTF8=1
   python process_documents.py
   python generate_embeddings.py
   python upload_to_firestore.py
   ```
3. If any embeddings fail: `python retry_failed_embeddings.py`

---

## Cloud Functions API

All endpoints deployed at: `https://us-central1-med-assist-9edf0.cloudfunctions.net`

### `POST /askHealthDose`

Main chat endpoint. Implements the full RAG cascade.

**Request:**

```json
{ "question": "What are the side effects of ibuprofen?" }
```

**Response:**

```json
{
  "success": true,
  "question": "...",
  "answer": "...",
  "sources": [{ "title": "...", "drugName": "Ibuprofen", "excerpt": "...", "relevance": 0.82 }],
  "answerSource": "rag",
  "processingTime": 1240,
  "timestamp": "2025-..."
}
```

`answerSource` values:

- `"rag"` — answered from local Firestore knowledge base
- `"openFDA"` — answered from FDA drug label data
- `"gemini"` — answered from Gemini base knowledge (with disclaimer appended)

### `POST /checkDrugInteraction`

**Request:** `{ "drugA": "Warfarin", "drugB": "Ibuprofen" }`

**Response:**

```json
{
  "found": true,
  "hasInteraction": true,
  "highestSeverity": "severe",
  "medications": { "a": { "name": "Warfarin" }, "b": { "name": "Ibuprofen" } },
  "interactions": [{ "severity": "severe", "type": "...", "description": "...", "advice": "..." }],
  "summary": "⚠️ 1 interaction found. This combination may be dangerous."
}
```

### `GET /searchMeds?q=ibu&limit=20`

Searches the `medications` Firestore collection.

### `GET /getMedication?id=<id>`

Returns full medication record by ID.

### `GET /drugInteractions?drug=Warfarin`

Returns all known interactions for a given drug.

### `GET /healthCheck`

Returns API status and available endpoint list.

---

## Frontend Application

**Location:** `apps/web/src/`

### Key Files

| File                      | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `pages/Dashboard.tsx`     | Main chat UI — all features live here                       |
| `services/chatService.ts` | API wrapper for RAG endpoint + drug interaction             |
| `AuthContext.tsx`         | Firebase Auth context                                       |
| `ThemeContext.tsx`        | Dark/light mode state                                       |
| `style.css`               | Tailwind base + Ember Green custom theme                    |
| `App.tsx`                 | React Router — Landing, Login, GetStarted, Dashboard routes |
| `lib/firebase/config.ts`  | Firebase SDK initialisation                                 |

### Chat Session Storage

Chat sessions are persisted in `localStorage` under two keys:

- `hd_chat_v1` — active sessions
- `hd_chat_deleted_v1` — recently deleted sessions (restorable)

Session schema:

```typescript
interface ChatSession {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sources?: RagSource[] // citation data from RAG
  answerSource?: 'rag' | 'openFDA' | 'gemini' | 'error'
  feedback?: 'up' | 'down' // user feedback
}
```

---

## Features Implemented

### Chat Interface

- **Multi-session management** — create, rename, delete, restore sessions
- **Message editing** — edit any user message and re-send
- **Message deletion** — removes message pair (user + AI response)
- **Copy to clipboard** — copy AI responses with one click
- **Typing indicator** — animated dots while AI processes
- **Auto-scroll** — always scrolls to latest message
- **Voice input** — Web Speech API (Chrome/Edge); appends transcript to input

### AI Responses

- **Answer Source Badge** — shows where the answer came from:
  - 📚 Knowledge Base (RAG from Firestore)
  - 🏥 FDA Database (OpenFDA fallback)
  - 🤖 AI Knowledge (Gemini base knowledge)
- **Citation buttons** — clickable chips per source document; expand to show excerpt + relevance score
- **Thumbs up/down feedback** — users can rate each AI response

### Drug Interaction Checker

- Accessible via "Drug Interactions" button in the header
- Enter two drug names → check against the interactions database
- Results show severity (severe/moderate/mild), type, description, and clinical advice

### Language Support (Zambian Languages)

- Configurable in Settings → Response Language
- Options: English, Bemba, Nyanja, Tonga, Lozi
- Selected language is persisted to `localStorage`
- AI instructions are prepended to every query for the chosen language

### UI / UX

- **Dark/Light theme** — toggle in Settings, persisted to `localStorage`
- **Medical disclaimer modal** — shown once on first login; persisted to `localStorage`
- **File attachment** — attach images/PDFs to messages (UI; content shown as reference)
- **Suggested questions** — empty state shows clickable example queries
- **Responsive layout** — collapsible sidebar, mobile-friendly input bar
- **Ember Green theme** — custom CSS variables via Tailwind

---

## Milestones

### Milestone 1: Codebase Setup and Branch Management

Established the `final-RAG` branch as the working base. Resolved uncommitted changes on `expanded-KB` via git stash, checked out the target branch, and confirmed the deployment state of all seven Cloud Functions.

### Milestone 2: Knowledge Base Expansion

Added `common-meds.pdf` (a curated Zambian common medications reference) to the RAG pipeline. Ran the full four-step pipeline:

- Document chunking (`process_documents.py`)
- Embedding generation (`generate_embeddings.py`)
- Firestore upload (`upload_to_firestore.py`)
- Retry for failed chunks (`retry_failed_embeddings.py`)

Final result: **261 chunks** in Firestore, all with 768-dimensional embeddings.

### Milestone 3: RAG Fallback Cascade

Extended `ragQuery.ts` to implement a three-tier answer cascade:

1. **RAG** — cosine similarity search over local Firestore chunks (threshold: 0.5, top 5)
2. **OpenFDA** — queries the free `api.fda.gov/drug/label.json` endpoint for official FDA label data
3. **Gemini base knowledge** — answers from Gemini's training with a mandatory safety disclaimer

The `answerSource` field is included in every response so the frontend can badge answers correctly.

### Milestone 4: Cloud Function Deployment

Successfully deployed all seven Cloud Functions (`askHealthDose`, `testRag`, `checkDrugInteraction`, `drugInteractions`, `searchMeds`, `getMedication`, `healthCheck`) after resolving a Windows-specific deployment timeout issue (see Errors section below).

### Milestone 5: Structured API Response + Frontend Refactor

Refactored `chatService.ts` to return a structured `AIResponse` object (`text`, `sources[]`, `answerSource`) instead of a plain string. Updated `Dashboard.tsx` to store this data on each chat message and render it with UI components.

### Milestone 6: Citation Buttons

Implemented citation source chips below each AI response. Each chip shows the drug name and relevance percentage. Clicking a chip expands a popover with the source title, drug name, and the relevant excerpt from the document.

### Milestone 7: Answer Source Badge

Added a source badge to each AI response:

- 📚 **Knowledge Base** (emerald) — from RAG
- 🏥 **FDA Database** (blue) — from OpenFDA
- 🤖 **AI Knowledge** (purple) — from Gemini

### Milestone 8: Zambian Language Support

Added a language switcher (English, Bemba, Nyanja, Tonga, Lozi) in the Settings modal. The selected language is persisted across sessions. When a Zambian language is selected, a language instruction is prepended to every query before it is sent to the Cloud Function — Gemini then responds in that language.

### Milestone 9: Drug Interaction Checker UI

Built a modal-based Drug Interaction Checker accessible from the main header. Users enter two drug names; the frontend calls the existing `checkDrugInteraction` Cloud Function and renders severity-colour-coded results with interaction descriptions and clinical management advice.

### Milestone 10: Thumbs Up/Down Feedback

Added thumbs-up/thumbs-down buttons to each AI message (visible on hover). Feedback state is stored in the chat session in `localStorage`.

### Milestone 11: Medical Disclaimer Modal

Implemented a first-load disclaimer modal that informs users the tool provides educational pharmacological information only and is not a substitute for professional medical advice. The modal is dismissed with "I Understand — Continue" and never shown again (flag in `localStorage`).

---

## Errors Encountered & Resolutions

### Error 1: Git Checkout Blocked by Uncommitted Changes

**Symptom:** `git checkout final-RAG` failed with "Your local changes would be overwritten."

**Root Cause:** The `expanded-KB` branch had modified files that conflicted with the target branch.

**Resolution:** Stashed all uncommitted changes with a descriptive message:

```
git stash push -m "expanded-KB work in progress"
```

Then checked out `final-RAG`. The stash can be restored later with `git stash pop`.

---

### Error 2: Python UnicodeEncodeError on Windows

**Symptom:** `generate_embeddings.py` crashed immediately with `UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f4c2'`.

**Root Cause:** The script uses emoji characters in `print()` statements. Windows Command Prompt and Git Bash default to the system code page (`cp1252` on Windows), which cannot encode Unicode emoji.

**Resolution:** Run all Python scripts with the `PYTHONUTF8` environment variable:

```
set PYTHONUTF8=1 && python generate_embeddings.py
```

---

### Error 3: gcloud Auth — "Python was not found"

**Symptom:** Running `gcloud auth login` in Git Bash (MINGW64) produced `Python was not found; run without arguments to install from the Microsoft Store`.

**Root Cause:** Git Bash's MINGW64 environment modifies PATH resolution in a way that prevents the gcloud Python wrapper from locating the system Python installation.

**Resolution:** Run all gcloud commands from Windows **Command Prompt (cmd.exe)**, not Git Bash:

```cmd
gcloud auth login
gcloud auth application-default login
```

---

### Error 4: Firebase Authentication Expired During Deploy

**Symptom:** `firebase deploy` returned `Error: Authentication Error: Your credentials have expired.`

**Resolution:**

```cmd
firebase login --reauth
```

Must be run from cmd.exe. Firebase CLI sessions expire; re-auth periodically.

---

### Error 5: Firebase Deploy Network Failure

**Symptom:** `Error: Failed to make request to cloudresourcemanager.googleapis.com`.

**Root Cause:** Transient network blip during the API request to Google's resource manager service.

**Resolution:** Retry the deploy command. No code changes were needed.

---

### Error 6: Firebase Deploy "User code failed to load" Timeout (Critical)

**Symptom:**

```
Error: Firebase CLI could not determine the backends deployed by your function source.
User code failed to load. Cannot determine backend specification.
Timeout after 10000 ms
```

**Root Cause:** The Firebase CLI locally executes `functions/lib/index.js` to extract function metadata (endpoints, triggers, memory settings) before deploying. This analysis step has a hard-coded **10-second timeout**. On Windows, `firebase-admin` v13 uses gRPC native binaries that take **8–10 seconds** just to load their module graph — measured:

- `searchMedications.js`: 10,299ms
- `interactionChecker.js`: 6,173ms

By the time the gRPC modules finished loading, the CLI had already timed out.

**Resolution:** Set the `FUNCTIONS_DISCOVERY_TIMEOUT` environment variable to 60 seconds before deploying. This variable overrides the CLI's default 10s analysis timeout:

```cmd
set FUNCTIONS_DISCOVERY_TIMEOUT=60000&& firebase deploy --only functions
```

> **Important:** The `&&` must immediately follow `60000` with no space, or the env var does not propagate correctly on Windows cmd.exe.

**Always deploy from cmd.exe, not Git Bash.** The gRPC native modules behave differently under MINGW64 and can produce additional errors.

---

### Error 7: common-meds.pdf — All 4 Embedding Chunks Failed

**Symptom:** After running `generate_embeddings.py`, all 4 chunks from `common-meds.pdf` had `null` embeddings. The other 257 chunks succeeded.

**Root Cause:** SSL connection drops occurred during the long embedding generation run. The PDF was processed near the end of the batch, by which time the connection had degraded.

**Resolution:** Created `retry_failed_embeddings.py` which:

1. Loads the existing `all_chunks_with_embeddings.json`
2. Identifies all chunks with `null` or missing `embedding` field
3. Retries embedding generation with up to 3 attempts + exponential backoff (3s, 6s, 9s)
4. Saves the updated JSON
5. Uploads only the newly-embedded chunks directly to Firestore

**Result:** All 54 retried chunks (across multiple documents including `common-meds.pdf`) embedded and uploaded successfully. Final count: 261/261.

---

### Error 8: OpenFDA Returning Empty Results for Some Queries

**Symptom:** OpenFDA fallback returned `null` for broad questions like "What is the maximum daily dose?"

**Root Cause:** The OpenFDA query extracts the first drug-like term from the question using regex. Broad or general questions don't contain a recognisable drug name.

**Resolution:** The three-tier cascade handles this gracefully — if OpenFDA returns no results, Gemini's base knowledge is used as the final fallback with an appended safety disclaimer. This is by design: the cascade degrades gracefully.

---

## Deployment Guide

### Prerequisites

- Node.js 22+, Python 3.8+, pnpm
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud SDK (gcloud) installed and authenticated
- Access to `med-assist-9edf0` Firebase project

### Frontend Deployment

```cmd
cd apps/web
pnpm build
firebase deploy --only hosting
```

### Cloud Functions Deployment

**Always from cmd.exe:**

```cmd
cd functions
npm run build
cd ..
set FUNCTIONS_DISCOVERY_TIMEOUT=60000&& firebase deploy --only functions
```

### Full Deployment

```cmd
set FUNCTIONS_DISCOVERY_TIMEOUT=60000&& firebase deploy
```

---

## Configuration Reference

### Environment Variables

**`apps/web/.env.local`** (frontend, not committed):

```
VITE_GEMINI_API_KEY=your_gemini_key    # Optional — app uses Cloud Functions
VITE_FUNCTIONS_URL=https://us-central1-med-assist-9edf0.cloudfunctions.net
```

**`apps/web/.env.example`** (template committed to repo):
Contains the same keys with placeholder values.

### Firebase Project Settings

```
Project ID:  med-assist-9edf0
Region:      us-central1
Firestore:   Cloud Firestore (native mode)
Auth:        Email/Password + Google Sign-In
Hosting:     Firebase Hosting
```

### RAG Parameters (in `functions/src/ragQuery.ts`)

```typescript
const EMBEDDING_MODEL = 'text-embedding-004'
const GENERATION_MODEL = 'gemini-2.0-flash-001'
const MAX_CHUNKS = 5
const SIMILARITY_THRESHOLD = 0.5
const PROJECT_ID = 'med-assist-9edf0'
const LOCATION = 'us-central1'
```

### Auth / Credential Locations

- Google Cloud ADC: `%APPDATA%\gcloud\application_default_credentials.json`
- Firebase session: stored by Firebase CLI in OS keychain / `~/.config/firebase`

---

## Known Limitations

1. **Cosine similarity search is O(n)** — every query scans all Firestore chunks. This scales acceptably to thousands of chunks but would require a vector database (Pinecone, Vertex AI Matching Engine) for tens of thousands.

2. **Language quality** — Gemini's Bemba, Nyanja, Tonga, and Lozi support is limited compared to English. Responses are generally intelligible but may mix in English terms for medical vocabulary that lacks established local translations.

3. **Drug interaction database** — the `medications` and `interactions` Firestore collections reflect the dataset that was seeded. Interactions not in this dataset return "not found" rather than "no interaction" — users should be informed of this distinction.

4. **File attachment** — the UI accepts file uploads and shows them in the chat, but the file content is not currently sent to the AI backend for processing.

5. **Voice input** — uses the browser Web Speech API, which requires Chrome or Edge. Not available in Firefox or Safari.
