/* */
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
				observer: 'highlightedNodePathChanged',
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
		_computeDataPlane: function (searching, inputValue, renderedLevel, openNodeLevelPathParts, tree) {
			if (searching) {
				var results = tree.searchNodes(inputValue, renderedLevel, false);
				return this._normalizeNodes(results);
			}
			return renderedLevel;
		},
		/**
		 * Focusses the search input.
		 * @return {undefined}
		 */
		focus: function () {
			this.$.searchInput.inputElement.focus();
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
				level = children || node;
			return this._sortNodes(this._normalizeNodes(level));
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
			if (!pathLocator || !tree) {
				return null;
			}
			return this.tree.getNodeByPathLocator(pathLocator);
		},
		_getTreePathParts: function (pathLocator, tree) {
			if (!tree || !pathLocator) {
				return [];
			}
			return this._normalizeNodes(tree.getPathNodes(pathLocator));
		},
		clearSearch: function (event) {
			event.preventDefault();
			event.stopPropagation();
			this.inputValue = '';
		},
		getNodeName: function (node) {
			return node[this.tree.searchProperty];
		},
		highlightedNodePathChanged: function (newpath) {
			if (this._searching || newpath === undefined || !this.tree) {
				return;
			}
			var path = newpath.split(this.tree.pathLocatorSeparator);
			path.pop(); // remove highlighted node
			this._openNodeLevelPath = path.join(this.tree.pathLocatorSeparator);
		},
		hasChildren: function (node) {
			return this.tree.hasChildren(node);
		},
		openNode: function (event) {
			this._openNodeLevelPath = event.currentTarget.dataset.path;
			this.inputValue = '';
			event.currentTarget.parentElement.blur();
		},
		_valueChanged: function (path) {
			if (!path) {
				this.highlightedNodePath = '';
				return;
			}
			this.highlightedNodePath = path;
		},
		showGlobalSearch: function (_searching, _openNodeLevelPath) {
			return _searching && _openNodeLevelPath !== '';
		},
		tryGlobalSearch: function () {
			this._openNodeLevelPath = '';
		},
		_computeSearching: function (value, searchMinLength) {
			return value && value.length >= searchMinLength && value !== '';
		},
		_renderSection: function (_searching, index, dataPlane, node) {
			if (!_searching || index >= dataPlane.length || !node || !node.sectionName) {
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
		_sortNodes: function (inputArray) {
			inputArray.sort(
				function (a, b) {
					/**
					 * First sort based on "folder" status (containing children)
					 */
					if (this.hasChildren(a)) {
						if (!this.hasChildren(b)) {
							return -1;
						}
					} else if (this.hasChildren(b)) {
						return 1;
					}

					/**
					 * Then sort on searchProperty
					 */
					var val1 = a[this.tree.searchProperty],
						val2 = b[this.tree.searchProperty];

					if (val1 > val2) {
						return 1;
					}
					if (val1 < val2) {
						return -1;
					}
					return 0;
				}.bind(this)
			);

			return inputArray;
		}
	});
}());