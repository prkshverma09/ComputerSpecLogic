---
title: "Spec-Logic: AI-Powered PC Building with Algolia Agent Studio"
published: false
description: "An intelligent PC building assistant that uses Algolia Agent Studio to provide real-time compatibility checking and proactive guidance without requiring back-and-forth dialogue."
tags: algolia, ai, nextjs, typescript
cover_image: <!-- TODO: Add cover image URL - generated image at /Users/paverma/.cursor/projects/Users-paverma-PersonalProjects-ComputerSpecLogic/assets/cover-image.png -->
---

*This is a submission for the [Algolia Agent Studio Challenge](https://dev.to/challenges/algolia): Consumer-Facing Non-Conversational Experiences*

## What I Built

**Spec-Logic** is an AI-powered PC building assistant that eliminates the compatibility nightmare of assembling custom computers. It leverages Algolia Agent Studio combined with InstantSearch to provide intelligent, context-aware component recommendations while enforcing technical compatibility constraints—all without requiring extensive back-and-forth dialogue.

### The Problem

Building a PC involves navigating a complex web of interdependencies:
- **Socket Compatibility**: AMD AM5 CPUs only work with AM5 motherboards
- **Memory Standards**: DDR5 and DDR4 are incompatible and motherboard-dependent
- **Power Requirements**: High-end GPUs like the RTX 4090 can spike to 2x their rated power
- **Physical Constraints**: GPU length and cooler height must fit within case clearances

Current solutions like PCPartPicker require manual navigation and don't explain *why* components are incompatible. Generic chatbots lack the structured data needed to enforce hard compatibility rules.

### The Solution

Spec-Logic combines Algolia's lightning-fast structured search with AI-powered explanations to:

1. **Automatically filter** incompatible options before showing them
2. **Display visual compatibility badges** (✅ Compatible, ⚠️ Warning, ❌ Incompatible)
3. **Calculate power requirements** with realistic safety margins for transient spikes
4. **Provide AI assistance** through an embedded chat widget for questions and recommendations

### Key Features

- **Smart Compatibility Checking**: When you select a CPU, only compatible motherboards appear
- **Advanced Filtering & Sorting**: Filter components by brand, price range, and type-specific attributes (CPU socket, GPU VRAM, motherboard form factor). Sort by price for budget optimization
- **Visual Case Preview**: Selected case displays with product imagery in the build summary sidebar
- **Real-time PSU Calculator**: Accurate power calculations with 1.5x safety margins and transient spike handling
- **Physical Clearance Validation**: GPU length and cooler height checks against case dimensions
- **Intelligent Chat Input**: Combobox-style input with suggested queries and natural language processing
- **Export & Share**: Export builds to PCPartPicker format, Reddit markdown, or shareable links

## Demo

<!-- TODO: Add your live demo URL -->
🔗 **Live Demo**: [https://your-vercel-deployment.vercel.app](https://your-vercel-deployment.vercel.app)

<!-- TODO: Add your GitHub repo URL -->
📦 **GitHub Repository**: [https://github.com/prkshverma09/ComputerSpecLogic](https://github.com/prkshverma09/ComputerSpecLogic)

<!-- TODO: Add your demo video URL (YouTube, Loom, etc.) -->
🎥 **Demo Video**: [Watch the demo](YOUR_VIDEO_LINK_HERE)

### Screenshots

<!-- TODO: Add screenshots of your application -->
<!-- Suggested screenshots:
1. Homepage showing the clean UI
2. Build page with component search and compatibility badges
3. Component selection dialog with filter/sort toolbar
4. Chat widget with combobox input showing suggested queries
5. Build summary sidebar with case image and power meter
6. Export page
-->

**Homepage**
![Homepage](<!-- TODO: Add screenshot URL -->)

**Build Configuration with Compatibility Checking**
![Build Page](<!-- TODO: Add screenshot URL -->)

**AI Chat Assistant**
![Chat Widget](<!-- TODO: Add screenshot URL -->)

## How I Used Algolia Agent Studio

### Data Indexed

I created a comprehensive PC components index containing 7 component types with rich structured data:

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
  "memory_type": ["DDR5"],
  "price_usd": 499,
  "performance_tier": "high-end",
  "compatibility_tags": ["am5", "ddr5", "pcie5", "high-tdp"]
}
```

The index includes:
- **CPUs**: Socket type, TDP, core count, memory support
- **GPUs**: Length (mm), TDP, VRAM, recommended PSU wattage
- **Motherboards**: Socket, form factor, memory type support
- **RAM**: DDR type, speed, capacity
- **PSUs**: Wattage, efficiency rating
- **Cases**: Max GPU length, max cooler height, form factor support, product images
- **Coolers**: Height, socket support, TDP rating

### Retrieval-Enhanced Workflow

The magic happens through **proactive filtering based on build context**. Here's the flow:

1. **User selects a CPU** (e.g., AMD Ryzen 7 9700X with AM5 socket)
2. **Build state updates** with active filters: `socket: "AM5"`, `memory_type: "DDR5"`
3. **Search results automatically filter** to show only compatible components
4. **Compatibility badges appear** on every component showing fit status

This is "non-conversational intelligence" in action—the system guides users through contextual data retrieval without requiring dialogue.

### Query Rules Configuration

I configured Algolia Query Rules to detect component patterns and apply automatic filtering:

```json
{
  "pattern": "Ryzen 9 9|Ryzen 7 9|Ryzen 5 9|9900X|9700X|9600X",
  "consequence": {
    "params": {
      "filters": "socket:AM5",
      "userData": { "detected_socket": "AM5", "compatibility_mode": true }
    }
  }
}
```

When a user searches for "Ryzen 9 9900X", the system automatically:
- Detects it's an AM5 CPU
- Filters subsequent motherboard searches to AM5 socket
- Passes compatibility context to the AI assistant

### Targeted Prompting Approach

The Agent Studio system prompt enforces hard compatibility rules:

```markdown
You are Spec-Logic, an expert PC building assistant.

## Core Rules (NEVER violate):

1. **CPU ↔ Motherboard**: socket MUST match exactly
   - AM5 CPUs → AM5 motherboards only
   - LGA1700 CPUs → LGA1700 motherboards only

2. **Memory ↔ Motherboard**: memory_type MUST match
   - DDR5 motherboards → DDR5 RAM only

3. **GPU ↔ Case**: gpu_length_mm MUST be < case.max_gpu_length_mm

4. **PSU Calculation**: 
   - Calculate: (CPU TDP + GPU TDP + 100W base) × 1.5 safety margin
   - For RTX 4090/4080: add additional 150W for transient spikes

## Behavior:
- When a user selects a component, IMMEDIATELY update filters
- Always explain WHY a recommendation fits or doesn't fit
- Track the "Current Build" state throughout the conversation
```

This ensures the AI never recommends incompatible components and always provides context-aware suggestions.

## Why Fast Retrieval Matters

PC building requires **instant feedback**. When a user clicks "Add to Build" on a CPU, they expect:

1. **Immediate visual confirmation** that it was added
2. **Instant filtering** of search results to compatible options
3. **Real-time compatibility badges** on all visible components
4. **Updated power calculations** in milliseconds

Algolia's sub-200ms search latency makes this possible. Here's why speed is critical for this use case:

### The "Lock-In" Moment

The core UX pattern is what I call the "Lock-In":

```
User selects AMD Ryzen 7 9700X
     ↓
System locks: socket=AM5, memory=DDR5
     ↓
Motherboard search instantly filters to ~50 compatible boards
     ↓
User sees only valid options with green badges
```

This happens in **under 200ms**. Any perceptible delay would break the flow and make users question whether the filtering worked.

### Real-Time Power Calculations

As components are added, the PSU calculator updates instantly:

```javascript
// Power calculation runs on every component change
const totalDraw = basePower + cpuPower + gpuPower + transientBuffer;
const recommendedPsu = Math.ceil(totalDraw * 1.5 / 50) * 50;
```

The power meter in the sidebar animates smoothly because Algolia's fast retrieval means we can fetch component specs and recalculate without any loading states.

### Compatibility Badge Performance

Every component card displays a compatibility badge. For a search returning 20 results, we need to:

1. Fetch component specs from the index
2. Compare against current build state
3. Determine compatibility status
4. Render appropriate badge

With Algolia's speed, this happens before the user even finishes processing the search results visually—creating the perception that the system "just knows" what's compatible.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, shadcn/ui |
| **Search** | Algolia InstantSearch, Agent Studio |
| **State** | Zustand with localStorage persistence |
| **Backend** | Python ETL pipeline for data ingestion |
| **Testing** | Vitest (unit), Playwright (E2E), pytest (backend) |
| **Hosting** | Vercel |

## What's Next

- **Price Tracking**: Alerts when build components drop in price
- **Benchmark Integration**: Show estimated FPS for popular games
- **Community Builds**: Browse and fork popular configurations
- **AR Preview**: Visualize the build in your actual case

---

Built with ❤️ for the Algolia Agent Studio Challenge 2026

<!-- TODO: If this is a team submission, list teammate DEV usernames here -->
<!-- Team Members: @username1, @username2 -->
