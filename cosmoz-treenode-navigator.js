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
				value: function() { return []; },
				notify: true,
				computed: '_computeDataPlane(_searching, inputValue, _renderedLevel, _openNodeLevelPathParts, data)'
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
				computed: '_getTreePathParts(_openNodeLevelPath, data)'
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
				computed: '_getTreePathParts(value, data)',
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

		_computeDataPlane: function (searching, inputValue, renderedLevel, openNodeLevelPathParts, data) {
			if (searching) {
				return this.searchAllBranches(inputValue, openNodeLevelPathParts, renderedLevel, data);
			}
			return renderedLevel;
		},

		/**
		 * Focusses the search input.
		 */
		focus: function() {
			this.$.searchInput.inputElement.focus();
		},

		/**
		 * Sets highlightedNodePath if a user selects a node.
		 */
		_nodeSelected: function(e) {
			this.highlightedNodePath = e.currentTarget.locationPath;
		},

		/**
		 * Returns a node array with the children of the given path.
		 */
		_renderLevel: function (pl, nodes) {
			var pathSegment = nodes,
				node,
				level = [];

			if (pl==='' || typeof pl=== 'undefined') {
				// Return the formatted root nodes.
				level = Object.keys(nodes).map(function (key) {
					node = nodes[key];
					return {
						id: key,
						name: node[this.comparisonProperty],
						path: node.pathLocator,
						children: node[this.childProperty]
					};
				}.bind(this));
			} else {
				var pathArray = pl.split(this.separatorSign),
					child,
					children;

				pathArray.forEach(function(pathKey, i, arr) {
					node = pathSegment[pathKey];
					children = node[this.childProperty];

					if (i == arr.length-1) {
						level = Object.keys(children).map(function (childKey) {
							child = children[childKey];
							return {
								id: child.key,
								name: child[this.comparisonProperty],
								path: child.pathLocator,
								children: child[this.childProperty]
							};
						}.bind(this));
					} else {
						pathSegment = children;
					}
				    
				}.bind(this));
			}

			this._sortItOut(level);
			return level;
		},

		/**
		 * Returns an Array of nodes on a given path.
		 */
		_getNodesOnPath: function(pl, nodes) {
			var path = pl.split(this.separatorSign),
				pathSegment = nodes,
				nodesOnPath = [],
				node,
				children;

			path.forEach(function(nodeKey) {
				node = pathSegment[nodeKey];
				node['key'] = nodeKey;
			    nodesOnPath.push(node);
			    children = node[this.childProperty];
			    if (node && typeof children !== 'undefined' && Object.keys(children).length > 0) {
					pathSegment = node[this.childProperty];
				}
			}.bind(this));

			return nodesOnPath;
		},

		/**
		 * Returns a node based on a given path locator.
		 */
		_getNode: function(pl, nodes) {
			if (!pl || pl === '' || pl === null) {
				return null;
			}
			var pathArray = pl.split(this.separatorSign),
				pathSegment = nodes,
				node,
				children;
			
			pathArray.forEach(function(path) {
				node = pathSegment[path];
				if (typeof node !== 'undefined') {
					children = node[this.childProperty];
					if (typeof children !== 'undefined' && Object.keys(children).length > 0) {
						pathSegment = node[this.childProperty];
					}
				} else {
					console.error('Path does not exist.', pathArray, path, nodes);
				}
			}.bind(this));

			return node;
		},

		_getTreePathParts: function (value, data) {
			if (value === null) {
				value = '';
			}
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

		clearSearch: function (event) {
			event.preventDefault();
			event.stopPropagation();
			this.inputValue = '';
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

		searchAllBranches: function (searchWord, pathPartsRaw, nodeList, data) {
			var results = [];
			this._findInNodes(nodeList, searchWord, this.comparisonProperty, results, this.childProperty, data);			
			return results;
		},

		_getPathString: function(pl, nodeList) {
			var nodesOnPath = this._getNodesOnPath(pl, nodeList);
			var path = '';
			nodesOnPath.forEach(function(node) {
				path += node[this.comparisonProperty] + '/';
			}, this);
			return path;
		},

		/**
		 * Sets the results array of matched nodes based on a search string.
		 */
		_findInNodes: function(nodes, searchStr, searchAttr, results, childProperty, data) {
		    var result = null;
		    var arr, value, children, pl;

		    if(nodes instanceof Array) {
		        for(var i = 0; i < nodes.length; i++) {
		            result = this._findInNodes(nodes[i], searchStr, searchAttr, results, childProperty, data);  
		        }
		    } else {

		    	if(nodes[searchAttr].toLowerCase().indexOf(searchStr.toLowerCase()) !== -1) {
		    		nodes.path = nodes.pathLocator || nodes.path;
		    		nodes.sectionName = this._getPathString(nodes.path, data);
		            results.push(nodes);
		        }

		        if (typeof nodes[childProperty] !== 'undefined') {
		        	children = nodes[childProperty];

			        if(children instanceof Object) {
						children = Object.keys(children).map(function(key) { return children[key]; });
			        }

			        if(children instanceof Array) {
				        result = this._findInNodes(children, searchStr, searchAttr, results, childProperty, data);
			        } 
		        }
		    }
		},

		hasChildren: function (node) {
			var children = node.children;
			return children && Object.keys(children).length > 0;
		},
		openNode: function (event) {
			event.preventDefault();
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