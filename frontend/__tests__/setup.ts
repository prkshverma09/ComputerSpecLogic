import "@testing-library/jest-dom";

// Mock localStorage for zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_ALGOLIA_APP_ID", "test_app_id");
vi.stubEnv("NEXT_PUBLIC_ALGOLIA_SEARCH_KEY", "test_search_key");
vi.stubEnv("NEXT_PUBLIC_ALGOLIA_INDEX_NAME", "test_index");
vi.stubEnv("NEXT_PUBLIC_AGENT_ID", "test_agent");

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
