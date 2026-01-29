# Spec-Logic: AI-Powered PC Building Assistant

> **Algolia Agent Studio Challenge Submission**  
> Category: Consumer-Facing Non-Conversational Experiences

Spec-Logic is an AI-driven hardware consultant designed to eliminate compatibility errors in complex tech builds. It leverages **Algolia Agent Studio** combined with **InstantSearch** to provide intelligent, context-aware component recommendations while enforcing technical compatibility constraints.

## Features

- **Smart Compatibility Checking**: Automatic filtering prevents incompatible parts from being shown
- **Real-time PSU Calculator**: Accurate power calculations with transient spike handling
- **AI-Powered Assistant**: Natural language queries powered by Algolia Agent Studio
- **Export & Share**: Export builds to PCPartPicker, Reddit, or shareable links

## Project Structure

```
spec-logic/
├── frontend/          # Next.js 14 application
│   ├── app/          # App router pages and API routes
│   ├── components/   # React components (UI, search, build)
│   ├── lib/          # Utilities and Algolia client
│   ├── stores/       # Zustand state management
│   └── types/        # TypeScript definitions
│
├── backend/           # Python ETL pipeline
│   ├── etl/          # Extract, Transform, Load modules
│   ├── scripts/      # Pipeline runners and configuration
│   ├── data/         # Raw and processed data
│   └── tests/        # Unit and integration tests
│
└── specs/            # Documentation
    ├── PRD.md        # Product Requirements Document
    └── IMPLEMENTATION_PLAN.md
```

## Quick Start

### Prerequisites

- Node.js 22.12+
- Python 3.11+
- pnpm (recommended) or npm
- Algolia account (free Build plan)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your Algolia credentials

# Run ETL pipeline (dry run first)
python scripts/run_pipeline.py --dry-run

# Run with actual upload
python scripts/run_pipeline.py --clear-index
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Algolia credentials

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

### Backend (.env)

```env
ALGOLIA_APP_ID=your_app_id
ALGOLIA_ADMIN_KEY=your_admin_key
ALGOLIA_INDEX_NAME=prod_components
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_key
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=prod_components
NEXT_PUBLIC_AGENT_ID=your_agent_id
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=etl --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
pnpm test

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Algolia Features Used

| Feature | Usage |
|---------|-------|
| **Agent Studio** | AI assistant with system prompts and search tool |
| **Query Rules** | CPU/GPU model detection, socket filtering |
| **InstantSearch** | Real-time search with faceted filtering |
| **Faceted Search** | Socket, memory type, form factor filtering |
| **Custom Ranking** | Performance tier and price optimization |

## Compatibility Rules

### Hard Rules (Errors)
- CPU socket must match motherboard socket
- RAM type must match motherboard memory support
- GPU length must fit within case clearance
- Cooler height must fit within case clearance

### Soft Rules (Warnings)
- PSU wattage should exceed calculated requirements by 50%
- Cooler TDP rating should match CPU TDP
- Motherboard form factor should match case support

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Search**: Algolia InstantSearch, Agent Studio
- **State**: Zustand with persistence
- **Backend**: Python 3.11, Pandas, algoliasearch
- **Testing**: Vitest, Playwright, pytest

## License

This project was created for the Algolia Agent Studio Challenge 2026.

## Author

Spec-Logic Team
