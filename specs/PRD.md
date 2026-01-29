# PRD: "Spec-Logic" PC & Tech Concierge

> **Algolia Agent Studio Challenge Submission**  
> Category: Consumer-Facing Non-Conversational Experiences  
> Submission Deadline: February 8, 2026

---

## Executive Summary

**Spec-Logic** is an AI-driven hardware consultant designed to eliminate compatibility errors in complex tech builds. It leverages **Algolia Agent Studio** combined with the **InstantSearch Chat Widget** to provide intelligent, context-aware component recommendations while enforcing technical compatibility constraints through structured data filtering.

This project directly aligns with the Algolia hackathon prompt: *"PC building with knowledge of compatibility of different components"* — demonstrating how contextual data retrieval enhances user experience without requiring extensive back-and-forth dialogue.

---

## 1. Problem Statement

### The PC Building Compatibility Nightmare

Building a PC involves navigating a complex web of interdependencies:
- **Socket Compatibility**: A CPU must match the motherboard socket (e.g., AMD AM5 CPUs only work with AM5 motherboards)
- **Memory Standards**: DDR5 vs DDR4 — incompatible and motherboard-dependent
- **Power Requirements**: Modern GPUs like the RTX 4090 (450W TDP) can spike to 2x rated power, requiring careful PSU selection
- **Physical Constraints**: GPU length must fit within case clearance; CPU cooler height must not exceed case limits
- **Thermal Design**: High-TDP components need adequate cooling solutions

**Current Solutions Fall Short:**
- PCPartPicker requires manual navigation and doesn't explain *why* components are incompatible
- Generic chatbots lack structured data to enforce hard compatibility rules
- YouTube guides become outdated as new hardware releases

### Our Solution

Spec-Logic combines Algolia's lightning-fast structured search with AI-powered explanations to:
1. **Automatically filter** incompatible options before showing them
2. **Explain compatibility** in plain language
3. **Track build state** across the session
4. **Calculate power requirements** with realistic safety margins

---

## 2. Target Audience

| Persona | Pain Points | Spec-Logic Value |
|---------|-------------|------------------|
| **First-time Builders** | Overwhelmed by terms like "LGA 1700", "PCIe Gen 5", "DDR5-6000 CL30" | Plain-language guidance, automatic filtering of incompatible parts |
| **Budget-Conscious Gamers** | Want best performance per dollar without compatibility mistakes | Price-to-performance recommendations within compatibility constraints |
| **Content Creators** | Need high-spec workstations with strict power/thermal requirements | Accurate TDP calculations, professional-grade recommendations |
| **IT Professionals** | Building multiple systems, need efficiency | Rapid validation, exportable build lists |

---

## 3. Data Strategy & Ingestion

### 3.1 Primary Data Sources

