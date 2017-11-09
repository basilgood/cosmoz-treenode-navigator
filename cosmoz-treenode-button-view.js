(function () {
	'use strict';

	Polymer({
		behaviors: [
			Cosmoz.TranslatableBehavior
		],

		is: 'cosmoz-treenode-button-view',

		properties: {
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
				value: function (){
					return {};
				},
				notify: true
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
				value: 'No selection made'
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
		},
		_enableReset: function (nodePath, noReset) {
			if (noReset) {
				return false;
			}
			return !!nodePath;
		},
		_getButtonLabel: function (pathParts, placeholder) {
			if (!Array.isArray(pathParts) || pathParts.length === 0) {
				return placeholder;
			}
			return pathParts.map(part => part[this.tree.searchProperty]).join(' / ');
		},

		_hasPath: function (nodePath, pathParts){
			return !!nodePath && Array.isArray(pathParts) && pathParts.length > 0;
		},

		openDialogTree: function () {
			this.$.dialogTree.open();
		},
		focusSearch: function () {
			this.$.dialogTree.paperDialog.querySelector('#treeNavigator').focus();
		},
		reset: function () {
			this.nodePath = '';
		},
		selectNode: function () {
			this.nodePath = this.highlightedNodePath;
		},
		refit: function () {
			this.debounce('refit', function () {
				this.$.dialogTree.fit();
			}.bind(this), 50); // 5 was enough during test
		}
	});
}());
