(function (global) {
	'use strict';

	/**
	 * Collateral items DOM management
	 * @namespace Collateral
	 */
	const Collateral = {
		/** Reset collateral items container to one empty item and wire events */
		reset() {
			const container = document.getElementById('collateral-items-container');
			if (!container) return;
			container.innerHTML = `
				<div class="collateral-item" data-item-index="0">
					<div class="collateral-item-header">
						<h4>Item 1</h4>
						<button type="button" class="btn btn-danger btn-sm remove-collateral-item" style="display: none;">
							<i class="fas fa-trash"></i> Remove
						</button>
					</div>
					<div class="collateral-fields">
						<div class="form-group">
							<label>Item Name *</label>
							<input type="text" class="collateral-item-name" placeholder="e.g., Gold Chain, Silver Ring" required>
						</div>
						<div class="form-group">
							<label>Metal Type *</label>
							<select class="collateral-metal-type" required>
								<option value="">Select Metal</option>
								<option value="gold">Gold</option>
								<option value="silver">Silver</option>
							</select>
						</div>
						<div class="form-group">
							<label>Weight (grams) *</label>
							<input type="number" class="collateral-weight" step="0.01" placeholder="e.g., 10.5" required>
						</div>
						<div class="form-group">
							<label>Purity (%) *</label>
							<input type="number" class="collateral-purity" step="0.01" placeholder="e.g., 91.6" required>
						</div>
					</div>
				</div>
			`;
			this.updateNumbers();
			this.wireEvents();
		},

		/** Append a new collateral item row */
		add() {
			const container = document.getElementById('collateral-items-container');
			if (!container) return;
			const itemCount = container.children.length;
			const newItem = document.createElement('div');
			newItem.className = 'collateral-item';
			newItem.dataset.itemIndex = itemCount;
			newItem.innerHTML = `
				<div class="collateral-item-header">
					<h4>Item ${itemCount + 1}</h4>
					<button type="button" class="btn btn-danger btn-sm remove-collateral-item">
						<i class="fas fa-trash"></i> Remove
					</button>
				</div>
				<div class="collateral-fields">
					<div class="form-group">
						<label>Item Name *</label>
						<input type="text" class="collateral-item-name" placeholder="e.g., Gold Chain, Silver Ring" required>
					</div>
					<div class="form-group">
						<label>Metal Type *</label>
						<select class="collateral-metal-type" required>
							<option value="">Select Metal</option>
							<option value="gold">Gold</option>
							<option value="silver">Silver</option>
						</select>
					</div>
					<div class="form-group">
						<label>Weight (grams) *</label>
						<input type="number" class="collateral-weight" step="0.01" placeholder="e.g., 10.5" required>
					</div>
					<div class="form-group">
						<label>Purity (%) *</label>
						<input type="number" class="collateral-purity" step="0.01" placeholder="e.g., 91.6" required>
					</div>
				</div>
			`;
			container.appendChild(newItem);
			this.updateNumbers();
			this.wireEvents();
		},

		/** Remove an item element and renumber */
		remove(itemElement) {
			const container = document.getElementById('collateral-items-container');
			if (!container || container.children.length <= 1) return;
			itemElement.remove();
			this.updateNumbers();
			this.wireEvents();
		},

		/** Update headers and button visibility */
		updateNumbers() {
			const container = document.getElementById('collateral-items-container');
			if (!container) return;
			const items = container.querySelectorAll('.collateral-item');
			items.forEach((item, index) => {
				const header = item.querySelector('.collateral-item-header h4');
				header.textContent = `Item ${index + 1}`;
				item.dataset.itemIndex = index;
				const removeBtn = item.querySelector('.remove-collateral-item');
				removeBtn.style.display = items.length > 1 ? 'block' : 'none';
			});
		},

		/** Wire remove buttons without duplicating handlers */
		wireEvents() {
			const buttons = document.querySelectorAll('.remove-collateral-item');
			buttons.forEach(btn => {
				const clone = btn.cloneNode(true);
				btn.replaceWith(clone);
				clone.addEventListener('click', (e) => {
					const itemElement = e.target.closest('.collateral-item');
					if (itemElement) Collateral.remove(itemElement);
				});
			});
		},

		/** Collect valid collateral items from DOM */
		collect() {
			const items = [];
			const container = document.getElementById('collateral-items-container');
			if (!container) return items;
			const itemElements = container.querySelectorAll('.collateral-item');
			itemElements.forEach(item => {
				const name = item.querySelector('.collateral-item-name').value.trim();
				const metalType = item.querySelector('.collateral-metal-type').value;
				const weight = parseFloat(item.querySelector('.collateral-weight').value);
				const purity = parseFloat(item.querySelector('.collateral-purity').value);
				if (name && metalType && !isNaN(weight) && !isNaN(purity)) {
					const netWeight = weight * (purity / 100);
					items.push({ name, metalType, weight, purity, netWeight });
				}
			});
			return items;
		},

		/** Populate DOM with provided collateral items */
		populate(collateralItems) {
			if (!collateralItems || collateralItems.length === 0) {
				return this.reset();
			}
			const container = document.getElementById('collateral-items-container');
			if (!container) return;
			container.innerHTML = '';
			collateralItems.forEach((item, index) => {
				const el = document.createElement('div');
				el.className = 'collateral-item';
				el.dataset.itemIndex = index;
				el.innerHTML = `
					<div class="collateral-item-header">
						<h4>Item ${index + 1}</h4>
						<button type="button" class="btn btn-danger btn-sm remove-collateral-item" ${collateralItems.length > 1 ? '' : 'style="display: none;"'}>
							<i class="fas fa-trash"></i> Remove
						</button>
					</div>
					<div class="collateral-fields">
						<div class="form-group">
							<label>Item Name *</label>
							<input type="text" class="collateral-item-name" value="${item.name}" required>
						</div>
						<div class="form-group">
							<label>Metal Type *</label>
							<select class="collateral-metal-type" required>
								<option value="">Select Metal</option>
								<option value="gold" ${item.metalType === 'gold' ? 'selected' : ''}>Gold</option>
								<option value="silver" ${item.metalType === 'silver' ? 'selected' : ''}>Silver</option>
							</select>
						</div>
						<div class="form-group">
							<label>Weight (grams) *</label>
							<input type="number" class="collateral-weight" step="0.01" value="${item.weight}" required>
						</div>
						<div class="form-group">
							<label>Purity (%) *</label>
							<input type="number" class="collateral-purity" step="0.01" value="${item.purity}" required>
						</div>
					</div>
				`;
				container.appendChild(el);
			});
			this.wireEvents();
		}
	};

	global.Collateral = Collateral;
})(window);