| Source | Data Type | Refresh Frequency | Usage |
|--------|-----------|-------------------|-------|
| **[Kaggle CPU/GPU Dataset](https://www.kaggle.com/datasets/michaelbryantds/cpu-and-gpu-product-data)** | Technical Specs | One-time backfill + quarterly updates | Core attributes: Socket, TDP, Core Count, VRAM |
| **[TechPowerUp Scraper](https://github.com/baraaz95/techpowerup-scraper)** | Detailed GPU/CPU Specs | Weekly automated scrape | GPU length (mm), memory bandwidth, boost clocks |
| **[OuterVision PSU Database](https://outervision.com/power-supply-calculator)** | PSU efficiency curves, transient handling | Monthly | Accurate power calculations with headroom |
| **Manufacturer API/Sheets** | Case dimensions, cooler clearance | Manual enrichment | Form factor support, max GPU length, max cooler height |

### 3.2 Algolia Index Schema

```json
{
  "objectID": "cpu-amd-ryzen9-9900x",
  "component_type": "CPU",
  "brand": "AMD",
  "model": "Ryzen 9 9900X",
  "socket": "AM5",
  "tdp_watts": 120,
  "max_tdp_watts": 162,
  "cores": 12,
  "threads": 24,
  "base_clock_ghz": 4.4,
  "boost_clock_ghz": 5.6,
  "memory_type": ["DDR5"],
  "pcie_version": "5.0",
  "integrated_graphics": false,
  "price_usd": 499,
  "release_date": "2024-08-08",
  "performance_tier": "high-end",
  "image_url": "https://...",
  "compatibility_tags": ["am5", "ddr5", "pcie5", "high-tdp"]
}
```

#### Key Indexed Attributes (for Faceting)

| Attribute | Type | Purpose |
|-----------|------|---------|
| `component_type` | String | Primary category filter |
| `socket` | String | CPU/Motherboard matching |
| `form_factor` | String | Case/Motherboard/PSU matching |
| `memory_type` | Array | DDR4/DDR5 compatibility |
| `tdp_watts` | Number | Power calculations |
| `max_gpu_length_mm` | Number | Case clearance checks |
| `max_cooler_height_mm` | Number | Case clearance checks |
| `pcie_version` | String | Feature compatibility |
| `price_usd` | Number | Budget filtering |
| `performance_tier` | String | AI ranking signal |

### 3.3 Data Enrichment Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Raw Kaggle     │────▶│  Python ETL      │────▶│  Algolia Index  │
│  CSV Files      │     │  Pipeline        │     │  (prod_specs)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │               ┌───────┴───────┐               │
        │               │               │               │
        ▼               ▼               ▼               ▼
   TechPowerUp     Normalize      Derive          Real-time
   Scraper         Sockets        Compatibility   Updates via
                   (AM5, LGA1700) Tags            Algolia API
```

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js + React)                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ InstantSearch│  │ Build Summary    │  │ Chat Widget            │ │
│  │ Results Grid │  │ Sidebar          │  │ (Agent Studio)         │ │
│  └──────────────┘  └──────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Algolia Agent Studio                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ Intent       │  │ State Manager    │  │ Filtered Search Tool   │ │
│  │ Parser       │  │ (Build Context)  │  │ (Compatibility)        │ │
│  └──────────────┘  └──────────────────┘  └────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    LLM Provider (OpenAI/Gemini)              │   │
│  │   System Prompt: "Enforce compatibility logic..."            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Algolia Search Index                           │
│  • prod_components (CPU, GPU, Motherboard, RAM, PSU, Case, Cooler) │
│  • Query Rules (socket detection, form factor detection)            │
│  • Facet Filters (socket, form_factor, memory_type, price_usd)     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Agent Studio Configuration

#### System Prompt (Core Logic)

```markdown
You are Spec-Logic, an expert PC building assistant. Your primary job is to help users 
build compatible PC configurations.

## Core Rules (NEVER violate):

1. **CPU ↔ Motherboard**: socket MUST match exactly
   - AM5 CPUs → AM5 motherboards only
   - LGA1700 CPUs → LGA1700 motherboards only
   - LGA1851 CPUs → LGA1851 motherboards only

2. **Memory ↔ Motherboard**: memory_type MUST match
   - DDR5 motherboards → DDR5 RAM only
   - DDR4 motherboards → DDR4 RAM only

3. **GPU ↔ Case**: gpu_length_mm MUST be < case.max_gpu_length_mm

4. **Cooler ↔ Case**: cooler_height_mm MUST be < case.max_cooler_height_mm

5. **PSU Calculation**: 
   - Calculate: (CPU TDP + GPU TDP + 100W base) × 1.5 safety margin
   - Recommend PSU with wattage >= calculated value
   - For RTX 4090/4080: add additional 150W for transient spikes

## Behavior:

- When a user selects a component, IMMEDIATELY update filters on subsequent searches
- Always explain WHY a recommendation fits or doesn't fit
- If a user asks about an incompatible part, warn them clearly
- Track the "Current Build" state throughout the conversation
```

#### Tool Configuration

**Algolia Search Tool Settings:**
```json
{
  "index_name": "prod_components",
  "searchableAttributes": ["model", "brand", "component_type"],
  "attributesForFaceting": [
    "filterOnly(socket)",
    "filterOnly(form_factor)", 
    "filterOnly(memory_type)",
    "searchable(component_type)",
    "price_usd"
  ],
  "customRanking": [
    "desc(performance_tier_score)",
    "asc(price_usd)"
  ]
}
```

### 4.3 Query Rules Configuration

#### Rule 1: CPU Model Detection → Socket Lock

**Condition:**
```json
{
  "pattern": "i9-14900K|i7-14700K|i5-14600K",
  "anchoring": "contains"
}
```

**Consequence:**
```json
{
  "params": {
    "filters": "socket:LGA1700",
    "userData": { "detected_socket": "LGA1700", "compatibility_mode": true }
  }
}
```

#### Rule 2: AMD CPU Detection

**Condition:**
```json
{
  "pattern": "Ryzen 9 9|Ryzen 7 9|Ryzen 5 9|9900X|9700X|9600X",
  "anchoring": "contains"
}
```

**Consequence:**
```json
{
  "params": {
    "filters": "socket:AM5",
    "userData": { "detected_socket": "AM5", "compatibility_mode": true }
  }
}
```

#### Rule 3: High-TDP GPU Warning

**Condition:**
```json
{
  "pattern": "RTX 4090|RTX 4080|RX 7900 XTX",
  "anchoring": "contains"
}
```

**Consequence:**
```json
{
  "params": {
    "userData": { 
      "power_warning": true,
      "min_psu_watts": 850,
      "message": "This GPU requires a minimum 850W PSU with transient spike handling"
    }
  }
}
```

---

## 5. User Experience Design

### 5.1 Core User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: DISCOVERY                                              │
│ User: "I want to build a gaming PC for $1500"                  │
│ Agent: Shows curated builds, explains trade-offs                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: SELECTION (The "Lock-in")                              │
│ User: "Let's go with the Ryzen 7 9700X"                        │
│ Agent: "Locked! AM5 socket, DDR5 memory required.               │
│         Now showing only compatible motherboards..."            │
│ [Sidebar updates: Socket=AM5, Memory=DDR5]                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: GUIDED COMPLETION                                      │
│ Results automatically filter to compatible options              │
│ Cards show: ✅ Compatible | ⚠️ Check Clearance | ❌ Incompatible │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: VALIDATION & EXPORT                                    │
│ Full compatibility check, power calculation summary             │
│ Export: PCPartPicker format, shareable link, Reddit markdown    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 UI Component Specification (shadcn/ui)

#### Component Library Selection

| UI Element | shadcn Component | Purpose |
|------------|------------------|---------|
| Product Cards | `card` | Display components with specs, price, compatibility status |
| Compatibility Badges | `badge` | Visual indicators (✅ Compatible, ⚠️ Warning, ❌ Incompatible) |
| Build Summary | `sidebar` | Persistent panel showing current build state |
| Power Meter | `progress` | Visual PSU headroom indicator |
| Component Details | `sheet` | Slide-out panel for detailed specs |
| Spec Tooltips | `tooltip` | Hover explanations for technical terms |
| Filter Controls | `select`, `slider` | Price range, performance tier filtering |
| Chat Interface | Algolia `Chat` widget | Conversational AI interaction |
| Notifications | `sonner` | Toast notifications for compatibility warnings |
| Component Search | `command` | Quick command palette for power users |

#### Layout Structure

```tsx
<SidebarProvider>
  <div className="flex h-screen">
    {/* Left: Build Summary Sidebar */}
    <Sidebar className="w-80">
      <SidebarHeader>
        <h2>Your Build</h2>
        <Badge variant={isComplete ? "success" : "secondary"}>
          {componentCount}/7 Components
        </Badge>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Selected Components List */}
        <BuildComponentsList components={selectedComponents} />
        
        {/* Power Calculator */}
        <PowerSummary 
          totalTdp={calculatedTdp}
          recommendedPsu={recommendedPsuWattage}
        />
        
        {/* Compatibility Status */}
        <CompatibilityChecklist build={currentBuild} />
      </SidebarContent>
      
      <SidebarFooter>
        <Button onClick={exportBuild}>Export Build</Button>
      </SidebarFooter>
    </Sidebar>

    {/* Main Content */}
    <main className="flex-1 flex flex-col">
      {/* Search & Filters */}
      <header className="border-b p-4">
        <InstantSearch>
          <SearchBox />
          <RefinementFilters />
        </InstantSearch>
      </header>

      {/* Results Grid */}
      <div className="flex-1 overflow-auto p-4">
        <ComponentGrid>
          {hits.map(hit => (
            <ComponentCard 
              key={hit.objectID}
              component={hit}
              compatibilityStatus={checkCompatibility(hit, currentBuild)}
            />
          ))}
        </ComponentGrid>
      </div>

      {/* Chat Widget (Bottom Right) */}
      <Chat 
        agentId="spec-logic-agent"
        className="fixed bottom-4 right-4"
      />
    </main>
  </div>
</SidebarProvider>
```

#### Component Card Design

```tsx
<Card className="relative">
  {/* Compatibility Badge */}
  <Badge 
    variant={status === 'compatible' ? 'success' : status === 'warning' ? 'warning' : 'destructive'}
    className="absolute top-2 right-2"
  >
    {status === 'compatible' && <CheckIcon />}
    {status === 'warning' && <AlertIcon />}
    {status === 'incompatible' && <XIcon />}
  </Badge>

  <CardHeader>
    <img src={component.image_url} alt={component.model} />
  </CardHeader>
  
  <CardContent>
    <h3>{component.brand} {component.model}</h3>
    
    {/* Key Specs */}
    <div className="grid grid-cols-2 gap-2 text-sm">
      <Tooltip content="Processor socket type">
        <span>Socket: {component.socket}</span>
      </Tooltip>
      <Tooltip content="Thermal Design Power">
        <span>TDP: {component.tdp_watts}W</span>
      </Tooltip>
    </div>
    
    {/* Price */}
    <p className="text-lg font-bold">${component.price_usd}</p>
  </CardContent>
  
  <CardFooter>
    <Button onClick={() => addToBuild(component)}>
      Add to Build
    </Button>
  </CardFooter>
</Card>
```

---

## 6. Compatibility Rules Engine

### 6.1 Hard Rules (Must Pass)

| Rule | Formula | Failure Action |
|------|---------|----------------|
| **CPU-Motherboard Socket** | `cpu.socket === motherboard.socket` | Block selection, show error |
| **Memory-Motherboard Type** | `ram.type IN motherboard.memory_type` | Block selection |
| **GPU-Case Length** | `gpu.length_mm < case.max_gpu_length_mm` | Warning with mm difference |
| **Cooler-Case Height** | `cooler.height_mm < case.max_cooler_height_mm` | Warning with mm difference |
| **PSU-System Power** | `psu.wattage >= (total_tdp * 1.5)` | Show recommended wattage |

### 6.2 Soft Rules (Recommendations)

| Rule | Logic | User Notification |
|------|-------|-------------------|
| **PSU Efficiency** | 50-60% load optimal | "Your 850W PSU will run at peak efficiency with this 500W system" |
| **Balanced Build** | No extreme bottlenecks | "Your CPU may bottleneck this high-end GPU in some games" |
| **Feature Parity** | PCIe 5.0 CPU + PCIe 3.0 board | "You're not utilizing full PCIe 5.0 speeds" |
| **Thermal Headroom** | High-TDP + stock cooler | "Consider an aftermarket cooler for better thermals" |

### 6.3 PSU Calculation Formula

```javascript
function calculateRecommendedPSU(build) {
  const basePower = 100; // Motherboard, storage, fans
  const cpuPower = build.cpu?.max_tdp_watts || build.cpu?.tdp_watts || 0;
  const gpuPower = build.gpu?.tdp_watts || 0;
  
  // High-end GPU transient spike adjustment
  const transientBuffer = (gpuPower >= 300) ? 150 : 0;
  
  const totalDraw = basePower + cpuPower + gpuPower + transientBuffer;
  
  // 1.5x multiplier for headroom + efficiency sweet spot
  const recommendedWattage = Math.ceil(totalDraw * 1.5 / 50) * 50; // Round up to nearest 50W
  
  return {
    calculatedDraw: totalDraw,
    recommendedPSU: recommendedWattage,
    efficiencyLoad: (totalDraw / recommendedWattage * 100).toFixed(0) + '%'
  };
}
```

---

## 7. Technical Implementation

### 7.1 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14 (App Router) | SSR for SEO, React Server Components |
| **UI Components** | shadcn/ui + Tailwind CSS | Accessible, customizable, modern design |
| **Search** | Algolia InstantSearch React | Native integration with Agent Studio |
| **AI Chat** | Algolia Chat Widget | Built-in streaming, state management |
| **State Management** | Zustand | Lightweight, perfect for build state |
| **Data Pipeline** | Python + Pandas | ETL for Kaggle/scraped data |
| **Hosting** | Vercel | Edge deployment, optimal for Next.js |

### 7.2 Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "algoliasearch": "^4.22.0",
    "react-instantsearch": "^7.5.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.309.0",
    "zustand": "^4.4.7",
    "tailwindcss": "^3.4.0"
  }
}
```

### 7.3 API Routes

```typescript
// /api/build/validate - Validate entire build compatibility
POST /api/build/validate
Body: { components: BuildComponent[] }
Response: { valid: boolean, issues: CompatibilityIssue[], warnings: string[] }

// /api/build/export - Export build in various formats
POST /api/build/export
Body: { build: Build, format: 'pcpartpicker' | 'reddit' | 'json' }
Response: { formatted: string, shareUrl: string }

// /api/psu/calculate - Calculate PSU requirements
POST /api/psu/calculate
Body: { cpu: Component, gpu: Component }
Response: { recommendedWattage: number, breakdown: PowerBreakdown }
```

---

## 8. Success Metrics & Judging Alignment

### 8.1 Algolia Hackathon Judging Criteria Alignment

| Criteria | How Spec-Logic Addresses It |
|----------|----------------------------|
| **Use of Underlying Technology** | Deep integration with Agent Studio (system prompts, tools, query rules), InstantSearch Chat widget, faceted filtering, NeuralSearch for natural queries |
| **Usability & UX** | Zero-friction compatibility checking, visual badges, progressive disclosure, mobile-responsive design |
| **Originality & Creativity** | Novel "compatibility pivot" flow, real-time PSU calculator, exportable builds, bottleneck warnings |

### 8.2 Key Differentiators

1. **Proactive Filtering**: Unlike chatbots that explain after selection, Spec-Logic *prevents* incompatible options from appearing
2. **Visual State Tracking**: Build summary sidebar provides constant context without cluttering chat
3. **Expert-Level Explanations**: AI explains *why* with technical detail for enthusiasts, simple terms for beginners
4. **Export Functionality**: Bridges the gap to purchasing with PCPartPicker/Reddit export

---

## 9. Future Enhancements (Post-Hackathon)

| Feature | Description | Algolia Feature Used |
|---------|-------------|---------------------|
| **Price Tracking** | Alert when build components drop in price | Algolia Recommend + Rules |
| **Benchmark Integration** | Show FPS estimates for games | Custom attributes + AI synthesis |
| **Community Builds** | Browse/fork popular configurations | Separate index + personalization |
| **Multi-Region Pricing** | Support EU/UK/AU pricing | Geo-replicated indices |
| **AR Preview** | Visualize build in case | External integration (future) |

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Days 1-3)
- [ ] Set up Next.js project with shadcn/ui
- [ ] Download and clean Kaggle datasets
- [ ] Create Algolia index with schema
- [ ] Implement basic InstantSearch grid

### Phase 2: Agent Studio (Days 4-6)
- [ ] Configure Agent Studio with system prompt
- [ ] Set up Query Rules for socket detection
- [ ] Integrate Chat widget
- [ ] Implement build state management

### Phase 3: Compatibility Engine (Days 7-9)
- [ ] Build compatibility validation logic
- [ ] Create visual status badges
- [ ] Implement PSU calculator
- [ ] Add sidebar build summary

### Phase 4: Polish & Submit (Days 10-12)
- [ ] Mobile responsiveness
- [ ] Export functionality
- [ ] Demo video recording
- [ ] DEV.to submission post

---

## 11. Demo & Submission

### Demo Script
1. **Opening**: Show homepage with clean UI, explain the problem
2. **Discovery**: Type "gaming PC under $1500" → AI suggests builds
3. **The Lock-In**: Select Ryzen 7 9700X → Watch filters auto-apply
4. **Compatibility Check**: Try to select DDR4 RAM → See warning/block
5. **Build Completion**: Add remaining components → Show power calculation
6. **Export**: Generate PCPartPicker link

### Submission Checklist
- [ ] GitHub repository with README
- [ ] Live deployed demo (Vercel)
- [ ] DEV.to post using submission template
- [ ] 3-minute demo video
- [ ] Testing credentials (if auth required)

---

## Appendix A: Socket Compatibility Reference

| Socket | CPUs | Memory Support | Current Chipsets |
|--------|------|----------------|------------------|
| **AM5** | Ryzen 9000/8000/7000 | DDR5 only | X870E, X870, X670E, X670, B650E, B650, A620 |
| **LGA1700** | Intel 12th/13th/14th Gen | DDR4 or DDR5 | Z790, Z690, B760, B660, H770, H670 |
| **LGA1851** | Intel Core Ultra 200 | DDR5 only | Z890, B860 |

## Appendix B: Sample Component Records

```json
[
  {
    "objectID": "cpu-amd-9700x",
    "component_type": "CPU",
    "brand": "AMD",
    "model": "Ryzen 7 9700X",
    "socket": "AM5",
    "tdp_watts": 65,
    "max_tdp_watts": 88,
    "cores": 8,
    "threads": 16,
    "memory_type": ["DDR5"],
    "price_usd": 359,
    "performance_tier": "mid-high"
  },
  {
    "objectID": "mobo-asus-x670e",
    "component_type": "Motherboard",
    "brand": "ASUS",
    "model": "ROG Strix X670E-E Gaming WiFi",
    "socket": "AM5",
    "form_factor": "ATX",
    "memory_type": ["DDR5"],
    "memory_slots": 4,
    "max_memory_gb": 128,
    "pcie_slots": {"x16": 2, "x4": 1, "x1": 1},
    "price_usd": 499
  },
  {
    "objectID": "gpu-nvidia-4070ti-super",
    "component_type": "GPU",
    "brand": "NVIDIA",
    "model": "GeForce RTX 4070 Ti SUPER",
    "length_mm": 336,
    "tdp_watts": 285,
    "vram_gb": 16,
    "memory_type": "GDDR6X",
    "pcie_version": "4.0",
    "price_usd": 799
  }
]
```

---

*Document Version: 2.0*  
*Last Updated: January 29, 2026*  
*Author: Spec-Logic Team*
