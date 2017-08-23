/**
 * The Cosmoz.DefaultTree implementation of a tree.
 * @typedef {object} Tree
 */
(function () {
	'use strict';

	Polymer({

		behaviors: [
			Cosmoz.TranslatableBehavior
		],
		is: 'cosmoz-treenode-navigator',

		properties: {
			/*
			Node structure object
			that component is given
			 */
			tree: {
				type: Cosmoz.tree
			},
			dataPlane: {
				type: Array,
				notify: true,
				computed: '_computeDataPlane(_searching, inputValue, _renderedLevel, _openNodeLevelPathParts, tree)'
			},
			_renderedLevel: {
				type: Array,
				computed: '_renderLevel(_openNodeLevelPath, tree)'
			},
			_openNodeLevelPath: {
				type: String,
				value: ''
			},
			_openNodeLevelPathParts: {
				type: Array,
				computed: '_getTreePathParts(_openNodeLevelPath, tree)'
			},
			/*
			 path value
			 */
			value: {
				type: String,
				value: '',
				notify: true,
				observer: '_valueChanged'
			},

			valuePathParts: {
				type: Array,
				computed: '_getTreePathParts(value, tree)',
				notify: true
			},
			/*
			 Current path to displayed
			 node/folder. That is an
			 "address" to the node.
			 */
			highlightedNodePath: {
				type: String,
				value: '',
				observer: '_highlightedNodePathChanged',
				notify: true
			},

			chosenNode: {
				type: Object,
				computed: '_getNode(value, tree)',
				notify: true
			},
			/*
			Placeholder for search field.
			 */
			searchPlaceholder: {
				type: String,
				value: 'Search'
			},
			/*
			Input value for searches
			 */
			inputValue: {
				type: String,
				value: ''
			},
			/*
			 Whether an search has been done.
			 */
			_searching: {
				type: Boolean,
				computed: '_computeSearching(inputValue, searchMinLength)'
			},
			/*
			 Settable text given to user
			 when local search has
			 been done.
			 */
			localSearchDoneText: {
				type: String,
				value: 'Click to search again but globally.'
			},
			/*
			Settable text given to user
			when after an global search.
			*/
			resetText: {
				type: String,
				value: 'Click to reset.'
			},
			/*
			Minimum length before an search
			starts.
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
		 * @param {Array} openNodeLevelPathParts - openNodeLevelPathParts
		 * @param {Tree} tree - The main tree
		 * @return {Array} - The found nodes
		 */
		_computeDataPlane: function (searching, searchString, renderedLevel, openNodeLevelPathParts, tree) {
			if (searching) {
				var results = tree.searchNodes(searchString, renderedLevel, false);
				return this._normalizeNodes(results);
			}
			return renderedLevel;
		},
		/**
		 * Sets highlightedNodePath if a user selects a node.
		 * @param {Event} e - Event
		 * @return {undefined}
		 */
		_nodeSelected: function (e) {
			this.highlightedNodePath = e.model.node.path;
		},
		/**
		 * Returns a node array with the children of the given path.
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
			this.inputValue = '';
		},
		/**
		 * Returns the name of a given node
		 * @param {Object} node - The node
		 * @return {String} - The name
		 */
		_getNodeName: function (node) {
			return node[this.tree.searchProperty];
		},
		_highlightedNodePathChanged: function (newpath) {
			if (this._searching || newpath === undefined || !this.tree) {
				return;
			}
			var path = newpath.split(this.tree.pathLocatorSeparator);
			path.pop(); // remove highlighted node
			this._openNodeLevelPath = path.join(this.tree.pathLocatorSeparator);
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
		 * Sets the render level to the node of a given path
		 * @param {Event} e - The triggering event
		 * @param {Event} e.currentTarget.dataset.path - The path locator attribute
		 * @return {undefined}
		 */
		openNode: function (e) {
			this._openNodeLevelPath = e.currentTarget.dataset.path;
			this.inputValue = '';
			e.currentTarget.parentElement.blur();
		},
		_valueChanged: function (path) {
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
			this._openNodeLevelPath = '';
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
		}
	});
}());