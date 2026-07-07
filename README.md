# GrowEasy AI-Powered CSV Importer

An intelligent CSV data importer that uses AI to map arbitrary CSV columns into a fixed GrowEasy CRM schema. Upload CSVs from any source — Facebook Lead Ads, Google Ads, Excel sheets, real estate CRM exports — and let AI do the mapping.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/Express-4-green?logo=express)
![Tech Stack](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tech Stack](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)

---

## 🏗️ Architecture

```
┌───────────────────┐         ┌──────────────────────┐
│                   │  POST   │                      │
│   Next.js App     │ ──────► │   Express Backend    │
│   (Frontend)      │ /api/   │   (API Server)       │
│                   │ import  │                      │
│  • CSV Upload     │ ◄────── │  • CSV Validation    │
│  • Client Parse   │  JSON   │  • Batch Splitting   │
│  • Preview Table  │         │  • AI Extraction     │
│  • Results View   │         │  • Retry Logic       │
│                   │         │  • Response Agg.     │
└───────────────────┘         └──────────┬───────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │   LLM Provider       │
                              │   (Swappable)        │
                              │                      │
                              │  • Gemini (default)   │
                              │  • OpenAI            │
                              │  • Claude            │
                              └──────────────────────┘
```

## ✨ Features

### Core
- **Drag & Drop Upload** — Upload .csv files with drag-and-drop or file picker
- **Client-Side Preview** — Parse and preview CSV data before sending to backend
- **AI-Powered Mapping** — Intelligently maps arbitrary CSV columns to CRM schema
- **Batch Processing** — Splits large CSVs into batches with controlled concurrency
- **Retry Logic** — Exponential backoff retry for failed AI batches
- **Results Export** — Download mapped CRM records as CSV

### UI/UX
- **4-Step Flow** — Upload → Preview → Processing → Results
- **Dark Mode** — Toggle between dark and light themes (persisted)
- **Virtualized Tables** — Handles large CSVs (1000+ rows) smoothly
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Loading States** — Progress indicators during AI processing
- **Error Handling** — Graceful error display with retry options

### Backend
- **Multi-Provider AI** — Switch between Gemini, OpenAI, or Claude via env var
- **Request Validation** — Input validation with clear error messages
- **Rate Limiting** — Protects against abuse
- **Request Logging** — Method, path, duration, status logging
- **Clean Architecture** — Routes → Controllers → Services → Providers
- **Docker Support** — Dockerfile and docker-compose included

## 📋 CRM Schema

The AI maps CSV data to these GrowEasy CRM fields:

| Field | Description |
|-------|-------------|
| `created_at` | Lead creation date (YYYY-MM-DD HH:mm:ss) |
| `name` | Full lead name |
| `email` | Primary email address |
| `country_code` | Phone country code (e.g., +91) |
| `mobile_without_country_code` | Phone number (digits only) |
| `company` | Company name |
| `city` | City |
| `state` | State/Province |
| `country` | Country |
| `lead_owner` | Lead owner email/name |
| `crm_status` | One of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE |
| `crm_note` | Notes, remarks, extra contact info |
| `data_source` | One of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots |
| `possession_time` | Property possession timeline |
| `description` | Additional description |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- An AI API key (Gemini, OpenAI, or Anthropic)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/groweasy-csv-importer.git
cd groweasy-csv-importer
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your API key
npm install
npm run dev
```

The backend will start on `http://localhost:3001`.

### 3. Setup Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `AI_PROVIDER` | No | `gemini` | AI provider: `gemini`, `openai`, or `claude` |
| `GEMINI_API_KEY` | If using Gemini | — | Google Gemini API key |
| `OPENAI_API_KEY` | If using OpenAI | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | If using Claude | — | Anthropic API key |
| `BATCH_SIZE` | No | `25` | Rows per AI batch |
| `CONCURRENCY_LIMIT` | No | `3` | Max concurrent AI calls |
| `MAX_RETRIES` | No | `2` | Max retries per failed batch |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for CORS |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | Backend API URL |

---

## 🐳 Docker

### Build and run the backend with Docker:

```bash
# Build
docker build -t groweasy-backend ./backend

# Run
docker run -p 3001:3001 --env-file ./backend/.env groweasy-backend
```

### Or use Docker Compose:

```bash
# Make sure ./backend/.env exists
docker-compose up --build
```

---

## 📁 Project Structure

```
.
├── backend/                    # Express + TypeScript API server
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── config.ts          # Environment config
│   │   ├── routes/            # API routes
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   │   ├── aiExtractionService.ts  # Batch orchestration
│   │   │   └── csvService.ts           # CSV parsing
│   │   ├── providers/         # LLM provider implementations
│   │   │   ├── llmProvider.ts # Factory + interface
│   │   │   ├── geminiProvider.ts
│   │   │   ├── openaiProvider.ts
│   │   │   └── claudeProvider.ts
│   │   ├── middleware/        # Express middleware
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Utilities
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js 14 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout
│   │   │   ├── page.tsx       # Main 4-step flow
│   │   │   └── globals.css    # Styles
│   │   ├── components/        # UI components
│   │   │   ├── FileUploader.tsx
│   │   │   ├── CsvPreviewTable.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── SkippedRowsTable.tsx
│   │   │   ├── SummaryStats.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── lib/               # Utilities & API client
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Reference

### `POST /api/import`

Import CSV data via JSON body.

**Request Body:**
```json
{
  "headers": ["Name", "Email", "Phone", "Status"],
  "rows": [
    { "Name": "John Doe", "Email": "john@example.com", "Phone": "+919876543210", "Status": "Interested" }
  ]
}
```

**Response:**
```json
{
  "total_rows": 100,
  "total_imported": 95,
  "total_skipped": 5,
  "records": [
    {
      "created_at": null,
      "name": "John Doe",
      "email": "john@example.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [
    {
      "row_index": 3,
      "raw_row": { "Name": "Bad Row", "Email": "", "Phone": "" },
      "reason": "No valid email or mobile number found"
    }
  ]
}
```

### `POST /api/import/file`

Import CSV data via file upload (multipart/form-data).

### `GET /api/health`

Health check endpoint.

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 🌐 Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import the `frontend` directory in Vercel
3. Set `NEXT_PUBLIC_API_URL` to your backend URL
4. Deploy

### Backend → Render/Railway

1. Push code to GitHub
2. Create a new Web Service pointing to the `backend` directory
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables (AI_PROVIDER, API keys, FRONTEND_URL)
6. Deploy

---

## 📝 Known Limitations

- **Stateless**: No database — each import is independent. Results are not persisted.
- **File Size**: Maximum CSV file size is 5MB.
- **Row Limit**: Maximum 10,000 rows per import.
- **Rate Limiting**: 10 import requests per minute per IP.
- **AI Accuracy**: The AI mapping is best-effort. Complex or highly ambiguous CSVs may need manual review.

---

## 📄 License

MIT

---

**Position Applied For**: Intern

**Built with ❤️ for GrowEasy**
