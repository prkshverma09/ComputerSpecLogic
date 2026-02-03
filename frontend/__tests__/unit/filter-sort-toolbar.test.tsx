import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { FilterSortToolbar } from "@/components/search/filter-sort-toolbar"
import { InstantSearch } from "react-instantsearch"

const mockSearchClient = {
  search: vi.fn(() => Promise.resolve({ results: [{ hits: [] }] })),
  searchForFacetValues: vi.fn(() => Promise.resolve({ facetHits: [] })),
}

const mockUseRefinementList = vi.fn()
const mockUseRange = vi.fn()
const mockUseSortBy = vi.fn()

vi.mock("react-instantsearch", async () => {
  const actual = await vi.importActual("react-instantsearch")
  return {
    ...actual,
    useRefinementList: () => mockUseRefinementList(),
    useRange: () => mockUseRange(),
    useSortBy: () => mockUseSortBy(),
  }
})

function renderWithInstantSearch(ui: React.ReactNode) {
  return render(
    <InstantSearch searchClient={mockSearchClient as any} indexName="test_index">
      {ui}
    </InstantSearch>
  )
}

describe("FilterSortToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUseRefinementList.mockReturnValue({
      items: [
        { label: "Intel", value: "Intel", count: 50, isRefined: false },
        { label: "AMD", value: "AMD", count: 30, isRefined: false },
        { label: "NVIDIA", value: "NVIDIA", count: 40, isRefined: false },
      ],
      refine: vi.fn(),
      canRefine: true,
    })

    mockUseRange.mockReturnValue({
      range: { min: 0, max: 2000 },
      start: [0, 2000],
      refine: vi.fn(),
      canRefine: true,
    })

    mockUseSortBy.mockReturnValue({
      currentRefinement: "prod_components",
      options: [
        { label: "Relevance", value: "prod_components" },
        { label: "Price: Low to High", value: "prod_components_price_asc" },
        { label: "Price: High to Low", value: "prod_components_price_desc" },
      ],
      refine: vi.fn(),
      canRefine: true,
    })
  })

  describe("Rendering", () => {
    it("should render the filter toolbar", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.getByText(/filters/i)).toBeInTheDocument()
    })

    it("should render brand filter button", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.getByRole("button", { name: /brand/i })).toBeInTheDocument()
    })

    it("should render price filter button", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.getByRole("button", { name: /price/i })).toBeInTheDocument()
    })

    it("should render sort dropdown", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.getByRole("button", { name: /sort/i })).toBeInTheDocument()
    })
  })

  describe("Brand Filter", () => {
    it("should open brand filter popover when clicked", async () => {
      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const brandButton = screen.getByRole("button", { name: /brand/i })
      await user.click(brandButton)
      
      await waitFor(() => {
        expect(screen.getByText("Intel")).toBeInTheDocument()
        expect(screen.getByText("AMD")).toBeInTheDocument()
      })
    })

    it("should show brand counts", async () => {
      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const brandButton = screen.getByRole("button", { name: /brand/i })
      await user.click(brandButton)
      
      await waitFor(() => {
        expect(screen.getByText("50")).toBeInTheDocument()
        expect(screen.getByText("30")).toBeInTheDocument()
      })
    })

    it("should call refine when brand is selected", async () => {
      const refineMock = vi.fn()
      mockUseRefinementList.mockReturnValue({
        items: [
          { label: "Intel", value: "Intel", count: 50, isRefined: false },
          { label: "AMD", value: "AMD", count: 30, isRefined: false },
        ],
        refine: refineMock,
        canRefine: true,
      })

      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const brandButton = screen.getByRole("button", { name: /brand/i })
      await user.click(brandButton)
      
      const intelCheckbox = await screen.findByRole("checkbox", { name: /intel/i })
      await user.click(intelCheckbox)
      
      expect(refineMock).toHaveBeenCalledWith("Intel")
    })

    it("should show selected brand as checked", async () => {
      mockUseRefinementList.mockReturnValue({
        items: [
          { label: "Intel", value: "Intel", count: 50, isRefined: true },
          { label: "AMD", value: "AMD", count: 30, isRefined: false },
        ],
        refine: vi.fn(),
        canRefine: true,
      })

      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const brandButton = screen.getByRole("button", { name: /brand/i })
      await user.click(brandButton)
      
      const intelCheckbox = await screen.findByRole("checkbox", { name: /intel/i })
      expect(intelCheckbox).toBeChecked()
    })
  })

  describe("Price Filter", () => {
    it("should open price filter popover when clicked", async () => {
      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const priceButton = screen.getByRole("button", { name: /price/i })
      await user.click(priceButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/min/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/max/i)).toBeInTheDocument()
      })
    })

    it("should show current price range", async () => {
      mockUseRange.mockReturnValue({
        range: { min: 0, max: 2000 },
        start: [100, 500],
        refine: vi.fn(),
        canRefine: true,
      })

      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const priceButton = screen.getByRole("button", { name: /price/i })
      await user.click(priceButton)
      
      const minInput = await screen.findByLabelText(/min/i)
      const maxInput = await screen.findByLabelText(/max/i)
      
      expect(minInput).toHaveValue(100)
      expect(maxInput).toHaveValue(500)
    })

    it("should call refine when price range is changed", async () => {
      const refineMock = vi.fn()
      mockUseRange.mockReturnValue({
        range: { min: 0, max: 2000 },
        start: [0, 2000],
        refine: refineMock,
        canRefine: true,
      })

      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const priceButton = screen.getByRole("button", { name: /price/i })
      await user.click(priceButton)
      
      const minInput = await screen.findByLabelText(/min/i)
      await user.clear(minInput)
      await user.type(minInput, "100")
      
      const applyButton = screen.getByRole("button", { name: /apply/i })
      await user.click(applyButton)
      
      expect(refineMock).toHaveBeenCalled()
    })
  })

  describe("Sorting", () => {
    it("should open sort dropdown when clicked", async () => {
      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const sortButton = screen.getByRole("button", { name: /sort/i })
      await user.click(sortButton)
      
      await waitFor(() => {
        expect(screen.getByText("Relevance")).toBeInTheDocument()
        expect(screen.getByText("Price: Low to High")).toBeInTheDocument()
        expect(screen.getByText("Price: High to Low")).toBeInTheDocument()
      })
    })

    it("should call refine when sort option is selected", async () => {
      const refineMock = vi.fn()
      mockUseSortBy.mockReturnValue({
        currentRefinement: "prod_components",
        options: [
          { label: "Relevance", value: "prod_components" },
          { label: "Price: Low to High", value: "prod_components_price_asc" },
          { label: "Price: High to Low", value: "prod_components_price_desc" },
        ],
        refine: refineMock,
        canRefine: true,
      })

      const user = userEvent.setup()
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      const sortButton = screen.getByRole("button", { name: /sort/i })
      await user.click(sortButton)
      
      const lowToHighOption = await screen.findByText("Price: Low to High")
      await user.click(lowToHighOption)
      
      expect(refineMock).toHaveBeenCalledWith("prod_components_price_asc")
    })

    it("should show current sort selection", () => {
      mockUseSortBy.mockReturnValue({
        currentRefinement: "prod_components_price_asc",
        options: [
          { label: "Relevance", value: "prod_components" },
          { label: "Price: Low to High", value: "prod_components_price_asc" },
          { label: "Price: High to Low", value: "prod_components_price_desc" },
        ],
        refine: vi.fn(),
        canRefine: true,
      })

      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.getByText(/low to high/i)).toBeInTheDocument()
    })
  })

  describe("Clear Filters", () => {
    it("should show clear button when filters are active", () => {
      mockUseRefinementList.mockReturnValue({
        items: [
          { label: "Intel", value: "Intel", count: 50, isRefined: true },
        ],
        refine: vi.fn(),
        canRefine: true,
      })

      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument()
    })

    it("should not show clear button when no filters are active", () => {
      mockUseRefinementList.mockReturnValue({
        items: [
          { label: "Intel", value: "Intel", count: 50, isRefined: false },
        ],
        refine: vi.fn(),
        canRefine: true,
      })
      mockUseRange.mockReturnValue({
        range: { min: 0, max: 2000 },
        start: [0, 2000],
        refine: vi.fn(),
        canRefine: true,
      })

      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument()
    })
  })

  describe("Component-specific filters", () => {
    it("should show socket filter for CPU", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="CPU" />)
      
      expect(screen.getByRole("button", { name: /socket/i })).toBeInTheDocument()
    })

    it("should show VRAM filter for GPU", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="GPU" />)
      
      expect(screen.getByRole("button", { name: /vram/i })).toBeInTheDocument()
    })

    it("should show form factor filter for Motherboard", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="Motherboard" />)
      
      expect(screen.getByRole("button", { name: /form factor/i })).toBeInTheDocument()
    })

    it("should show wattage filter for PSU", () => {
      renderWithInstantSearch(<FilterSortToolbar componentType="PSU" />)
      
      expect(screen.getByRole("button", { name: /wattage/i })).toBeInTheDocument()
    })
  })
})
