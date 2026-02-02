# Algolia Agent Studio Configuration Guide

> **IMPORTANT:** The PC Build Assistant chat widget uses Algolia Agent Studio for AI responses. By default, the Agent provides general PC building advice. **To enable product-specific recommendations from your index, you MUST configure the Algolia Search tool in the Agent Studio dashboard.**

The chatbot can work in two modes:
1. **General Knowledge Mode** (default): Answers questions about PC building using AI knowledge
2. **Data-Connected Mode**: Searches your `prod_components` index to recommend specific products

## Prerequisites

- Algolia account with Agent Studio access (beta feature)
- Your component index (`prod_components`) already set up with 1,900+ components
- Agent ID configured in `.env.local`

## Step 1: Access Agent Studio Dashboard

1. Go to [Algolia Dashboard](https://dashboard.algolia.com)
2. Navigate to **AI** → **Agent Studio** in the left sidebar
3. Find your agent (ID: `99ef751c-e710-4942-9943-894f45c2ac93`) or create a new one

## Step 2: Add the Algolia Search Tool

1. In your Agent settings, click **Add tool** → **Algolia Search**
2. Configure the tool:
   - **Index**: Select `prod_components`
   - **Description**: Enter the following:
   
   ```
   PC components database with CPUs, GPUs, motherboards, RAM, power supplies, cases, and coolers. Each component has: brand, model, component_type, price_usd, socket, form_factor, memory_type, tdp_watts, wattage, vram_gb, cores, threads, speed_mhz, capacity_gb, and compatibility attributes.
   ```

3. (Optional) Add search parameters for better results:

   ```json
   {
     "searchParameters": {
       "attributesToRetrieve": [
         "objectID", "component_type", "brand", "model", "socket",
         "form_factor", "memory_type", "tdp_watts", "wattage", "vram_gb",
         "price_usd", "cores", "threads", "speed_mhz", "capacity_gb"
       ],
       "hitsPerPage": 10
     }
   }
   ```

4. Click **Add tool** to save

## Step 3: Configure Agent Instructions

In the Agent's **Instructions** field, add context about PC building:

```
You are a PC Build Assistant helping users build custom computers. You have access to a database of PC components including CPUs, GPUs, motherboards, RAM, power supplies, cases, and coolers.

Key responsibilities:
1. Help users find components that fit their budget and use case
2. Recommend compatible components (matching sockets, form factors, memory types)
3. Estimate power requirements and suggest appropriate PSU wattage
4. Answer questions about PC building, component specifications, and compatibility

When searching for components:
- Use price_usd for budget filtering (e.g., "price_usd < 300" for CPUs under $300)
- Use component_type to filter by category (CPU, GPU, Motherboard, RAM, PSU, Case, Cooler)
- Consider socket compatibility for CPUs and motherboards
- Consider form_factor for motherboard and case compatibility
- Consider memory_type for RAM and motherboard compatibility

Always provide specific product recommendations when available, including brand, model, and price.
```

## Step 4: Test the Agent

1. Click **Test** in the Agent Studio dashboard
2. Try queries like:
   - "What CPUs are available under $200?"
   - "Recommend a GPU for 1440p gaming"
   - "What motherboards are compatible with LGA1700 socket?"

## Step 5: Update Environment Variables

If you created a new agent, update your `.env.local`:

```env
NEXT_PUBLIC_AGENT_ID=your-new-agent-id
```

## Troubleshooting

### Agent says "no components found" but they exist

1. Verify the Algolia Search tool is added to your agent
2. Check that the tool points to the correct index (`prod_components`)
3. Ensure the search API key has permissions to read the index

### Agent gives generic responses without data

1. The agent may not be using the search tool - check the agent instructions
2. Add explicit instructions like "Always search the database before answering questions about available products"

### Loading spinner appears forever

1. Check browser console for errors
2. Verify the Agent ID in `.env.local` is correct
3. Ensure you have a valid LLM provider configured in Agent Studio

## Component Data Schema

For reference, here's the data schema in `prod_components`:

| Field | Description | Example |
|-------|-------------|---------|
| `component_type` | CPU, GPU, Motherboard, RAM, PSU, Case, Cooler | "CPU" |
| `brand` | Manufacturer | "Intel", "AMD", "NVIDIA" |
| `model` | Product model name | "Core i7-14700K" |
| `price_usd` | Price in USD | 349.99 |
| `socket` | CPU/Motherboard socket | "LGA1700", "AM5" |
| `form_factor` | Physical form factor | "ATX", "mATX", "ITX" |
| `memory_type` | RAM type supported | "DDR5", "DDR4" |
| `tdp_watts` | Thermal design power | 125 |
| `wattage` | PSU wattage | 750 |
| `cores` | CPU core count | 20 |
| `threads` | CPU thread count | 28 |
| `vram_gb` | GPU video memory | 16 |
| `speed_mhz` | RAM speed | 6000 |
| `capacity_gb` | RAM capacity | 32 |

## Support

For Algolia Agent Studio issues:
- [Agent Studio Documentation](https://www.algolia.com/doc/guides/algolia-ai/agent-studio/)
- [Algolia Search Tool Guide](https://www.algolia.com/doc/guides/algolia-ai/agent-studio/how-to/tools/algolia-search)
