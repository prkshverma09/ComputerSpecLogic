# Spec-Logic Technical Architecture Diagrams

## Diagram 1: Algolia Features

**Show at:** Script lines 53-73 (Algolia features section)
> "Let me highlight the specific Algolia features powering this experience..."

```mermaid
flowchart TB
    subgraph Features ["Algolia Features Used"]
        IS["InstantSearch<br/>< 200ms latency"]
        FF["Faceted Filtering<br/>socket, memory_type, brand, price"]
        QR["Query Rules<br/>Auto-detect CPU patterns"]
        CR["Custom Ranking<br/>Performance tier, Price"]
        AGS["Agent Studio<br/>AI Chat with build context"]
    end

    subgraph Index ["Index: prod_components"]
        SA["Searchable: model, brand, type"]
        FA["Facets: socket, memory_type, form_factor, price"]
    end

    Index --> Features
```

---

## Diagram 2: System Architecture

**Show at:** Script lines 77-101 (Technical architecture section)
> "Now a quick overview of the technical architecture and how we built the data layer..."

```mermaid
flowchart TB
    subgraph Sources ["Data Sources"]
        K[("Kaggle<br/>CPUs, GPUs, RAM")]
        P[("PCPartPicker<br/>Motherboards, Cases, Coolers, PSUs, Storage")]
    end

    subgraph Backend ["Python ETL Pipeline"]
        E["Extract"] --> T["Transform<br/>Normalize, Tag, Enrich"]
        T --> L["Load"]
    end

    subgraph Algolia ["Algolia"]
        IDX[("Components Index")]
        QR["Query Rules"]
        AS["Agent Studio"]
    end

    subgraph Frontend ["Next.js 14 Frontend"]
        IS["InstantSearch"]
        CL["Compatibility Logic"]
        PSU["PSU Calculator"]
        ZS["Zustand + localStorage"]
        UI["React + shadcn/ui"]
        EX["Export"]
    end

    K & P --> E
    L --> IDX
    QR --> IDX
    IDX --> IS
    IS --> CL --> UI
    AS --> UI
    UI <--> ZS
    PSU --> UI
    ZS --> EX
```

---

## Quick Reference: When to Show Each Diagram

| Diagram | Script Section | Timestamp (approx) |
|---------|---------------|-------------------|
| **1. Algolia Features** | Algolia features | ~4:00-5:00 |
| **2. System Architecture** | Technical architecture | ~5:00-6:00 |
