/**
 * Coerces a string value to a boolean.
 * Returns true for "1", "true", "yes", "on" (case-insensitive).
 * Returns false for all other non-empty strings.
 * Returns undefined if the value is undefined or empty.
 */
export function coerceBoolean(value?: string): boolean | undefined {
	if (value === undefined || value === "") {
		return undefined
	}

	return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

/**
 * Checks if a string value is truthy.
 * Returns true for "1", "true", "yes", "on" (case-insensitive).
 * Returns false for undefined, empty strings, or any other value.
 */
export function isTruthy(value: string | undefined): boolean {
	if (!value) {
		return false
	}
	return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}
