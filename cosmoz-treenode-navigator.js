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
			data: {
				type: Object
			},
			dataPlane: {
				type: Array,
				computed: '_computeDataPlane(inputValue, _renderedLevel)',
				notify: true
			},
			_renderedLevel: {
				type: Array,
				computed: '_renderLevel(_openNodeLevelPath, data)'
			},
			_openNodeLevelPath: {
				type: String,
				value: ''
			},
			_openNodeLevelPathParts: {
				type: Array,
				computed: '_getPathParts(_openNodeLevelPath, data)'
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
				computed: '_getPathParts(value, data)',
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
				computed: '_getNode(value, data)',
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
				computed: '_computeSearching(inputValue)'
			},
			/*
			 Text bound value container.
			 Is set by other values.
			 */
			_searchText: {
				type: String,
				computed: '_computeSearchText(_searching, _openNodeLevelPath)'
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
				value: 2
			}
		},
		_computeSearchText: function (searching, path) {

			if (!searching) {
				return this.localSearchDoneText;
			}

			if (path === '') {
				return this.resetText;
			}

			return this.localSearchDoneText;
		},
		_computeDataPlane: function (inputValue, renderedLevel) {
			if (inputValue.length >= this.searchMinLength) {
				return this.searchHandler(inputValue, renderedLevel);
			}
			return this._renderedLevel;
		},
		_renderLevel: function (pl, nodes) {
			var node = this._getNode(pl, nodes),
				children = nodes,
				childPath,
				level;

			if (node) {
				children = node[this.childProperty];
			}

			level = Object.keys(children).map(function (childKey) {
				var child = children[childKey];
				if (pl === '') {
					childPath = childKey;
				} else {
					childPath = pl + this.separatorSign + childKey;
				}
				return {
					id: childKey,
					name: child[this.comparisonProperty],
					path: childPath,
					children: child[this.childProperty]
				};
			}, this);

			this._sortItOut(level);
			return level;
		},
		_getPathParts: function (value, data) {
			var path = value.split(this.separatorSign),
				parts = [],
				newpath = [];

			path.some(function (part) {
				newpath.push(part);
				var newPathString = newpath.join(this.separatorSign),
					node = this._getNode(newPathString, data);
				if (!node) {
					return true;
				}
				node.path = newPathString;
				parts.push(node);
			}, this);

			return parts;
		},
		_getNode: function (pl, nodes) {
			var children = nodes,
				path = pl.split(this.separatorSign),
				nodeOnPath = null;

			/* nodeOnPath[this.childProperty] = children;
			nodeOnPath[this.comparisonProperty] = 'Root node'; */

			path.some(function (key) {
				if (key === '') {
					return true;
				}
				nodeOnPath = children[key];
				if (!nodeOnPath) {
					console.error('Children/path doesnt exist for the given nodes at least', path, children, key);
					return true;
				}
				children = nodeOnPath[this.childProperty];
			}, this);

			return nodeOnPath;
		},
		getNodeName: function (node) {
			return node[this.comparisonProperty];
		},
		highlightedNodePathChanged: function (newpath) {
			if (this._searching) {
				return;
			}
			var path = newpath.split(this.separatorSign);
			path.pop(); // remove highlighted node
			this._openNodeLevelPath = path.join(this.separatorSign);
		},
		searchHandler: function (searchWord, renderedLevel) {
			var parentStat = {
				sectionName: '',
				currentPath: ''
			};

			return this.searchAllBranches(searchWord, parentStat, renderedLevel);
		},
		searchAllBranches: function (searchWord, parentStat, nodeList) {
			var localPath = parentStat.currentPath,
				localSection = parentStat.sectionName,
				results = [];
			if (parentStat.currentPath !== '') {
				localPath += this.separatorSign;
				localSection += ' / ';
			}
			nodeList.forEach(function (node) {
				if (node.name.toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
					node.sectionName = localSection;
					node.path = localPath + node.id;
					results.push(node);
				}
			});
			nodeList.forEach(function (node) {
				var children = node[this.childProperty];
				if (children) {
					parentStat.sectionName = localSection + node.name;
					parentStat.currentPath = localPath + node.id;
					results = results.concat(this.searchAllBranches(searchWord, parentStat, this._renderLevel('', children)));
				}
			}, this);
			return results;
		},
		hasChildren: function (node) {
			var children = node.children;
			return children && Object.keys(children).length > 0;
		},
		openNode: function (event) {
			event.path.some(function (element, index) {
				var path = element.dataset.path; 
				if (path !== undefined) {
					this._openNodeLevelPath = path;
					return true;
				} else if (index > 3) {
					return true;
				}
			}, this);

			this.inputValue = '';
		},
		_valueChanged: function (path) {
			if (!path) {
				this.highlightedNodePath = '';
				return;
			}
			this.highlightedNodePath = path;
		},
		tryGlobalSearch: function () {
			this._openNodeLevelPath = '';
		},
		_computeSearching: function (value) {
			return value && value !== '';
		},
		_renderSection: function (_searching, index, dataPlane) {
			if (!_searching || index >= dataPlane.length) {
				return false;
			}
			if (index === 0) {
				return true;
			}
			var prevItem = dataPlane[index - 1],
				currentItem = dataPlane[index];
			if (prevItem.sectionName === currentItem.sectionName) {
				return false;
			}
			return true;
		},
		_sortItOut: function (inputArray) {
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