import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenEngine } from "./TokenEngine";

describe("TokenEngine", () => {
  let engine: TokenEngine;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.log to verify it's called with expected arguments
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Create a new TokenEngine instance
    engine = new TokenEngine();
  });

  afterEach(() => {
    // Restore the original console.log
    consoleLogSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should initialize and log a message", () => {
      expect(consoleLogSpy).toHaveBeenCalledWith("TokenEngine initialized");
    });
  });

  describe("processTokens", () => {
    it("should process tokens from a source", () => {
      const source = { type: "figma", url: "https://figma.com/file/123" };
      const result = engine.processTokens(source);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Processing tokens from source:",
        source
      );
      expect(result).toEqual({ processed: true, source });
    });
  });

  describe("transformTokens", () => {
    it("should transform tokens to a specific format", () => {
      const tokens = { color: { primary: "#ff0000" } };
      const format = "css";
      const result = engine.transformTokens(tokens, format);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Transforming tokens to ${format}:`,
        tokens
      );
      expect(result).toEqual({ transformed: true, format, tokens });
    });
  });

  describe("exportTokens", () => {
    it("should export tokens to a destination", () => {
      const tokens = { color: { primary: "#ff0000" } };
      const destination = "./dist/tokens.css";

      engine.exportTokens(tokens, destination);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Exporting tokens to ${destination}:`,
        tokens
      );
    });
  });
});
