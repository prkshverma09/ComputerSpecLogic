import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatComboboxInput } from "@/components/chat/chat-combobox-input";

const mockPresets = [
  { id: "gaming-cpu", label: "CPU for gaming PC", prompt: "What Intel CPUs do you have for gaming?" },
  { id: "gpu-for-build", label: "GPU for my build", prompt: "What NVIDIA graphics cards do you have?" },
  { id: "compatible-mobo", label: "Find a motherboard", prompt: "What motherboards are available?" },
];

describe("ChatComboboxInput", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the input field", () => {
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      expect(input).toBeInTheDocument();
    });

    it("should display placeholder text", () => {
      render(
        <ChatComboboxInput 
          presets={mockPresets} 
          onSubmit={mockOnSubmit} 
          placeholder="Ask about PC builds..." 
        />
      );
      
      const input = screen.getByPlaceholderText("Ask about PC builds...");
      expect(input).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole("button", { name: /send/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe("preset suggestions", () => {
    it("should show suggestions dropdown when input is focused", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText("CPU for gaming PC")).toBeInTheDocument();
        expect(screen.getByText("GPU for my build")).toBeInTheDocument();
        expect(screen.getByText("Find a motherboard")).toBeInTheDocument();
      });
    });

    it("should filter suggestions based on input text", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.type(input, "CPU");
      
      await waitFor(() => {
        expect(screen.getByText("CPU for gaming PC")).toBeInTheDocument();
        expect(screen.queryByText("GPU for my build")).not.toBeInTheDocument();
      });
    });

    it("should populate input when selecting a preset", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox") as HTMLInputElement;
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText("CPU for gaming PC")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("CPU for gaming PC"));
      
      await waitFor(() => {
        expect(input.value).toBe("What Intel CPUs do you have for gaming?");
      });
    });

    it("should close dropdown after selecting a preset", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText("CPU for gaming PC")).toBeInTheDocument();
      });
      
      await user.click(screen.getByText("CPU for gaming PC"));
      
      await waitFor(() => {
        expect(screen.queryByText("GPU for my build")).not.toBeInTheDocument();
      });
    });

    it("should show 'no suggestions' message when no presets match", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.type(input, "xyz random text that matches nothing");
      
      await waitFor(() => {
        expect(screen.getByText(/no suggestions/i)).toBeInTheDocument();
      });
    });
  });

  describe("form submission", () => {
    it("should call onSubmit with input value when clicking submit button", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.type(input, "What GPU should I buy?");
      
      const submitButton = screen.getByRole("button", { name: /send/i });
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith("What GPU should I buy?");
    });

    it("should call onSubmit when pressing Enter", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.type(input, "What CPU is best?{Enter}");
      
      expect(mockOnSubmit).toHaveBeenCalledWith("What CPU is best?");
    });

    it("should clear input after submission", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox") as HTMLInputElement;
      await user.type(input, "Test question{Enter}");
      
      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should not submit empty input", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole("button", { name: /send/i });
      await user.click(submitButton);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should disable submit button when input is empty", () => {
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole("button", { name: /send/i });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when input has text", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.type(input, "test");
      
      const submitButton = screen.getByRole("button", { name: /send/i });
      expect(submitButton).toBeEnabled();
    });
  });

  describe("keyboard navigation", () => {
    it("should navigate suggestions with arrow keys", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText("CPU for gaming PC")).toBeInTheDocument();
      });
      
      await user.keyboard("{ArrowDown}");
      
      const firstOption = screen.getByText("CPU for gaming PC").closest("[role='option']");
      expect(firstOption).toHaveAttribute("data-highlighted", "true");
    });

    it("should select suggestion with Enter key after navigation", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox") as HTMLInputElement;
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText("CPU for gaming PC")).toBeInTheDocument();
      });
      
      await user.keyboard("{ArrowDown}{Enter}");
      
      await waitFor(() => {
        expect(input.value).toBe("What Intel CPUs do you have for gaming?");
      });
    });

    it("should close dropdown on Escape key", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} />);
      
      const input = screen.getByRole("combobox");
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.getByText("CPU for gaming PC")).toBeInTheDocument();
      });
      
      await user.keyboard("{Escape}");
      
      await waitFor(() => {
        expect(screen.queryByText("CPU for gaming PC")).not.toBeInTheDocument();
      });
    });
  });

  describe("disabled state", () => {
    it("should disable input when disabled prop is true", () => {
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} disabled />);
      
      const input = screen.getByRole("combobox");
      expect(input).toBeDisabled();
    });

    it("should not show suggestions when disabled", async () => {
      const user = userEvent.setup();
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} disabled />);
      
      const input = screen.getByRole("combobox");
      await user.click(input);
      
      expect(screen.queryByText("CPU for gaming PC")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show loading indicator when isLoading is true", () => {
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} isLoading />);
      
      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });

    it("should disable submit button when loading", () => {
      render(<ChatComboboxInput presets={mockPresets} onSubmit={mockOnSubmit} isLoading />);
      
      const submitButton = screen.getByRole("button", { name: /send/i });
      expect(submitButton).toBeDisabled();
    });
  });
});
