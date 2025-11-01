(function(global) {
	function normalize(value) {
		return String(value == null ? '' : value).trim().toLowerCase();
	}

	function applyFilters(data, filterSpecs) {
		// filterSpecs: [{ inputId, accessor(row) => string }]
		const compiled = filterSpecs.map(spec => {
			const el = document.getElementById(spec.inputId);
			return { query: normalize(el ? el.value : ''), accessor: spec.accessor };
		});
		return data.filter(row => {
			for (let i = 0; i < compiled.length; i++) {
				const q = compiled[i].query;
				if (!q) continue;
				const value = normalize(compiled[i].accessor(row));
				if (!value.includes(q)) return false;
			}
			return true;
		});
	}

	function wireInputs(inputIds, onChange) {
		inputIds.forEach(id => {
			const el = document.getElementById(id);
			if (el) {
				el.addEventListener('input', onChange);
			}
		});
	}

	function clearInputs(inputIds) {
		inputIds.forEach(id => {
			const el = document.getElementById(id);
			if (el) el.value = '';
		});
	}

	global.TableFiltering = { applyFilters, wireInputs, clearInputs };
})(window);
