(function (global) {
	'use strict';

	/**
	 * IndexedDB simple key-value wrapper for the app
	 * Store name: 'kv', keyPath: 'key'
	 * @namespace DB
	 */
	const DB = {
		_dbPromise: null,

		/** Open (or reuse) the database */
		open() {
			if (this._dbPromise) return this._dbPromise;
			this._dbPromise = new Promise((resolve, reject) => {
				const request = indexedDB.open('ledgerbook', 1);
				request.onupgradeneeded = (event) => {
					const db = event.target.result;
					if (!db.objectStoreNames.contains('kv')) {
						db.createObjectStore('kv', { keyPath: 'key' });
					}
				};
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
			return this._dbPromise;
		},

		/** Get a value by key */
		async get(key) {
			const db = await this.open();
			return new Promise((resolve, reject) => {
				const tx = db.transaction('kv', 'readonly');
				const store = tx.objectStore('kv');
				const req = store.get(key);
				req.onsuccess = () => resolve(req.result ? req.result.value : null);
				req.onerror = () => reject(req.error);
			});
		},

		/** Set a value by key */
		async set(key, value) {
			const db = await this.open();
			return new Promise((resolve, reject) => {
				const tx = db.transaction('kv', 'readwrite');
				const store = tx.objectStore('kv');
				store.put({ key, value });
				tx.oncomplete = () => resolve(true);
				tx.onerror = () => reject(tx.error);
			});
		},

		/** Set multiple keys */
		async bulkSet(entries) {
			const db = await this.open();
			return new Promise((resolve, reject) => {
				const tx = db.transaction('kv', 'readwrite');
				const store = tx.objectStore('kv');
				for (const [key, value] of entries) {
					store.put({ key, value });
				}
				tx.oncomplete = () => resolve(true);
				tx.onerror = () => reject(tx.error);
			});
		}
	};

	global.DB = DB;
})(window);
