(function (global) {
	'use strict';

	/**
	 * Data import/export and backup utilities
	 * @namespace DataIO
	 */
	const DataIO = {
		/**
		 * Download rows as CSV with headers.
		 * @param {string[]} headers
		 * @param {Array<Array<any>>} rows
		 * @param {string} filenameBase
		 */
		downloadCSV(headers, rows, filenameBase) {
			const csv = CSV.toCSV([headers, ...rows]);
			const safeName = filenameBase.toLowerCase().endsWith('.csv') ? filenameBase : `${filenameBase}.csv`;
			const content = '\uFEFF' + csv; // BOM for Excel
			CSV.download(content, safeName, 'text/csv;charset=utf-8');
		},

		/**
		 * Download JSON file helper.
		 * @param {any} data
		 * @param {string} filename
		 */
		downloadJSON(data, filename) {
			const content = JSON.stringify(data, null, 2);
			CSV.download(content, filename, 'application/json');
		}
	};

	global.DataIO = DataIO;
})(window);
