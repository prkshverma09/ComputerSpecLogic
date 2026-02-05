# Spec-Logic Demo Video Script

**Duration: 6-7 minutes**
**Category: Consumer-Facing Non-Conversational Experiences**

---

Hi, I'm presenting Spec-Logic, an AI-powered PC building assistant tool. This project falls under the Consumer-Facing Non-Conversational Experiences category.

The challenge asked us to build smart enhancements that proactively assist users within existing workflows. The key requirement was to inject intelligence without requiring explicit back-and-forth conversation. One of the specific examples mentioned in the challenge was PC building with knowledge of compatibility of different components. That's exactly what Spec-Logic delivers.

Let me start by explaining the problem we're solving. Building a custom PC is notoriously difficult because of the complex web of compatibility requirements. For example, an AM5 socket CPU will only work with an AM5 motherboard. DDR5 memory is completely incompatible with DDR4 motherboards. A graphics card might be physically too long to fit inside your chosen case. High-end GPUs like the RTX 4090 can spike to twice their rated power draw, requiring careful PSU selection.

Current solutions like generic AI chatbots lack the structured data needed to enforce hard compatibility rules. Spec-Logic solves this by automatically filtering out incompatible options and displaying visual compatibility badges, all without requiring the user to ask any questions.

Now let me walk you through the core user experience. When you land on the build page, you see seven component categories: CPU, Motherboard, Graphics Card, Memory, Power Supply, Case, and CPU Cooler.

The magic happens when you make your first selection. Let's say I choose an AMD Ryzen 7 9700X processor. This is an AM5 socket CPU that only supports DDR5 memory. The moment I add it to my build, something powerful happens behind the scenes. I call this the Lock-In moment.

When I now open the motherboard selection, Spec-Logic has automatically filtered the results to show only AM5 socket motherboards. I didn't ask for this. I didn't type any filters. The system proactively applied compatibility constraints based on my CPU selection. You'll notice a message at the top saying how many incompatible components are being hidden. Every visible component displays a compatibility badge. Green means fully compatible. Yellow indicates a warning that needs attention.

The same intelligence applies throughout the build process. When I select memory, only DDR5 options appear because that's what my CPU and motherboard support. When I browse cases, the system checks GPU clearance and cooler height limits. The build summary sidebar updates in real-time, showing selected components, total price, and a power analysis meter that calculates whether my chosen PSU has enough headroom.

One feature I'm particularly proud of is the visual case preview. When you select a PC case, the build summary sidebar displays the actual product image of that case. This required enriching the component data with high-quality product imagery.

I sourced case images by cross-referencing the PCPartPicker dataset with manufacturer product pages and retailer listings. For each case in the database, I downloaded product photos and stored them in the application's public assets folder. The ETL pipeline then associates each case record with its corresponding image URL. When the data is uploaded to Algolia, each case entry includes this image URL field. This visual feedback helps users see exactly what enclosure their build will live in, making the configuration experience more tangible and engaging.

Spec-Logic also includes an AI chat assistant powered by Algolia Agent Studio. The chat widget features a combobox-style input with suggested queries to help users get started without having to think of what to ask.

You can ask questions like "What CPU should I get for gaming?" or "Is my current PSU sufficient?" The AI uses Algolia's search tool to find relevant components and provide contextual recommendations. Importantly, the assistant is aware of your current build state. It won't recommend a DDR4 memory kit if you've already selected an AM5 motherboard that only supports DDR5. The same compatibility rules that drive the proactive filtering also constrain the AI's recommendations.

Let me highlight the specific Algolia features powering this experience.

InstantSearch provides real-time search with sub-200 millisecond latency. This speed is critical because users expect immediate feedback when browsing components.

Faceted Filtering enables filtering by socket type, memory type, brand, form factor, and price range. These facets update dynamically based on the current result set.

Query Rules automatically detect component patterns. When someone searches for Ryzen 9900X, the system recognizes it's an AM5 CPU and applies the appropriate socket filter without any user intervention.

Agent Studio powers the AI chat assistant. The system prompt enforces hard compatibility rules and instructs the AI to always explain why a recommendation fits or doesn't fit the current build.

Custom Ranking ensures results are sorted by performance tier and price, helping users find the best value options quickly.

Now a quick overview of the technical architecture and how we built the data layer.

For the component data, I searched Kaggle for PC hardware datasets and found several comprehensive sources covering CPUs, GPUs, motherboards, RAM, and power supplies. These datasets contained the raw specifications like socket types, TDP ratings, memory compatibility, and physical dimensions that are essential for compatibility checking. I also scraped PCPartPicker for additional component data including cases and coolers with their detailed specifications.

The backend uses a Python ETL pipeline to extract this data, transform it, and load it into Algolia. The pipeline normalizes inconsistent socket names like "LGA 1700" versus "LGA1700", derives compatibility tags for each component, and enriches records with calculated fields like performance tier.

When creating the Algolia index, I configured searchable attributes to include model names, brands, and component types. I set up faceting attributes for socket type, memory type, form factor, and price range to enable the dynamic filtering. I also configured custom ranking to prioritize components by performance tier first and price second, so users see the best value options at the top of results.

The frontend is built with Next.js 14, React, and shadcn/ui components. This stack provides a modern, accessible user interface with excellent performance characteristics.

Build state is persisted with Zustand so users can return to their configuration later. The state is saved to local storage and automatically rehydrated when the page loads.

The export feature generates PCPartPicker format and Reddit markdown, making it easy to share builds with friends or post them to enthusiast communities.

The key insight of this project is that most of the intelligence happens without any conversation. When I selected that AM5 CPU, the system proactively updated all search filters, calculated power requirements, checked physical clearances, and applied compatibility badges to every visible component. This is contextual data retrieval enhancing user experience, exactly what the challenge asked for.

The AI chat is available for users who want to ask questions, but the core value proposition works entirely through proactive assistance embedded in the browse and select workflow.

In conclusion, Spec-Logic demonstrates how Algolia Agent Studio can power intelligent, proactive experiences that guide users through complex decisions. The combination of fast retrieval, structured data, and AI assistance creates a seamless PC building experience that prevents compatibility mistakes before they happen.

Thank you for watching. Check out the live demo and GitHub repository linked in the submission.
