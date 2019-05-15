/*global Cosmoz,Polymer*/
(() => {
	'use strict';

	class CosmozTreenodeButtonView extends Cosmoz.Mixins.translatable(Polymer.Element) {
		static get is() {
			return 'cosmoz-treenode-button-view';
		}
		static get properties() {
			return {

				multiSelection: {
					type: Boolean,
					value: false
				},
				/*
				* The main node structure
				*/
				tree: {
					type: Cosmoz.tree
				},
				/*
				* Currently selected node object
				*/
				selectedNode: {
					type: Object,
					value() {
						return {};
					},
					notify: true
				},
				/**
				 * Selected nodes
				 */
				selectedNodes: {
					type: Array,
					notify: true,
					value: () => []
				},
				/**
				 * If true, reset button gets hidden
				 */
				noReset: {
					type: Boolean,
					value: false
				},
				/*
				* Placeholder for the search field
				*/
				searchPlaceholder: {
					type: String
				},
				/*
				* Placeholder for button text
				*/
				buttonTextPlaceholder: {
					type: String,
					computed: 'getButtonTextPlaceholder(multiSelection)'
				},
				/*
				* The path of the selected node
				*/
				nodePath: {
					type: String,
					notify: true
				},
				/*
				* The nodes on the path of the selected node
				*/
				nodesOnNodePath: {
					type: Array
				},
				/*
				* Text displayed when local search has finished
				* to suggest a search on the entire tree
				*/
				searchGlobalPlaceholder: {
					type: String
				},
				/*
				* Settable text for dialog title.
				*/
				dialogText: {
					type: String,
					value: 'Search or navigate to chosen destination'
				},
				/*
				* Minimum length before an search
				* starts.
				*/
				searchMinLength: {
					type: Number
				},
				/*
				* Path string of highlighted (focused) node
				*/
				highlightedNodePath: {
					type: String
				}
			};
		}
		/**
		 * Event handler for node chip removal button, removes a node chip.
		 * @param {object} event Polymer event object.
		 * @returns {void}
		 */
		_clearItemSelection(event) {
			let item = event.model.item,
				selectedIndex = this.selectedNodes.indexOf(item);

			// This will remove from the DOM the source element of the processed event ...
			this.splice('selectedNodes', selectedIndex, 1);
			// ... so we must prevent further propagation of this event, because its source is now invalid.
			// (This has caused troubles in app-drawer-layout click event handler).
			event.preventDefault();
			event.stopPropagation();
		}
		/**
		 * Get a text label for the node selection button.
		 * @param {boolean} multiSelection Multi selection setting.
		 * @returns {string} Text label.
		 */
		getButtonTextPlaceholder(multiSelection) {
			return multiSelection ? this._('Select a node') : this._('No selection made');
		}
		/**
		 * Whether the reset button should be enabled or not.
		 * @param {string} nodePath Node path to check.
		 * @param {boolean} noReset Bypass to force disabled.
		 * @returns {boolean} Whether the button should be enabled or not.
		 */
		_enableReset(nodePath, noReset) {
			if (noReset) {
				return false;
			}
			return !!nodePath;
		}
		/**
		 * Get a button label based on path parts or a placeholder.
		 * @param {array} pathParts Nodes on the node path.
		 * @param {string} placeholder Replacement placeholder if no nodes are available.
		 * @returns {string} Button label.
		 */
		_getButtonLabel(pathParts, placeholder) {
			if (!Array.isArray(pathParts) || pathParts.length === 0) {
				return placeholder;
			}
			return pathParts.filter(n => n).map(part => part[this.tree.searchProperty]).join(' / ');
		}
		/**
		 * Get text from a node to set on a node chip.
		 * @param {object} node Node to get text from.
		 * @returns {string} Chip text.
		 */
		_getChipText(node) {
			return node.name;
		}
		/**
		 * Open the treenode navigator dialog.
		 * @returns {void}
		 */
		openDialogTree() {
			this.$.dialogTree.open();
		}
		/**
		 * Focus on the treenode navigator in the treenode navigator dialog.
		 * @returns {void}
		 */
		focusSearch() {
			this.$.dialogTree.paperDialog.querySelector('#treeNavigator').focus();
		}
		/**
		 * Reset the component to make it ready for reuse
		 * @returns {void}
		 */
		reset() {
			this.nodePath = '';
			this.selectedNodes = [];
		}
		/**
		 * Select the node in the treenode navigator.
		 * @returns {void}
		 */
		selectNode() {
			// nodePath selects the node, without it no selectedNode
			this.nodePath = this.highlightedNodePath;
			if (this.multiSelection) {
				if (!this.selectedNodes.some(node => node.pathLocator === this.highlightedNodePath)) {
					this.push('selectedNodes', this.selectedNode);
				}
				this.nodePath = '';
				this.selectedNode = {};
			}
		}
		/**
		 * Selects node and closes the dialog
		 * @returns {void}
		 */
		_selectNodeAndCloseDialog() {
			this.selectNode();
			this.$.dialogTree.close();
		}
		/**
		 * Determine if selected nodes container should be visible or not.
		 * @param {boolean} multiSelection Multi selection setting.
		 * @param {number} selectedNodesLength Selected nodes quantity.
		 * @returns {boolean} Whether the selected nodes container should be visible or not.
		 */
		_showSelectedNodes(multiSelection, selectedNodesLength) {
			return	multiSelection && selectedNodesLength > 0;
		}
		/**
		 * Callback event handler to refit the treenode navigator dialog when
		 * data plane has changed.
		 * @returns {void}
		 */
		refit() {
			this._debouncer = Polymer.Debouncer.debounce(this._debouncer,
				Polymer.Async.timeOut.after(50), // 5 was enough during test
				() => {
					this.$.dialogTree.fit();
				});
		}
	}
	customElements.define(CosmozTreenodeButtonView.is, CosmozTreenodeButtonView);
})();