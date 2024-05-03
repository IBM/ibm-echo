import { useEffect, useState } from "react";

export const debounce = (value, delay) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const setValue = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(setValue);
		};
	}, [value, delay]);
	return debouncedValue;
};
