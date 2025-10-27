(function (global) {
	'use strict';

	/**
	 * CSV conversion and file download utilities
	 * @namespace CSV
	 */
	const CSV = {
		/**
		 * Convert an array of rows (array of values) to CSV text with quoting.
		 * @param {Array<Array<any>>} rows
		 * @returns {string}
		 */
		toCSV(rows) {
			return rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
		},

		/**
		 * Download content as a file with the given mime type.
		 * @param {string} content
		 * @param {string} filename
		 * @param {string} mimeType
		 */
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
