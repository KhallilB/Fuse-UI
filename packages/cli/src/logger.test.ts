import { beforeEach, describe, expect, it, vi } from "vitest"
import { createLogger, type Logger } from "./logger"

describe("createLogger", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>
	let consoleDebugSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
		consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
		consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {})
	})

	it("creates a logger with debug disabled by default", () => {
		const logger = createLogger()

		logger.info("test info")
		logger.warn("test warn")
		logger.error("test error")
		logger.debug("test debug")

		expect(consoleLogSpy).toHaveBeenCalledWith("[fuseui:info] test info")
		expect(consoleWarnSpy).toHaveBeenCalledWith("[fuseui:warn] test warn")
		expect(consoleErrorSpy).toHaveBeenCalledWith("[fuseui:error] test error")
		expect(consoleDebugSpy).not.toHaveBeenCalled()
	})

	it("creates a logger with debug enabled", () => {
		const logger = createLogger({ debug: true })

		logger.info("test info")
		logger.warn("test warn")
		logger.error("test error")
		logger.debug("test debug")

		expect(consoleLogSpy).toHaveBeenCalledWith("[fuseui:info] test info")
		expect(consoleWarnSpy).toHaveBeenCalledWith("[fuseui:warn] test warn")
		expect(consoleErrorSpy).toHaveBeenCalledWith("[fuseui:error] test error")
		expect(consoleDebugSpy).toHaveBeenCalledWith("[fuseui:debug] test debug")
	})

	it("creates a logger with debug explicitly disabled", () => {
		const logger = createLogger({ debug: false })

		logger.debug("test debug")

		expect(consoleDebugSpy).not.toHaveBeenCalled()
	})

	it("formats messages with correct prefixes", () => {
		const logger = createLogger({ debug: true })

		logger.info("info message")
		logger.warn("warn message")
		logger.error("error message")
		logger.debug("debug message")

		expect(consoleLogSpy).toHaveBeenCalledWith("[fuseui:info] info message")
		expect(consoleWarnSpy).toHaveBeenCalledWith("[fuseui:warn] warn message")
		expect(consoleErrorSpy).toHaveBeenCalledWith("[fuseui:error] error message")
		expect(consoleDebugSpy).toHaveBeenCalledWith("[fuseui:debug] debug message")
	})

	it("calls correct console methods", () => {
		const logger = createLogger({ debug: true })

		logger.info("info")
		logger.warn("warn")
		logger.error("error")
		logger.debug("debug")

		expect(consoleLogSpy).toHaveBeenCalledTimes(1)
		expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
		expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
	})

	it("handles empty messages", () => {
		const logger = createLogger({ debug: true })

		logger.info("")
		logger.warn("")
		logger.error("")
		logger.debug("")

		expect(consoleLogSpy).toHaveBeenCalledWith("[fuseui:info] ")
		expect(consoleWarnSpy).toHaveBeenCalledWith("[fuseui:warn] ")
		expect(consoleErrorSpy).toHaveBeenCalledWith("[fuseui:error] ")
		expect(consoleDebugSpy).toHaveBeenCalledWith("[fuseui:debug] ")
	})

	it("handles multiple log calls", () => {
		const logger = createLogger({ debug: true })

		logger.info("message 1")
		logger.info("message 2")
		logger.warn("warning 1")
		logger.error("error 1")

		expect(consoleLogSpy).toHaveBeenCalledTimes(2)
		expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
		expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
	})

	it("returns a logger with all required methods", () => {
		const logger = createLogger()

		expect(logger).toHaveProperty("info")
		expect(logger).toHaveProperty("warn")
		expect(logger).toHaveProperty("error")
		expect(logger).toHaveProperty("debug")
		expect(typeof logger.info).toBe("function")
		expect(typeof logger.warn).toBe("function")
		expect(typeof logger.error).toBe("function")
		expect(typeof logger.debug).toBe("function")
	})
})
