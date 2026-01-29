# Spec-Logic Implementation Plan

> **Algolia Agent Studio Challenge - PC & Tech Concierge**  
> Implementation Timeline: 12 Days  
> Methodology: Test-Driven Development (TDD)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Testing Strategy](#3-testing-strategy)
4. [Phase 1: Foundation & Data Pipeline](#phase-1-foundation--data-pipeline-days-1-3)
5. [Phase 2: Backend API & Algolia Integration](#phase-2-backend-api--algolia-integration-days-4-6)
6. [Phase 3: Frontend UI Development](#phase-3-frontend-ui-development-days-4-6)
7. [Phase 4: Frontend-Backend Integration](#phase-4-frontend-backend-integration-days-7-8)
8. [Phase 5: Agent Studio & Chat Integration](#phase-5-agent-studio--chat-integration-days-9-10)
9. [Phase 6: Polish, E2E Testing & Deployment](#phase-6-polish-e2e-testing--deployment-days-11-12)
10. [Submission Checklist](#submission-checklist)

---

## 1. Project Structure

```
spec-logic/
├── frontend/                    # Next.js 14 App (Agent 1)
│   ├── app/
│   │   ├── (routes)/
│   │   │   ├── page.tsx        # Home/Discovery page
│   │   │   ├── build/
│   │   │   │   └── page.tsx    # Build configurator page
│   │   │   └── export/
│   │   │       └── page.tsx    # Export/Share page
│   │   ├── api/
│   │   │   ├── build/
│   │   │   │   ├── validate/route.ts
│   │   │   │   └── export/route.ts
│   │   │   └── psu/
│   │   │       └── calculate/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── build/              # Build-specific components
│   │   ├── search/             # Search/InstantSearch components
│   │   └── chat/               # Chat widget customizations
│   ├── lib/
│   │   ├── algolia.ts          # Algolia client configuration
│   │   ├── compatibility.ts    # Compatibility validation logic
│   │   ├── psu-calculator.ts   # PSU calculation logic
│   │   └── utils.ts
│   ├── stores/
│   │   └── build-store.ts      # Zustand store for build state
│   ├── types/
│   │   └── components.ts       # TypeScript interfaces
│   ├── __tests__/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── package.json
│
├── backend/                     # Python Data Pipeline (Agent 2)
│   ├── etl/
│   │   ├── __init__.py
│   │   ├── extractors/
│   │   │   ├── kaggle_extractor.py
│   │   │   └── techpowerup_scraper.py
│   │   ├── transformers/
│   │   │   ├── normalizer.py
│   │   │   ├── compatibility_tagger.py
│   │   │   └── schema_mapper.py
│   │   └── loaders/
│   │       └── algolia_loader.py
│   ├── scripts/
│   │   ├── run_pipeline.py
│   │   ├── setup_algolia_index.py
│   │   └── configure_query_rules.py
│   ├── data/
│   │   ├── raw/                # Raw CSV files from Kaggle
│   │   ├── processed/          # Cleaned/normalized data
│   │   └── fixtures/           # Test fixtures
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── requirements.txt
│   └── pytest.ini
│
├── docs/
│   ├── api-reference.md
│   ├── data-dictionary.md
│   └── deployment-guide.md
│
├── .env.example
├── docker-compose.yml          # For local development
└── README.md
```

---

## 2. Development Environment Setup

### 2.1 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22.12+ | Frontend runtime |
| Python | 3.11+ | Backend ETL pipeline |
| pnpm | 8.x | Package manager (faster than npm) |
| Docker | Latest | Local development services |

### 2.2 Environment Variables

Create `.env.local` (frontend) and `.env` (backend) with:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Algolia Application ID |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` | Public search-only API key |
| `ALGOLIA_ADMIN_KEY` | Admin key for indexing (backend only) |
| `NEXT_PUBLIC_AGENT_ID` | Agent Studio agent identifier |
| `OPENAI_API_KEY` or `GEMINI_API_KEY` | LLM provider key for Agent Studio |

### 2.3 Algolia Account Setup

1. Create Algolia account (free Build plan)
2. Create application named "spec-logic"
3. Generate API keys:
   - Search-only key (frontend)
   - Admin key (backend indexing)
4. Configure Agent Studio:
   - Set up LLM provider (Gemini recommended)
   - Create agent with system prompt from PRD

---

## 3. Testing Strategy

### 3.1 Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E (10%) │  ← Playwright: Critical user journeys
                    ├─────────────┤
                    │Integration  │  ← API routes, Algolia queries, 
                    │   (30%)     │    state management
                    ├─────────────┤
                    │ Unit (60%)  │  ← Components, utilities, 
                    │             │    business logic
                    └─────────────┘
```

### 3.2 Testing Tools by Layer

| Layer | Frontend | Backend |
|-------|----------|---------|
| **Unit** | Vitest + React Testing Library | pytest + pytest-mock |
| **Integration** | Vitest + MSW (API mocking) | pytest + moto (Algolia mock) |
| **E2E** | Playwright | pytest + requests |

### 3.3 Test Coverage Requirements

| Area | Minimum Coverage | Critical Paths |
|------|------------------|----------------|
| Compatibility Logic | 95% | Socket matching, memory type validation |
| PSU Calculator | 100% | All calculation scenarios |
| UI Components | 80% | User interactions, state changes |
| API Routes | 90% | Validation, export, error handling |
| ETL Pipeline | 85% | Data transformations, schema mapping |

### 3.4 TDD Workflow

For each feature:
1. **RED**: Write failing test that describes expected behavior
2. **GREEN**: Write minimal code to pass the test
3. **REFACTOR**: Improve code quality while keeping tests green

---

## Phase 1: Foundation & Data Pipeline (Days 1-3)

### BACKEND TASKS (Agent 2)

#### Task 1.1: Backend Project Setup
**Priority:** Critical | **Estimated Effort:** 2 hours

**Setup Steps:**
1. Initialize Python project with virtual environment
2. Install dependencies: `pandas`, `algoliasearch`, `pytest`, `requests`, `beautifulsoup4`
3. Configure pytest with markers for unit/integration separation
4. Set up pre-commit hooks for linting (black, flake8)

**Deliverables:**
- `requirements.txt` with pinned versions
- `pytest.ini` with test configuration
- `.pre-commit-config.yaml`

---

#### Task 1.2: Data Extraction - Kaggle Dataset
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases (Write First - TDD):**
- `test_kaggle_extractor_loads_cpu_data`: Verify CPU CSV parsing with expected columns
- `test_kaggle_extractor_loads_gpu_data`: Verify GPU CSV parsing
- `test_kaggle_extractor_handles_missing_file`: Graceful error handling
- `test_kaggle_extractor_validates_schema`: Ensure required columns exist

**Implementation:**
1. Create `KaggleExtractor` class with methods:
   - `extract_cpus(filepath: str) -> pd.DataFrame`
   - `extract_gpus(filepath: str) -> pd.DataFrame`
   - `validate_schema(df: pd.DataFrame, expected_columns: list) -> bool`

2. Download datasets:
   - CPU/GPU dataset from Kaggle
   - Store in `backend/data/raw/`

**Data Validation Rules:**
- Required CPU columns: name, brand, socket, tdp, cores, threads, base_clock, boost_clock
- Required GPU columns: name, brand, tdp, vram, memory_type, length_mm

---

#### Task 1.3: Data Extraction - TechPowerUp Scraper
**Priority:** High | **Estimated Effort:** 6 hours

**Test Cases (Write First - TDD):**
- `test_scraper_extracts_gpu_specs`: Mock HTML response, verify parsing
- `test_scraper_handles_rate_limiting`: Verify retry logic with backoff
- `test_scraper_extracts_dimensions`: Verify GPU length extraction
- `test_scraper_handles_missing_specs`: Graceful handling of incomplete data

**Implementation:**
1. Create `TechPowerUpScraper` class with methods:
   - `scrape_gpu_specs(model_url: str) -> dict`
   - `scrape_gpu_list(category: str) -> list[dict]`
   - `rate_limit_handler(func)` decorator

2. Handle scraping considerations:
   - Respect robots.txt
   - Implement exponential backoff (2s, 4s, 8s delays)
   - Cache responses locally to avoid re-scraping

**Scraped Fields:**
- GPU length (mm)
- Memory bandwidth
- Power connectors required
- Recommended PSU wattage

---

#### Task 1.4: Data Transformation - Normalizer
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases (Write First - TDD):**
- `test_normalize_socket_names`: "AM5" and "Socket AM5" → "AM5"
- `test_normalize_memory_types`: "DDR5-6000" → "DDR5"
- `test_normalize_tdp_values`: Handle string/int conversion, "65W" → 65
- `test_normalize_price_formats`: "$499.99" → 499.99
- `test_derive_performance_tier`: Based on TDP/cores/price thresholds

**Implementation:**
1. Create `DataNormalizer` class with methods:
   - `normalize_socket(value: str) -> str`
   - `normalize_memory_type(value: str) -> str`
   - `normalize_tdp(value: Any) -> int`
   - `normalize_price(value: Any) -> float`
   - `derive_performance_tier(component: dict) -> str`

2. Socket normalization mapping:
   ```
   LGA 1700, LGA1700, Intel 1700 → LGA1700
   AM5, Socket AM5, AMD AM5 → AM5
   LGA 1851, LGA1851 → LGA1851
   ```

3. Performance tier derivation:
   - `budget`: price < $200 OR tdp < 65W
   - `mid-range`: price $200-$400 OR tdp 65-125W
   - `high-end`: price $400-$700 OR tdp 125-200W
   - `enthusiast`: price > $700 OR tdp > 200W

---

#### Task 1.5: Data Transformation - Compatibility Tagger
**Priority:** Critical | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_generate_cpu_compatibility_tags`: AM5 CPU gets ["am5", "ddr5", "pcie5"]
- `test_generate_gpu_compatibility_tags`: High TDP GPU gets ["high-tdp", "pcie4"]
- `test_generate_motherboard_compatibility_tags`: Form factor + socket tags
- `test_generate_case_compatibility_tags`: Form factor + clearance tags

**Implementation:**
1. Create `CompatibilityTagger` class with method:
   - `generate_tags(component: dict) -> list[str]`

2. Tag generation rules by component type:
   - **CPU**: socket, memory_type support, pcie_version, tdp_category
   - **GPU**: pcie_version, tdp_category, vram_tier, power_connector_type
   - **Motherboard**: socket, memory_type, form_factor, chipset_generation
   - **Case**: form_factor_support, max_gpu_length_tier, max_cooler_height_tier
   - **PSU**: wattage_tier, efficiency_rating, form_factor
   - **RAM**: memory_type, speed_tier, latency_tier
   - **Cooler**: socket_support, height_tier, cooling_type

---

#### Task 1.6: Data Loading - Algolia Indexer
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases (Write First - TDD):**
- `test_algolia_loader_creates_index`: Verify index creation with settings
- `test_algolia_loader_uploads_batch`: Verify batch upload (1000 records)
- `test_algolia_loader_handles_errors`: Graceful error handling and retry
- `test_algolia_loader_configures_facets`: Verify facet configuration
- `test_algolia_loader_sets_ranking`: Verify custom ranking rules

**Implementation:**
1. Create `AlgoliaLoader` class with methods:
   - `create_index(index_name: str, settings: dict) -> None`
   - `upload_records(index_name: str, records: list[dict]) -> dict`
   - `configure_facets(index_name: str, facets: list[str]) -> None`
   - `configure_ranking(index_name: str, ranking: list[str]) -> None`

2. Index settings configuration:
   - Searchable attributes: model, brand, component_type
   - Facets: socket, form_factor, memory_type, component_type, price_usd
   - Custom ranking: performance_tier_score desc, price_usd asc

3. Batch upload strategy:
   - Batch size: 1000 records per request
   - Retry on failure: 3 attempts with exponential backoff

---

#### Task 1.7: Query Rules Configuration
**Priority:** High | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_create_intel_cpu_detection_rule`: Pattern matching for Intel CPUs
- `test_create_amd_cpu_detection_rule`: Pattern matching for AMD CPUs
- `test_create_high_tdp_warning_rule`: GPU power warning rules
- `test_query_rule_applies_filters`: Verify filter application

**Implementation:**
1. Create `QueryRulesConfigurator` class with methods:
   - `create_cpu_detection_rules(index_name: str) -> None`
   - `create_gpu_warning_rules(index_name: str) -> None`
   - `create_form_factor_rules(index_name: str) -> None`

2. Query rules to create:
   - **Intel 14th Gen Detection**: Pattern "i9-14|i7-14|i5-14" → filter socket:LGA1700
   - **Intel Core Ultra Detection**: Pattern "Core Ultra" → filter socket:LGA1851
   - **AMD Ryzen 9000 Detection**: Pattern "Ryzen.*9[0-9]{3}" → filter socket:AM5
   - **High-TDP GPU Warning**: Pattern "RTX 4090|4080|7900 XTX" → userData with PSU warning

---

#### Task 1.8: ETL Pipeline Orchestration
**Priority:** High | **Estimated Effort:** 2 hours

**Test Cases (Write First - TDD):**
- `test_pipeline_runs_end_to_end`: Full pipeline with test fixtures
- `test_pipeline_handles_partial_failure`: Continue on non-critical errors
- `test_pipeline_generates_report`: Output statistics and validation report

**Implementation:**
1. Create `ETLPipeline` class orchestrating:
   - Extract → Transform → Load sequence
   - Progress logging at each stage
   - Validation checkpoints between stages
   - Final statistics report

2. Pipeline execution steps:
   - Step 1: Extract from all sources
   - Step 2: Normalize and clean data
   - Step 3: Generate compatibility tags
   - Step 4: Validate schema compliance
   - Step 5: Upload to Algolia
   - Step 6: Configure query rules
   - Step 7: Generate completion report

---

### BACKEND INTEGRATION TESTS

#### Task 1.9: Backend Integration Test Suite
**Priority:** High | **Estimated Effort:** 3 hours

**Integration Tests:**
1. `test_full_etl_pipeline_with_sample_data`:
   - Use fixture data (10 CPUs, 10 GPUs, 5 motherboards)
   - Verify end-to-end pipeline execution
   - Validate output schema matches Algolia requirements

2. `test_algolia_index_searchability`:
   - Upload test data to Algolia sandbox index
   - Perform search queries
   - Verify facet filtering works correctly

3. `test_query_rules_application`:
   - Search for "Ryzen 9 9900X"
   - Verify socket:AM5 filter is auto-applied
   - Verify userData contains compatibility info

**Test Data Fixtures:**
- Create `backend/data/fixtures/test_components.json` with:
  - 5 AMD CPUs (AM5 socket)
  - 5 Intel CPUs (LGA1700/LGA1851)
  - 10 GPUs (various TDP levels)
  - 5 Motherboards (matching sockets)
  - 5 Cases (various clearances)
  - 5 PSUs (various wattages)
  - 10 RAM kits (DDR4/DDR5)

---

## Phase 2: Backend API & Algolia Integration (Days 4-6)

### FRONTEND TASKS (Agent 1) - API Routes

#### Task 2.1: Frontend Project Setup
**Priority:** Critical | **Estimated Effort:** 3 hours

**Setup Steps:**
1. Initialize Next.js 14 project with App Router
2. Install dependencies:
   - `react-instantsearch` (Algolia)
   - `algoliasearch` (client)
   - `zustand` (state management)
   - `tailwindcss` (styling)
   - `lucide-react` (icons)
3. Install shadcn/ui CLI and initialize
4. Configure Tailwind with custom theme colors
5. Set up Vitest for testing
6. Set up Playwright for E2E tests

**shadcn/ui Components to Install:**
- `card` - Component display cards
- `badge` - Compatibility status indicators
- `button` - Actions and CTAs
- `sidebar` - Build summary panel
- `progress` - Power meter visualization
- `sheet` - Component detail slides
- `tooltip` - Technical term explanations
- `select` - Filter dropdowns
- `slider` - Price range filter
- `command` - Quick search palette
- `sonner` - Toast notifications
- `skeleton` - Loading states
- `tabs` - Category navigation
- `dialog` - Confirmation modals
- `scroll-area` - Scrollable lists
- `separator` - Visual dividers

**Deliverables:**
- Configured Next.js project
- Tailwind theme with brand colors
- shadcn/ui components installed
- Test configuration files

---

#### Task 2.2: Build Validation API Route
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases (Write First - TDD):**
- `test_validate_compatible_build`: All components compatible → valid: true
- `test_validate_socket_mismatch`: AM5 CPU + LGA1700 board → error with message
- `test_validate_memory_mismatch`: DDR4 RAM + DDR5-only board → error
- `test_validate_gpu_clearance`: GPU too long for case → warning with dimensions
- `test_validate_cooler_clearance`: Cooler too tall for case → warning
- `test_validate_insufficient_psu`: Low wattage PSU → warning with recommendation
- `test_validate_partial_build`: Incomplete build → valid with missing components list
- `test_validate_empty_build`: No components → error

**API Route: `/api/build/validate`**

**Request Schema:**
```
POST /api/build/validate
Body: {
  components: {
    cpu?: ComponentRecord,
    motherboard?: ComponentRecord,
    gpu?: ComponentRecord,
    ram?: ComponentRecord,
    psu?: ComponentRecord,
    case?: ComponentRecord,
    cooler?: ComponentRecord
  }
}
```

**Response Schema:**
```
{
  valid: boolean,
  complete: boolean,
  issues: [
    {
      type: "error" | "warning",
      code: string,
      message: string,
      affectedComponents: string[],
      suggestion?: string
    }
  ],
  powerAnalysis: {
    totalTdp: number,
    recommendedPsu: number,
    currentPsu: number | null,
    headroom: number | null
  },
  missingComponents: string[]
}
```

**Implementation Logic:**
1. Parse and validate request body
2. Run hard compatibility checks (errors):
   - CPU socket ↔ Motherboard socket
   - RAM type ↔ Motherboard memory support
3. Run soft compatibility checks (warnings):
   - GPU length vs Case clearance
   - Cooler height vs Case clearance
   - PSU wattage vs calculated requirement
4. Calculate power analysis
5. Identify missing components
6. Return structured response

---

#### Task 2.3: PSU Calculator API Route
**Priority:** High | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_calculate_psu_basic_build`: 65W CPU + 200W GPU → 550W recommended
- `test_calculate_psu_high_end_build`: 170W CPU + 450W GPU → 1000W recommended
- `test_calculate_psu_with_transient_spikes`: RTX 4090 → adds 150W buffer
- `test_calculate_psu_efficiency_sweet_spot`: Returns efficiency percentage
- `test_calculate_psu_cpu_only`: No GPU → appropriate recommendation
- `test_calculate_psu_with_overclocking`: Add 20% buffer for OC flag

**API Route: `/api/psu/calculate`**

**Request Schema:**
```
POST /api/psu/calculate
Body: {
  cpu: { tdp_watts: number, max_tdp_watts?: number },
  gpu?: { tdp_watts: number },
  overclocking?: boolean
}
```

**Response Schema:**
```
{
  breakdown: {
    cpuPower: number,
    gpuPower: number,
    basePower: number,
    transientBuffer: number,
    overclockBuffer: number,
    totalDraw: number
  },
  recommendedWattage: number,
  recommendedTier: "550W" | "650W" | "750W" | "850W" | "1000W" | "1200W",
  efficiencyAtLoad: string,
  notes: string[]
}
```

**Calculation Formula:**
```
basePower = 100W (motherboard, storage, fans)
cpuPower = max_tdp_watts || tdp_watts
gpuPower = gpu?.tdp_watts || 0
transientBuffer = gpuPower >= 300 ? 150 : 0
overclockBuffer = overclocking ? (cpuPower + gpuPower) * 0.2 : 0
totalDraw = basePower + cpuPower + gpuPower + transientBuffer + overclockBuffer
recommendedWattage = ceil(totalDraw * 1.5 / 50) * 50  // Round to nearest 50W
```

---

#### Task 2.4: Build Export API Route
**Priority:** Medium | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_export_pcpartpicker_format`: Generates valid PCPartPicker list
- `test_export_reddit_markdown`: Generates Reddit-formatted table
- `test_export_json_format`: Generates JSON with all details
- `test_export_shareable_link`: Generates URL-safe encoded link
- `test_export_empty_build`: Returns error for empty build
- `test_export_partial_build`: Includes only selected components

**API Route: `/api/build/export`**

**Request Schema:**
```
POST /api/build/export
Body: {
  build: {
    cpu?: ComponentRecord,
    motherboard?: ComponentRecord,
    gpu?: ComponentRecord,
    ram?: ComponentRecord,
    psu?: ComponentRecord,
    case?: ComponentRecord,
    cooler?: ComponentRecord
  },
  format: "pcpartpicker" | "reddit" | "json" | "link"
}
```

**Response Schema:**
```
{
  formatted: string,
  totalPrice: number,
  componentCount: number,
  shareUrl?: string
}
```

**Export Formats:**

1. **PCPartPicker Format:**
   ```
   [PCPartPicker Build List]
   
   Type|Item|Price
   :----|:----|:----
   CPU|AMD Ryzen 7 9700X|$359.00
   Motherboard|ASUS ROG Strix X670E|$499.00
   ...
   Total||$1,857.00
   ```

2. **Reddit Markdown:**
   ```
   | Component | Selection | Price |
   |:----------|:----------|------:|
   | CPU | AMD Ryzen 7 9700X | $359 |
   | Motherboard | ASUS ROG Strix X670E | $499 |
   ...
   | **Total** | | **$1,857** |
   ```

3. **JSON Format:** Full component objects with all metadata

4. **Shareable Link:** Base64-encoded build state as URL parameter

---

## Phase 3: Frontend UI Development (Days 4-6)

### FRONTEND TASKS (Agent 1) - UI Components

#### Task 3.1: Algolia Client Configuration
**Priority:** Critical | **Estimated Effort:** 2 hours

**Test Cases (Write First - TDD):**
- `test_algolia_client_initialization`: Client connects with correct credentials
- `test_algolia_search_index`: Can search the components index
- `test_algolia_facet_filtering`: Facet filters work correctly

**Implementation:**
1. Create Algolia client singleton with environment variables
2. Configure InstantSearch provider with:
   - Application ID from env
   - Search-only API key from env
   - Index name: `prod_components`
3. Set up search client for API routes
4. Export typed search helpers

---

#### Task 3.2: Build State Store (Zustand)
**Priority:** Critical | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_store_adds_component`: Adding CPU updates state correctly
- `test_store_removes_component`: Removing component clears slot
- `test_store_replaces_component`: Replacing GPU updates and recalculates
- `test_store_calculates_total_price`: Sum of all component prices
- `test_store_calculates_total_tdp`: Sum of CPU + GPU TDP
- `test_store_derives_active_filters`: Based on selected components
- `test_store_clears_build`: Reset to empty state
- `test_store_persists_to_storage`: LocalStorage persistence
- `test_store_loads_from_storage`: Restore on page load

**Store Interface:**
```
interface BuildStore {
  // State
  components: {
    cpu: Component | null,
    motherboard: Component | null,
    gpu: Component | null,
    ram: Component | null,
    psu: Component | null,
    case: Component | null,
    cooler: Component | null
  },
  
  // Derived State
  totalPrice: number,
  totalTdp: number,
  activeFilters: {
    socket: string | null,
    memory_type: string | null,
    form_factor: string | null
  },
  compatibilityStatus: "valid" | "warning" | "error",
  
  // Actions
  addComponent: (type: ComponentType, component: Component) => void,
  removeComponent: (type: ComponentType) => void,
  clearBuild: () => void,
  validateBuild: () => Promise<ValidationResult>
}
```

**Derived Filter Logic:**
- When CPU selected → lock `socket` filter to CPU's socket
- When Motherboard selected → lock `memory_type` to board's support
- When Case selected → derive `form_factor` support for motherboard/PSU

---

#### Task 3.3: Component Card
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases (Write First - TDD):**
- `test_card_renders_component_info`: Displays brand, model, price
- `test_card_shows_compatibility_badge`: Green/yellow/red based on status
- `test_card_shows_key_specs`: Socket, TDP, etc. based on component type
- `test_card_add_button_works`: Clicking add triggers callback
- `test_card_shows_selected_state`: Visual indicator when in build
- `test_card_tooltip_shows_details`: Hovering shows full specs
- `test_card_handles_missing_image`: Fallback placeholder

**Component Props:**
```
interface ComponentCardProps {
  component: Component,
  compatibilityStatus: "compatible" | "warning" | "incompatible" | "unknown",
  warningMessage?: string,
  isSelected: boolean,
  onAdd: (component: Component) => void,
  onViewDetails: (component: Component) => void
}
```

**Visual States:**
1. **Default**: White background, subtle border
2. **Compatible**: Green badge with checkmark
3. **Warning**: Yellow badge with alert icon, tooltip with message
4. **Incompatible**: Red badge with X, grayed out, disabled add button
5. **Selected**: Blue border, "In Build" badge, "Remove" button instead of "Add"

**Key Specs Display by Type:**
- **CPU**: Socket, Cores/Threads, TDP, Base/Boost Clock
- **GPU**: VRAM, TDP, Length (mm), Memory Type
- **Motherboard**: Socket, Form Factor, Memory Type, RAM Slots
- **RAM**: Type, Speed, Capacity, CAS Latency
- **PSU**: Wattage, Efficiency Rating, Modularity
- **Case**: Form Factor Support, Max GPU Length, Max Cooler Height
- **Cooler**: Socket Support, Height, Type (Air/AIO)

---

#### Task 3.4: Build Summary Sidebar
**Priority:** Critical | **Estimated Effort:** 5 hours

**Test Cases (Write First - TDD):**
- `test_sidebar_shows_selected_components`: Lists all added components
- `test_sidebar_shows_empty_slots`: Shows "Select CPU" for empty slots
- `test_sidebar_calculates_total`: Shows total price
- `test_sidebar_shows_power_meter`: Visual PSU headroom indicator
- `test_sidebar_shows_compatibility_checklist`: All checks listed
- `test_sidebar_remove_component`: Click X removes from build
- `test_sidebar_export_button`: Opens export dialog
- `test_sidebar_clear_button`: Clears entire build with confirmation
- `test_sidebar_collapses_on_mobile`: Responsive behavior

**Sidebar Sections:**

1. **Header Section:**
   - "Your Build" title
   - Progress badge: "4/7 Components"
   - Clear build button (with confirmation dialog)

2. **Components List:**
   - Ordered slots: CPU, Motherboard, GPU, RAM, PSU, Case, Cooler
   - Each slot shows:
     - Component type icon
     - Brand + Model (or "Select [Type]" if empty)
     - Price
     - Remove button (X)
   - Click on empty slot → filters search to that component type

3. **Power Analysis Section:**
   - Circular progress indicator showing PSU load percentage
   - "Estimated Draw: 450W"
   - "Recommended PSU: 750W"
   - "Your PSU: 850W" (if selected)
   - Headroom indicator: "100W headroom (11%)"
   - Warning if PSU insufficient

4. **Compatibility Checklist:**
   - Row for each check with status icon:
     - ✅ CPU ↔ Motherboard Socket
     - ✅ RAM ↔ Motherboard Memory Type
     - ✅ GPU ↔ Case Clearance
     - ⚠️ Cooler ↔ Case Clearance (3mm margin)
     - ✅ PSU Wattage

5. **Footer Section:**
   - Total price (large, bold)
   - "Export Build" button
   - "Share Build" button

---

#### Task 3.5: Power Meter Component
**Priority:** High | **Estimated Effort:** 2 hours

**Test Cases (Write First - TDD):**
- `test_power_meter_shows_percentage`: Correct fill level
- `test_power_meter_color_coding`: Green (<60%), Yellow (60-80%), Red (>80%)
- `test_power_meter_shows_values`: Displays draw and PSU wattage
- `test_power_meter_handles_no_psu`: Shows recommended wattage
- `test_power_meter_animates_changes`: Smooth transitions

**Component Props:**
```
interface PowerMeterProps {
  estimatedDraw: number,
  psuWattage: number | null,
  recommendedWattage: number
}
```

**Visual Design:**
- Circular progress ring (using shadcn `progress` or custom SVG)
- Center shows percentage
- Below shows "450W / 850W"
- Color transitions smoothly based on load

---

#### Task 3.6: Compatibility Badge Component
**Priority:** High | **Estimated Effort:** 1.5 hours

**Test Cases (Write First - TDD):**
- `test_badge_compatible_variant`: Green with check icon
- `test_badge_warning_variant`: Yellow with alert icon
- `test_badge_incompatible_variant`: Red with X icon
- `test_badge_unknown_variant`: Gray with question mark
- `test_badge_shows_tooltip`: Hover reveals message

**Badge Variants:**
```
variant: "compatible" | "warning" | "incompatible" | "unknown"
```

**Visual Specifications:**
- Compatible: `bg-green-100 text-green-800 border-green-200`
- Warning: `bg-yellow-100 text-yellow-800 border-yellow-200`
- Incompatible: `bg-red-100 text-red-800 border-red-200`
- Unknown: `bg-gray-100 text-gray-600 border-gray-200`

---

#### Task 3.7: Search Interface Components
**Priority:** Critical | **Estimated Effort:** 5 hours

**Test Cases (Write First - TDD):**
- `test_search_box_updates_query`: Typing updates Algolia query
- `test_search_box_clears`: Clear button resets search
- `test_category_tabs_filter`: Clicking "GPU" filters to GPUs
- `test_price_slider_filters`: Adjusting range filters results
- `test_refinement_list_filters`: Clicking facet value toggles filter
- `test_hits_display_results`: Results render as ComponentCards
- `test_pagination_works`: Navigate between pages
- `test_no_results_message`: Shows helpful message when empty
- `test_loading_skeleton`: Shows skeletons while loading

**Sub-Components:**

1. **SearchBox:**
   - Full-width search input with icon
   - Clear button on right
   - Placeholder: "Search components..."
   - Debounced query updates (300ms)

2. **CategoryTabs:**
   - Horizontal tabs: All | CPU | GPU | Motherboard | RAM | PSU | Case | Cooler
   - Active tab highlighted
   - Count badges on each tab

3. **FilterPanel:**
   - Price range slider (min/max)
   - Socket refinement list (when applicable)
   - Memory type refinement list
   - Form factor refinement list
   - Performance tier refinement list
   - Brand refinement list

4. **ResultsGrid:**
   - Responsive grid: 1 col (mobile), 2 col (tablet), 3-4 col (desktop)
   - Uses ComponentCard for each hit
   - Passes compatibility status from build state

5. **Pagination:**
   - Page numbers with prev/next
   - Shows "Showing 1-20 of 156 results"

6. **NoResults:**
   - Friendly message
   - Suggestions to broaden search
   - Clear filters button

---

#### Task 3.8: Component Detail Sheet
**Priority:** Medium | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_sheet_opens_on_view_details`: Click triggers sheet open
- `test_sheet_shows_full_specs`: All component attributes displayed
- `test_sheet_shows_compatibility_analysis`: Detailed compatibility info
- `test_sheet_add_button`: Can add component from sheet
- `test_sheet_closes_on_escape`: Keyboard accessibility

**Sheet Sections:**

1. **Header:**
   - Large product image
   - Brand + Model
   - Price (large)
   - Compatibility badge

2. **Specifications Table:**
   - All technical specs in organized sections
   - Tooltips for technical terms

3. **Compatibility Analysis:**
   - "This component is compatible because..."
   - OR "This component is incompatible because..."
   - Specific details about what matches/mismatches

4. **Actions:**
   - "Add to Build" / "Remove from Build" button
   - "Compare" button (future feature placeholder)

---

#### Task 3.9: Chat Widget Integration
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases (Write First - TDD):**
- `test_chat_widget_renders`: Widget appears in bottom right
- `test_chat_widget_connects_agent`: Uses correct agent ID
- `test_chat_widget_sends_context`: Build state included in context
- `test_chat_widget_displays_responses`: AI responses render correctly
- `test_chat_widget_minimizes`: Can collapse widget
- `test_chat_widget_shows_suggestions`: Quick action buttons

**Implementation:**
1. Import Chat widget from `react-instantsearch`
2. Configure with Agent Studio agent ID
3. Pass current build state as context/userData
4. Style to match application theme
5. Position fixed bottom-right with proper z-index

**Context Passing:**
- Current build components
- Active filters
- Last search query
- Any compatibility issues

**Suggested Prompts:**
- "What CPU should I get for gaming under $300?"
- "Is my build compatible?"
- "Recommend a PSU for my build"
- "Explain DDR5 vs DDR4"

---

#### Task 3.10: Main Layout & Navigation
**Priority:** High | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_layout_renders_sidebar`: Sidebar visible on desktop
- `test_layout_responsive`: Sidebar collapses on mobile
- `test_navigation_header`: Logo, nav links render
- `test_dark_mode_toggle`: Theme switching works
- `test_mobile_menu`: Hamburger menu on mobile

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Navigation | Theme Toggle | Help            │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│   Sidebar   │              Main Content                     │
│   (Build    │   ┌────────────────────────────────────────┐  │
│   Summary)  │   │  Search Box + Category Tabs            │  │
│             │   ├────────────────────────────────────────┤  │
│             │   │  Filters  │  Results Grid              │  │
│             │   │           │                            │  │
│             │   │           │                            │  │
│             │   └────────────────────────────────────────┘  │
│             │                                               │
├─────────────┴───────────────────────────────────────────────┤
│                    Chat Widget (floating)                    │
└─────────────────────────────────────────────────────────────┘
```

---

#### Task 3.11: Home/Discovery Page
**Priority:** High | **Estimated Effort:** 4 hours

**Test Cases (Write First - TDD):**
- `test_home_page_renders`: All sections visible
- `test_hero_cta_navigates`: "Start Building" goes to /build
- `test_featured_builds_display`: Presets shown
- `test_quick_start_cards`: Category cards link correctly

**Page Sections:**

1. **Hero Section:**
   - Headline: "Build Your Perfect PC"
   - Subheadline: "AI-powered compatibility checking for stress-free builds"
   - CTA: "Start Building" button
   - Background: Subtle gradient or PC component imagery

2. **How It Works:**
   - 3 step cards: Select → Validate → Export
   - Icons and brief descriptions

3. **Featured Builds:**
   - 3-4 preset builds: Budget Gaming, Mid-Range, Workstation, Enthusiast
   - Click to load preset into builder

4. **Quick Start:**
   - Category cards: "Start with a CPU", "Start with a GPU", etc.
   - Click to navigate to /build with category pre-selected

---

#### Task 3.12: Export/Share Page
**Priority:** Medium | **Estimated Effort:** 3 hours

**Test Cases (Write First - TDD):**
- `test_export_page_loads_build`: Current build displayed
- `test_export_format_selection`: Can switch formats
- `test_export_copy_to_clipboard`: Copy button works
- `test_export_download`: Download as file works
- `test_share_link_generation`: Creates shareable URL

**Page Features:**
1. Build summary display
2. Export format tabs (PCPartPicker, Reddit, JSON)
3. Formatted output preview (code block)
4. Copy to clipboard button
5. Download button
6. Share link with copy button
7. QR code for mobile sharing (stretch goal)

---

### FRONTEND INTEGRATION TESTS

#### Task 3.13: Frontend Integration Test Suite
**Priority:** High | **Estimated Effort:** 4 hours

**Integration Tests:**

1. `test_search_returns_results`:
   - Mock Algolia response
   - Verify results render correctly
   - Verify facets populate

2. `test_add_component_updates_store`:
   - Click "Add to Build"
   - Verify store state updates
   - Verify sidebar reflects change

3. `test_compatibility_filtering`:
   - Add CPU to build
   - Verify motherboard results filtered to matching socket
   - Verify incompatible items show warning badge

4. `test_psu_calculation_updates`:
   - Add CPU (65W)
   - Add GPU (285W)
   - Verify power meter shows correct values
   - Call /api/psu/calculate, verify response

5. `test_build_validation_api`:
   - Create build with mismatch
   - Call /api/build/validate
   - Verify error response

6. `test_export_api`:
   - Create complete build
   - Call /api/build/export with each format
   - Verify formatted output

---

## Phase 4: Frontend-Backend Integration (Days 7-8)

### INTEGRATION TASKS

#### Task 4.1: Connect Frontend to Live Algolia Index
**Priority:** Critical | **Estimated Effort:** 3 hours

**Test Cases:**
- `test_live_search_returns_data`: Real Algolia index responds
- `test_facet_values_match_data`: Facets reflect actual component data
- `test_query_rules_apply`: CPU search applies socket filter

**Steps:**
1. Update environment variables with production Algolia credentials
2. Verify index has data from ETL pipeline
3. Test all search scenarios against live index
4. Verify query rules fire correctly

---

#### Task 4.2: Connect Chat Widget to Agent Studio
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases:**
- `test_agent_responds_to_query`: AI provides relevant response
- `test_agent_uses_search_tool`: Results from Algolia included
- `test_agent_respects_context`: Build state influences recommendations
- `test_agent_enforces_compatibility`: Warns about incompatible suggestions

**Steps:**
1. Configure Agent Studio agent with system prompt from PRD
2. Connect Algolia Search tool to agent
3. Pass build context to agent via userData
4. Test various user queries:
   - "What CPU should I get for gaming?"
   - "Is this RAM compatible with my motherboard?"
   - "Calculate my power requirements"

---

#### Task 4.3: Compatibility Engine Integration
**Priority:** Critical | **Estimated Effort:** 4 hours

**Test Cases:**
- `test_real_time_compatibility_check`: Adding component triggers validation
- `test_filter_application`: Search results filter based on build
- `test_warning_display`: Warnings appear on relevant components
- `test_error_prevention`: Cannot add incompatible component

**Steps:**
1. Wire up store actions to call validation API
2. Implement real-time filter updates on component selection
3. Connect validation results to ComponentCard badges
4. Add toast notifications for compatibility warnings

---

#### Task 4.4: Export Flow Integration
**Priority:** Medium | **Estimated Effort:** 2 hours

**Test Cases:**
- `test_export_flow_end_to_end`: Complete flow from build to exported text
- `test_share_link_works`: Generated link loads build correctly
- `test_clipboard_copy`: Text copies correctly

**Steps:**
1. Connect Export page to /api/build/export
2. Implement clipboard functionality
3. Implement file download
4. Test share link round-trip

---

#### Task 4.5: Error Handling & Loading States
**Priority:** High | **Estimated Effort:** 3 hours

**Test Cases:**
- `test_api_error_handling`: Graceful degradation on API failure
- `test_loading_states`: Skeletons show while loading
- `test_retry_logic`: Failed requests retry appropriately
- `test_offline_handling`: Appropriate message when offline

**Implementation:**
1. Add error boundaries around critical sections
2. Implement loading skeletons for search results
3. Add retry logic with exponential backoff
4. Add toast notifications for errors
5. Handle network failures gracefully

---

## Phase 5: Agent Studio & Chat Integration (Days 9-10)

### INTEGRATION TASKS

#### Task 5.1: Agent Studio System Prompt Refinement
**Priority:** High | **Estimated Effort:** 3 hours

**Activities:**
1. Test system prompt with various user queries
2. Refine compatibility rules based on testing
3. Add edge case handling
4. Optimize for response quality and speed

**Test Scenarios:**
- "Build me a gaming PC for $1500"
- "I have an AMD Ryzen 9 9900X, what motherboard should I get?"
- "Is DDR4 RAM compatible with my AM5 motherboard?"
- "My case is the NZXT H7 Flow, will an RTX 4090 fit?"
- "Calculate the PSU I need for my build"

---

#### Task 5.2: Context Synchronization
**Priority:** High | **Estimated Effort:** 3 hours

**Test Cases:**
- `test_context_updates_on_component_add`: Agent aware of new component
- `test_context_includes_filters`: Active filters passed to agent
- `test_context_includes_compatibility_status`: Agent knows about issues

**Implementation:**
1. Create context builder function that serializes build state
2. Update context on every store change
3. Pass context to Chat widget
4. Verify agent responses reflect context

---

#### Task 5.3: Agent Response UI Enhancement
**Priority:** Medium | **Estimated Effort:** 3 hours

**Activities:**
1. Style agent responses to match app theme
2. Add "Add to Build" buttons in product recommendations
3. Make product mentions clickable (opens detail sheet)
4. Add "Show me more like this" quick actions

---

#### Task 5.4: Query Rules Testing & Refinement
**Priority:** High | **Estimated Effort:** 2 hours

**Test Cases:**
- `test_intel_cpu_rule_fires`: Search "i9-14900K" → socket:LGA1700 filter
- `test_amd_cpu_rule_fires`: Search "Ryzen 9 9900X" → socket:AM5 filter
- `test_high_tdp_warning_rule`: Search "RTX 4090" → PSU warning in userData
- `test_rules_dont_conflict`: Multiple rules work together

---

## Phase 6: Polish, E2E Testing & Deployment (Days 11-12)

### E2E TEST SUITE

#### Task 6.1: Critical User Journey Tests (Playwright)
**Priority:** Critical | **Estimated Effort:** 6 hours

**E2E Test Cases:**

1. **Complete Build Journey:**
   ```
   test_complete_build_journey:
     - Navigate to home page
     - Click "Start Building"
     - Search for "Ryzen 7 9700X"
     - Click "Add to Build" on CPU
     - Verify sidebar shows CPU
     - Verify motherboard results filtered to AM5
     - Add compatible motherboard
     - Add compatible RAM (DDR5)
     - Add GPU
     - Add PSU
     - Add Case
     - Add Cooler
     - Verify "7/7 Components" badge
     - Verify all compatibility checks pass
     - Click "Export Build"
     - Verify export page shows all components
     - Copy to clipboard
     - Verify clipboard contains formatted text
   ```

2. **Compatibility Error Prevention:**
   ```
   test_compatibility_error_prevention:
     - Add AM5 CPU to build
     - Search for motherboards
     - Verify LGA1700 motherboards show "Incompatible" badge
     - Attempt to add incompatible motherboard
     - Verify error toast appears
     - Verify component NOT added to build
   ```

3. **Compatibility Warning Flow:**
   ```
   test_compatibility_warning_flow:
     - Add large GPU (350mm) to build
     - Add case with 340mm clearance
     - Verify warning badge appears
     - Verify warning message explains the issue
     - Verify component CAN be added (with warning)
   ```

4. **Chat Assistant Journey:**
   ```
   test_chat_assistant_journey:
     - Open chat widget
     - Type "I want to build a gaming PC for $1500"
     - Verify AI responds with suggestions
     - Click on recommended CPU
     - Verify component detail sheet opens
     - Add component from sheet
     - Ask "Is this compatible with my current build?"
     - Verify AI acknowledges current build state
   ```

5. **PSU Calculator Journey:**
   ```
   test_psu_calculator_journey:
     - Add high-TDP CPU (170W)
     - Verify power meter updates
     - Add high-TDP GPU (450W)
     - Verify recommended PSU shows 1000W+
     - Add 850W PSU
     - Verify warning about insufficient wattage
   ```

6. **Mobile Responsive Journey:**
   ```
   test_mobile_responsive:
     - Set viewport to mobile (375px)
     - Verify sidebar collapsed
     - Open mobile menu
     - Navigate to build page
     - Verify components stack vertically
     - Open sidebar as drawer
     - Verify build summary accessible
   ```

7. **Share Link Journey:**
   ```
   test_share_link_journey:
     - Create build with 3 components
     - Click "Share Build"
     - Copy share link
     - Open new browser context
     - Navigate to share link
     - Verify build state restored
     - Verify all 3 components present
   ```

---

#### Task 6.2: API Integration E2E Tests
**Priority:** High | **Estimated Effort:** 3 hours

**E2E API Tests:**

1. `test_validate_api_end_to_end`:
   - Create build via UI
   - Intercept /api/build/validate call
   - Verify request payload correct
   - Verify response processed correctly

2. `test_psu_calculate_api_end_to_end`:
   - Add components via UI
   - Verify /api/psu/calculate called
   - Verify UI reflects calculation results

3. `test_export_api_end_to_end`:
   - Complete build via UI
   - Export in each format
   - Verify API calls succeed
   - Verify output correct for each format

---

#### Task 6.3: Cross-Browser Testing
**Priority:** Medium | **Estimated Effort:** 2 hours

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Tests:**
- Run critical journey tests on each browser
- Verify visual consistency
- Check for browser-specific issues

---

### POLISH & OPTIMIZATION

#### Task 6.4: Performance Optimization
**Priority:** High | **Estimated Effort:** 3 hours

**Activities:**
1. Implement search result caching
2. Optimize component re-renders with React.memo
3. Lazy load component detail sheets
4. Optimize image loading (next/image)
5. Implement route prefetching
6. Add service worker for offline support

**Performance Targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Largest Contentful Paint: < 2.5s
- Search latency: < 200ms

---

#### Task 6.5: Accessibility Audit
**Priority:** High | **Estimated Effort:** 2 hours

**Checklist:**
- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA labels on components
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Screen reader tested
- [ ] Skip navigation link
- [ ] Form labels associated correctly

---

#### Task 6.6: Mobile Responsiveness Polish
**Priority:** High | **Estimated Effort:** 3 hours

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-Specific Adjustments:**
- Sidebar becomes bottom drawer
- Component cards stack single column
- Chat widget full-screen on open
- Filters in collapsible accordion
- Touch-friendly tap targets (min 44px)

---

#### Task 6.7: Error States & Empty States
**Priority:** Medium | **Estimated Effort:** 2 hours

**States to Handle:**
1. No search results → Helpful suggestions
2. Build empty → Guided first step
3. API error → Retry option
4. Network offline → Cached content + message
5. Agent unavailable → Fallback to FAQ

---

### DEPLOYMENT

#### Task 6.8: Vercel Deployment
**Priority:** Critical | **Estimated Effort:** 2 hours

**Steps:**
1. Create Vercel project linked to GitHub repo
2. Configure environment variables in Vercel dashboard
3. Set up automatic deployments from main branch
4. Configure preview deployments for PRs
5. Set up custom domain (if applicable)
6. Enable Vercel Analytics

**Environment Variables to Set:**
- `NEXT_PUBLIC_ALGOLIA_APP_ID`
- `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`
- `NEXT_PUBLIC_AGENT_ID`
- `ALGOLIA_ADMIN_KEY`

---

#### Task 6.9: Production Testing
**Priority:** Critical | **Estimated Effort:** 2 hours

**Checklist:**
- [ ] All E2E tests pass against production
- [ ] Search returns results
- [ ] Agent responds correctly
- [ ] Export features work
- [ ] Share links work
- [ ] Mobile experience smooth
- [ ] No console errors
- [ ] Analytics tracking

---

### SUBMISSION PREPARATION

#### Task 6.10: Demo Video Recording
**Priority:** Critical | **Estimated Effort:** 3 hours

**Demo Script (3 minutes):**

**0:00-0:30 - Introduction:**
- Show problem: PC building compatibility confusion
- Introduce Spec-Logic solution

**0:30-1:30 - Core Demo:**
- Show clean UI homepage
- Search for "Ryzen 7 9700X"
- Add CPU to build
- Show automatic filter application (AM5 socket)
- Try to select DDR4 RAM → Show incompatibility warning
- Complete build with compatible components
- Show power calculation updating in real-time

**1:30-2:15 - AI Assistant:**
- Open chat widget
- Ask "What GPU should I get for 1080p gaming under $400?"
- Show AI recommendation
- Click to add recommended component

**2:15-2:45 - Export & Share:**
- Show completed build summary
- Export to PCPartPicker format
- Generate shareable link

**2:45-3:00 - Closing:**
- Recap Algolia features used
- Show Agent Studio integration
- Call to action

---

#### Task 6.11: DEV.to Submission Post
**Priority:** Critical | **Estimated Effort:** 2 hours

**Post Structure:**
1. Title: "Spec-Logic: AI-Powered PC Building with Algolia Agent Studio"
2. Introduction & Problem Statement
3. Solution Overview
4. Technical Architecture
5. Algolia Features Used:
   - Agent Studio (system prompts, tools)
   - Query Rules (auto-filtering)
   - InstantSearch Chat Widget
   - Faceted Filtering
6. Demo & Screenshots
7. Challenges & Learnings
8. Future Enhancements
9. Links: GitHub, Live Demo, Video

---

#### Task 6.12: Final Submission Checklist
**Priority:** Critical | **Estimated Effort:** 1 hour

**Checklist:**
- [ ] GitHub repository is public
- [ ] README includes setup instructions
- [ ] Live demo deployed and accessible
- [ ] Demo video uploaded (YouTube/Loom)
- [ ] DEV.to post published with submission template
- [ ] All required Algolia features documented
- [ ] Testing credentials provided (if auth required)
- [ ] Submission before February 8, 2026 11:59 PM PT

---

## Appendix A: Test File Organization

### Frontend Tests (`frontend/__tests__/`)

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── compatibility.test.ts
│   │   ├── psu-calculator.test.ts
│   │   └── algolia.test.ts
│   ├── components/
│   │   ├── ComponentCard.test.tsx
│   │   ├── BuildSidebar.test.tsx
│   │   ├── PowerMeter.test.tsx
│   │   ├── CompatibilityBadge.test.tsx
│   │   └── SearchInterface.test.tsx
│   └── stores/
│       └── build-store.test.ts
├── integration/
│   ├── api/
│   │   ├── validate.test.ts
│   │   ├── psu-calculate.test.ts
│   │   └── export.test.ts
│   ├── search.test.ts
│   └── build-flow.test.ts
└── e2e/
    ├── journeys/
    │   ├── complete-build.spec.ts
    │   ├── compatibility-error.spec.ts
    │   ├── chat-assistant.spec.ts
    │   └── export-share.spec.ts
    └── visual/
        └── responsive.spec.ts
```

### Backend Tests (`backend/tests/`)

```
tests/
├── unit/
│   ├── extractors/
│   │   ├── test_kaggle_extractor.py
│   │   └── test_techpowerup_scraper.py
│   ├── transformers/
│   │   ├── test_normalizer.py
│   │   ├── test_compatibility_tagger.py
│   │   └── test_schema_mapper.py
│   └── loaders/
│       └── test_algolia_loader.py
├── integration/
│   ├── test_etl_pipeline.py
│   ├── test_algolia_index.py
│   └── test_query_rules.py
└── fixtures/
    ├── sample_cpus.json
    ├── sample_gpus.json
    ├── sample_motherboards.json
    └── expected_outputs/
```

---

## Appendix B: Parallel Development Timeline

```
Day 1-3: Foundation
├── Agent 1 (Frontend): Project setup, shadcn installation, basic layout
└── Agent 2 (Backend): ETL pipeline, data extraction, transformation

Day 4-6: Core Development
├── Agent 1 (Frontend): UI components, search interface, store
└── Agent 2 (Backend): Algolia indexing, query rules, API routes

Day 7-8: Integration
└── Both Agents: Connect frontend to backend, test integrations

Day 9-10: Agent Studio & Chat
├── Agent 1 (Frontend): Chat widget integration, context sync
└── Agent 2 (Backend): Agent configuration, prompt refinement

Day 11-12: Polish & Submit
└── Both Agents: E2E tests, deployment, documentation, submission
```

---

## Appendix C: Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Algolia rate limits | Implement caching, batch operations |
| Data quality issues | Extensive validation in ETL, fallback defaults |
| Agent hallucination | Strict system prompt, search grounding |
| Performance issues | Progressive loading, result caching |
| Mobile UX problems | Early mobile testing, responsive-first design |
| Deadline pressure | Prioritize MVP features, have stretch goals |

---

*Document Version: 1.0*  
*Last Updated: January 29, 2026*  
*Methodology: Test-Driven Development*
