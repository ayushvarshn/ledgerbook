(function (global) {
	'use strict';

	const DataIO = {
		downloadCSV(headers, rows, filenameBase) {
			const csv = CSV.toCSV([headers, ...rows]);
			const safeName = filenameBase.toLowerCase().endsWith('.csv') ? filenameBase : `${filenameBase}.csv`;
			const content = '\uFEFF' + csv;
			CSV.download(content, safeName, 'text/csv;charset=utf-8');
		},
		downloadJSON(data, filename) {
			const content = JSON.stringify(data, null, 2);
			CSV.download(content, filename, 'application/json');
		}
	};

	global.DataIO = DataIO;
})(window);


