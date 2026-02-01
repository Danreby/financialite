import { useCallback } from "react";
import { NUMERIC_NAVIGATION_KEYS, NUMERIC_REGEX } from "@/Constants/keyboardConstants";

export function useNumericInput() {
	return useCallback((event) => {
		if (NUMERIC_NAVIGATION_KEYS.includes(event.key)) {
			return;
		}

		if (!NUMERIC_REGEX.test(event.key)) {
			event.preventDefault();
		}
	}, []);
}


export function useDecimalInput() {
	return useCallback((event) => {
		if (NUMERIC_NAVIGATION_KEYS.includes(event.key)) {
			return;
		}

		if (event.key === "," || event.key === ".") {
			return;
		}

		if (!NUMERIC_REGEX.test(event.key)) {
			event.preventDefault();
		}
	}, []);
}
