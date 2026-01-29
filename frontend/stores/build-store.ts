import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Build,
  Component,
  ComponentType,
  CPU,
  GPU,
  Motherboard,
  RAM,
  PSU,
  Case,
  Cooler,
  ValidationResult,
  ActiveFilters,
} from "@/types/components";
import {
  validateBuild,
  calculatePowerRequirements,
  deriveActiveFilters,
} from "@/lib/compatibility";

/**
 * Build store state interface
 */
interface BuildState {
  // Current build
  build: Build;

  // Derived state
  totalPrice: number;
  totalTdp: number;
  componentCount: number;
  activeFilters: ActiveFilters;
  validationResult: ValidationResult | null;

  // Actions
  addComponent: (component: Component) => void;
  removeComponent: (type: ComponentType) => void;
  replaceComponent: (component: Component) => void;
  clearBuild: () => void;
  validateCurrentBuild: () => ValidationResult;

  // Utility
  getComponent: (type: ComponentType) => Component | null;
  isComponentSelected: (objectID: string) => boolean;
}

/**
 * Empty build state
 */
const emptyBuild: Build = {
  cpu: null,
  motherboard: null,
  gpu: null,
  ram: null,
  psu: null,
  case: null,
  cooler: null,
};

/**
 * Calculate total price of build
 */
function calculateTotalPrice(build: Build): number {
  let total = 0;
  Object.values(build).forEach((component) => {
    if (component) {
      total += component.price_usd;
    }
  });
  return total;
}

/**
 * Calculate total TDP
 */
function calculateTotalTdp(build: Build): number {
  const analysis = calculatePowerRequirements(build);
  return analysis.totalTdp;
}

/**
 * Count selected components
 */
function countComponents(build: Build): number {
  return Object.values(build).filter((c) => c !== null).length;
}

/**
 * Build store with persistence
 */
export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      // Initial state
      build: emptyBuild,
      totalPrice: 0,
      totalTdp: 0,
      componentCount: 0,
      activeFilters: { socket: null, memory_type: null, form_factor: null },
      validationResult: null,

      // Add a component to the build
      addComponent: (component: Component) => {
        const type = component.component_type;
        const key = type.toLowerCase() as keyof Build;

        set((state) => {
          const newBuild = {
            ...state.build,
            [key]: component,
          };

          return {
            build: newBuild,
            totalPrice: calculateTotalPrice(newBuild),
            totalTdp: calculateTotalTdp(newBuild),
            componentCount: countComponents(newBuild),
            activeFilters: deriveActiveFilters(newBuild),
            validationResult: validateBuild(newBuild),
          };
        });
      },

      // Remove a component from the build
      removeComponent: (type: ComponentType) => {
        const key = type.toLowerCase() as keyof Build;

        set((state) => {
          const newBuild = {
            ...state.build,
            [key]: null,
          };

          return {
            build: newBuild,
            totalPrice: calculateTotalPrice(newBuild),
            totalTdp: calculateTotalTdp(newBuild),
            componentCount: countComponents(newBuild),
            activeFilters: deriveActiveFilters(newBuild),
            validationResult: validateBuild(newBuild),
          };
        });
      },

      // Replace a component (same as add, but more explicit)
      replaceComponent: (component: Component) => {
        get().addComponent(component);
      },

      // Clear the entire build
      clearBuild: () => {
        set({
          build: emptyBuild,
          totalPrice: 0,
          totalTdp: 0,
          componentCount: 0,
          activeFilters: { socket: null, memory_type: null, form_factor: null },
          validationResult: null,
        });
      },

      // Validate the current build
      validateCurrentBuild: () => {
        const result = validateBuild(get().build);
        set({ validationResult: result });
        return result;
      },

      // Get a specific component
      getComponent: (type: ComponentType) => {
        const key = type.toLowerCase() as keyof Build;
        return get().build[key];
      },

      // Check if a component is selected
      isComponentSelected: (objectID: string) => {
        const build = get().build;
        return Object.values(build).some(
          (c) => c !== null && c.objectID === objectID
        );
      },
    }),
    {
      name: "spec-logic-build",
      // Only persist the build, not derived state
      partialize: (state) => ({ build: state.build }),
      // Rehydrate derived state on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          const build = state.build;
          state.totalPrice = calculateTotalPrice(build);
          state.totalTdp = calculateTotalTdp(build);
          state.componentCount = countComponents(build);
          state.activeFilters = deriveActiveFilters(build);
          state.validationResult = validateBuild(build);
        }
      },
    }
  )
);

/**
 * Hook to get compatibility status for a component
 */
export function useComponentCompatibility(component: Component | null): {
  status: "compatible" | "warning" | "incompatible" | "unknown";
  message?: string;
} {
  const build = useBuildStore((state) => state.build);

  if (!component) {
    return { status: "unknown" };
  }

  // Import here to avoid circular dependency
  const { checkComponentCompatibility } = require("@/lib/compatibility");
  return checkComponentCompatibility(component, build);
}

/**
 * Selectors for specific parts of the store
 */
export const selectBuild = (state: BuildState) => state.build;
export const selectTotalPrice = (state: BuildState) => state.totalPrice;
export const selectTotalTdp = (state: BuildState) => state.totalTdp;
export const selectComponentCount = (state: BuildState) => state.componentCount;
export const selectActiveFilters = (state: BuildState) => state.activeFilters;
export const selectValidationResult = (state: BuildState) =>
  state.validationResult;

export const selectCPU = (state: BuildState) => state.build.cpu;
export const selectGPU = (state: BuildState) => state.build.gpu;
export const selectMotherboard = (state: BuildState) => state.build.motherboard;
export const selectRAM = (state: BuildState) => state.build.ram;
export const selectPSU = (state: BuildState) => state.build.psu;
export const selectCase = (state: BuildState) => state.build.case;
export const selectCooler = (state: BuildState) => state.build.cooler;
