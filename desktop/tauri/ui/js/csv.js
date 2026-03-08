(function (global) {
	'use strict';

	const CSV = {
		toCSV(rows) {
			return rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
		},
		download(content, filename, mimeType) {
			const blob = new Blob([content], { type: mimeType });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		}
	};

	global.CSV = CSV;
})(window);


