(function () {
	'use strict';

	Polymer({

		behaviors: [
			Cosmoz.TranslatableBehavior
		],
		is: 'cosmoz-treenode-navigator',

		properties: {
			/*
			 * The main node structure
			 */
			tree: {
				type: Cosmoz.tree
			},
			/*
			 * The currently displayed node list
			 */
			dataPlane: {
				type: Array,
				notify: true,
				computed: '_computeDataPlane(_search, searchValue, _renderedLevel, tree)'
			},
			/*
			 * Nodes (children) to be displayed when opening a node
			 */
			_renderedLevel: {
				type: Array,
				computed: '_renderLevel(_openNodePath, tree)'
			},
			/*
			 * The path of the opened node
			 */
			_openNodePath: {
				type: String,
				value: ''
			},
			/*
			 * The nodes on the path of the opened node
			 */
			_nodesOnOpenNodePath: {
				type: Array,
				computed: '_getTreePathParts(_openNodePath, tree)'
			},
			/*
			 * The selected node
			 */
			selectedNode: {
				type: Object,
				computed: '_getNode(nodePath, tree)',
				notify: true
			},
			/*
			 * The path of the selected node
			 * This is the node which was highlighted and after the user tapped the select button
			 */
			nodePath: {
				type: String,
				value: '',
				notify: true,
				observer: '_nodePathChanged'
			},
			/*
			 * The nodes on the path of the selected node
			 */
			nodesOnNodePath: {
				type: Array,
				computed: '_getTreePathParts(nodePath, tree)',
				notify: true
			},
			/*
			 * The highlighted (focused) node
			 * This is the node which is currently selected in the list
			 */
			highlightedNode: {
				type: Object,
				observer: '_highlightedNodeChanged',
			},
			/*
			 * The path string of highlighted (focused) node
			 */
			highlightedNodePath: {
				type: String,
				notify: true
			},
			/*
			 * The search string
			 */
			searchValue: {
				type: String,
				value: ''
			},
			/*
			 * Whether a search should be executed
			 */
			_search: {
				type: Boolean,
				computed: '_computeSearching(searchValue, searchMinLength)'
			},
			/*
			 * Placeholder for search field.
			 */
			searchPlaceholder: {
				type: String,
				value: 'Search'
			},
			/*
			 * Text displayed when local search has finished
			 * to suggest a search on the entire tree
			 */
			searchGlobalPlaceholder: {
				type: String,
				value: 'Click to search again but globally.'
			},
			/*
			 * Minimum length of searchValue to trigger a search
			 */
			searchMinLength: {
				type: Number,
				value: 1
			}
		},
		/**
		 * Focusses the search input.
		 * @return {undefined}
		 */
		focus: function () {
			this.$.searchInput.inputElement.focus();
		},
		/**
		 * Returns the found nodes based on a search string and a given tree to be searched
		 * @param {Boolean} searching - If true, a search should be executed
		 * @param {String} searchString - The search string
		 * @param {Array} renderedLevel - The node list on which the search should be executed
		 * @param {Tree} tree - The main tree
		 * @return {Array} - The found nodes
		 */
		_computeDataPlane: function (searching, searchString, renderedLevel, tree) {
			if (searching) {
				var results = tree.searchNodes(searchString, renderedLevel, false);
				return this._normalizeNodes(results);
			}
			return renderedLevel;
		},
		/**
		 * Returns a node array with the children of a node on the given path
		 * If the node doesn't have children, the node gets returned
		 * @param {String} pathLocator - The separated address parts of a node
		 * @param {Tree} tree - The main tree
		 * @return {Array} - Nodes
		 */
		_renderLevel: function (pathLocator, tree) {
			if (!tree) {
				return;
			}
			var node = tree.getNodeByPathLocator(pathLocator),
				children = tree.getChildren(node),
				level = children || node,
				sortFunc = function (a, b) {
					// First sort based on "folder" status (containing children)
					if (this.hasChildren(a)) {
						if (!this.hasChildren(b)) {
							return -1;
						}
					} else if (this.hasChildren(b)) {
						return 1;
					}
					// Then sort on searchProperty
					var val1 = a[this.tree.searchProperty],
						val2 = b[this.tree.searchProperty];

					if (val1 > val2) {
						return 1;
					}
					if (val1 < val2) {
						return -1;
					}
					return 0;
				}.bind(this);

			return this._normalizeNodes(level).sort(sortFunc);
		},
		/**
		 * Normalizes and returns an Array of nodes
		 * with the properties name, path, sectionName, children
		 * @param {Array} nodes - The input nodes
		 * @return {Array} - The normalized nodes
		 */
		_normalizeNodes: function (nodes) {
			if (!Array.isArray(nodes)){
				return [];
			}
			return nodes.map(function (node) {
				var path = node.pathLocator || node.path;
				return {
					name: node[this.tree.searchProperty],
					path: path,
					sectionName: this.tree.getPathString(path, this.tree.searchProperty),
					children: node[this.tree.childProperty]
				};
			}, this);
		},
		/**
		 * Returns a node based on a given path locator.
		 * If pathLocator is empty or not defined, null gets returned.
		 * @param {String} pathLocator - The separated address parts of a node
		 * @param {Tree} tree - The main tree
		 * @return {Object} - The found node
		 */
		_getNode: function (pathLocator, tree) {
			if (!tree || !pathLocator) {
				return null;
			}
			return this.tree.getNodeByPathLocator(pathLocator);
		},
		/**
		 * Returns the nodes on a path specified by a given path locator
		 * @param {String} pathLocator - The separated address parts of a node
		 * @param {Tree} tree - The main tree
		 * @return {Array} - The found nodes or empty array
		 */
		_getTreePathParts: function (pathLocator, tree) {
			if (!tree || !pathLocator) {
				return [];
			}
			return this._normalizeNodes(tree.getPathNodes(pathLocator));
		},
		/**
		 * Clears the search input
		 * @param {Event} e - The trigger event
		 * @return {undefined}
		 */
		_clearSearch: function (e) {
			e.preventDefault();
			e.stopPropagation();
			this.searchValue = '';
		},
		/**
		 * Returns the name of a given node
		 * @param {Object} node - The node
		 * @return {String} - The name
		 */
		_getNodeName: function (node) {
			return node[this.tree.searchProperty];
		},
		/**
		 * Sets the highlightedNodePath when highlightedNode changed
		 * @param {Object} node - The highlighted node
		 * @return {undefined}
		 */
		_highlightedNodeChanged: function (node) {
			if (!node) {
				this.highlightedNodePath = '';
				return;
			}
			this.highlightedNodePath = node.path;
		},
		/**
		 * Returns true if a given node has children
		 * @param {Object} node - The node
		 * @return {Boolean} - True if node has children
		 */
		hasChildren: function (node) {
			return this.tree.hasChildren(node);
		},
		/**
		 * Opens a node (renderLevel) based on a given path
		 * @param {Event} e - The triggering event
		 * @param {Event} e.currentTarget.dataset.path - The path locator attribute
		 * @return {undefined}
		 */
		openNode: function (e) {
			this._openNodePath = e.currentTarget.dataset.path;
			this.searchValue = '';
			e.currentTarget.parentElement.blur();

			// stop event propagation to prevent iron-list trying to select the current item while it will be removed
			e.preventDefault();
			e.stopPropagation();
		},
		/**
		 * Gets called if the selected node (path) has changed
		 * @param {String} path - The path of the newly selected node
		 * @return {undefined}
		 */
		_nodePathChanged: function (path) {
			if (!path) {
				this.highlightedNodePath = '';
				return;
			}
			this.highlightedNodePath = path;
		},
		/**
		 * Returns true, if the button should be visible
		 * @param {Boolean} searching - If a search is currently executed
		 * @param {String} openNodeLevelPath - The open node level
		 * @return {Boolean} - The visibility of the button
		 */
		_showGlobalSearchBtn: function (searching, openNodeLevelPath) {
			return searching && openNodeLevelPath !== '';
		},
		/**
		 * Triggers a global search
		 * @return {undefined}
		 */
		tryGlobalSearch: function () {
			this._openNodePath = '';
		},
		/**
		 * Returns true, if a search string is eligable to trigger a search
		 * @param {String} value - The search string
		 * @param {Number} searchMinLength - The minimum length of value to be valid
		 * @return {Boolean} - If a search should be triggered
		 */
		_computeSearching: function (value, searchMinLength) {
			return value && value.length >= searchMinLength && value !== '';
		},
		/**
		 * Returns true, if the path of a node should be visible in the view
		 * @param {Boolean} searching - If a search is currently executed
		 * @param {Number} index - The node's current index in the list
		 * @param {Array} dataPlane - The node list
		 * @param {Object} node - The node
		 * @return {Boolean} - If the path should be visible
		 */
		_renderSection: function (searching, index, dataPlane, node) {
			if (!searching || index >= dataPlane.length || !node || !node.sectionName) {
				return false;
			}
			if (index === 0) {
				return true;
			}
			var prevItem = dataPlane[index - 1];
			if (prevItem.sectionName === node) {
				return false;
			}
			return true;
		},
		/**
		 * Triggers a click event on the currentTarget
		 * if space or enter key was pressed
		 * @param {Event} e - The event
		 * @return {undefined}
		 */
		_clickOnEnterOrSpace: function (e) {
			if (e.keyCode === 13 || e.keyCode === 32) {
				// enter or space pressed!
				var fnName = 'click',
					target = e.currentTarget,
					fn = new Function('target', 'fnName', 'return target.' + fnName + '()');
				fn(target, fnName);
			}
		},
		/**
		 * Returns the classes of a row based its selection state
		 * @param {String} classes - The default classes
		 * @param {Boolean} selected - If the row is currently selected
		 * @return {String} - The CSS classes
		 */
		_computeRowClass: function (classes, selected) {
			return selected ? classes + ' selected' : classes;
		},

		_onListTap(e){
			// Prevent iron-list from calling getModelForElement on itself otherwise it triggers a infinite loop
			// because `cosmoz-dialog` weirdly sets dataHost.
			if (e.target && e.target.is === 'iron-list'){
				console.warn('stopImmediatePropagation for tap directly on iron-list');
				e.stopImmediatePropagation();
			}
		}
	});
}());
