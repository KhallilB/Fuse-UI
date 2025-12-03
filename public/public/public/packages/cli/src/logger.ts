export interface Logger {
	info(message: string): void
	warn(message: string): void
	error(message: string): void
	debug(message: string): void
}

export interface LoggerOptions {
	debug?: boolean
}

export function createLogger(options: LoggerOptions = {}): Logger {
	const debugEnabled = Boolean(options.debug)

	const prefix = (level: string, message: string): string =>
		`[fuseui:${level}] ${message}`

	return {
		info(message) {
			console.log(prefix("info", message))
		},
		warn(message) {
			console.warn(prefix("warn", message))
		},
		error(message) {
			console.error(prefix("error", message))
		},
		debug(message) {
			if (!debugEnabled) {
				return
			}
			console.debug(prefix("debug", message))
		},
	}
}
