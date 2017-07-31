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
			 An example would be "1.5.35",
			 where node id/indexes are put
			 together with "." set as
			 the seperator.
			 */
			highlightedNodePath: {
				type: String,
				value: '',
				observer: 'highlightedNodePathChanged',
				notify: true
			},

			chosenNode: {
				type: Object,
				computed: '_getNode(value)',
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
			 Settable name for property which
			 houses childobjects.
			 */
			childProperty: {
				type: String,
				value: 'children'
			},
			/*
			 Settable property name that
			 searches will be compared too.
			 */
			comparisonProperty: {
				type: String,
				value: 'name'
			},
			/*
			Chosen separator to denote
			navigation path.
			 */
			separatorSign: {
				type: String,
				value: '.'
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
				var results = tree.searchNodes(this.comparisonProperty, inputValue, false, renderedLevel);
				return this._normalizeNodes(results);
			}
			return renderedLevel;
		},
		/**
		 * Focusses the search input.
		 */
		focus: function () {
			this.$.searchInput.inputElement.focus();
		},
		/**
		 * Sets highlightedNodePath if a user selects a node.
		 */
		_nodeSelected: function (e) {
			this.highlightedNodePath = e.model.node.path;
		},
		/**
		 * Returns a node array with the children of the given path.
		 */
		_renderLevel: function (pathLocator, tree) {
			if (!tree) {
				return;
			}
			var node = tree.getNodeByPathLocator(pathLocator),
				children = tree.getChildren(node),
				level = children || _objectValues(node);
			return this._sortNodes(this._normalizeNodes(level));
		},
		/**
		 * Normalizes and returns an Array of nodes
		 * with the properties name, path, sectionName, children
		 */
		_normalizeNodes: function (nodes) { 
			return nodes.map(function (node) {
				var path = node.pathLocator || node.path;
				return {
					name: node[this.comparisonProperty],
					path: path,
					sectionName: this.tree.getPathString(path, this.comparisonProperty),
					children: node[this.childProperty]
				};
			}, this);
		},
		/**
		 * Returns a node based on a given path locator.
		 * If pathLocator is empty or not defined, null gets returned.
		 */
		_getNode: function (pathLocator) {
			if (!pathLocator) {
				return null;
			}
			return this.tree.getNodeByPathLocator(pathLocator);
		},
		_getTreePathParts: function (pathLocator, tree) {
			if (!tree || !pathLocator) {
				return [];
			};
			return this._normalizeNodes(tree.getPathNodes(pathLocator));
		},
		clearSearch: function (event) {
			event.preventDefault();
			event.stopPropagation();
			this.inputValue = '';
		},
		getNodeName: function (node) {
			return node[this.comparisonProperty];
		},
		highlightedNodePathChanged: function (newpath) {
			if (this._searching || newpath === undefined) {
				return;
			}
			var path = newpath.split(this.separatorSign);
			path.pop(); // remove highlighted node
			this._openNodeLevelPath = path.join(this.separatorSign);
		},
		hasChildren: function (node) {
			var children = node[this.childProperty];
			return children && Object.keys(children).length > 0;
		},
		openNode: function (event) {
			this._openNodeLevelPath = event.currentTarget.dataset.path;
			this.inputValue = '';
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
			var hasChildren = function (node) {
				var children = node[this.childProperty];
				return children && Object.keys(children).length > 0;
			}.bind(this);

			inputArray.sort(
				function (a, b) {
					/**
					 * First sort based on "folder" status (containing children)
					 */
					if (hasChildren(a)) {
						if (!hasChildren(b)) {
							return -1;
						}
					} else if (hasChildren(b)) {
						return 1;
					}

					/**
					 * Then sort on comparisonProperty
					 */
					var val1 = a[this.comparisonProperty],
						val2 = b[this.comparisonProperty];

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