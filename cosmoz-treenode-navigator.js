/* */
(function () {
	'use strict';

	Polymer({

		is: 'cosmoz-treenode-navigator',

		properties: {
			/*
			Node structure object
			that component is given
			 */
			data: {
				type: Object
			},
			/*
			 Current node structure
			 that is displayed
			 */
			_dataPlane: {
				type: Array,
				computed: '_computeDataPlane(inputValue, _renderedLevel)'
			},
			_renderedLevel: {
				type: Array,
				computed: '_computedRenderLevel(_locationPath, data)'
			},
			/*
			 Current path to displayed
			 node/folder
			 */
			_locationPath: {
				type: String,
				value: ''
			},
			/*
			 Currently selected node object
			 */
			chosenNode: {
				type: Array,
				value: function (){
					return {};
				},
				notify: true
			},
			/*
			 Current selected path expressed
			 in node names.
			*/
			currentBranchPathName: {
				type: String,
				value: '',
				notify: true
			},
			/*
			Placeholder for search field.
			 */
			searchPlaceholder: {
				type: String,
				value: 'search'
			},
			/*
			Current section(parent) of node.
			 */
			_currentSectionName: {
				type: String
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
			Search results.
			 */
			_searchNodes: {
				type: Array,
				value: function () {
					return [];
				}
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
			 Whether search is based on
			 currently selected node.
			 */
			_globalSearch: {
				type: Boolean,
				value: false
			},
			/*
			 Reset failed global search.
			 */
			_resetSearch: {
				type: Boolean,
				value: false
			},
			/*
			 Whether search is currently being done.
			 */
			_searchInProgress: {
				type: Boolean,
				value: false
			},
			/*
			 True if search results turns up empty.
			 */
			_searchFailed: {
				type: Boolean,
				value: false
			},
			/*
			 Text bound value container.
			 Is set by other values.
			 */
			_noResultFound: {
				type: String
			},
			/*
			 Settable text given to user
			 when local search fails.
			 */
			noResultLocalFound: {
				type: String,
				value: 'No result found. Click to expand to global search.'
			},
			/*
			Settable text given to user
			when global search fails.
			*/
			noResultGlobalFound: {
				type: String,
				value: 'No result found in global search. Click to reset.'
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
		_computeDataPlane: function (inputValue, renderedLevel) {
			if (inputValue.length > this.searchMinLength) {
				return this.searchHandler(inputValue, renderedLevel);
			}
			return this._renderedLevel;
		},
		_computedRenderLevel: function (pl, nodes) {
			var children,
				path,
				nodeOnPath,
				childPath,
				pathNameParts = [];
			this._searchInProgress = false;
			path = pl.split(this.separatorSign);
			children = nodes;
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
				pathNameParts.push(nodeOnPath[this.comparisonProperty]);
			}, this);
			return Object.keys(children).map(function (childKey) {
				var child = children[childKey];
				if (pl === '') {
					childPath = childKey;
				} else {
					childPath = pl  + this.separatorSign + childKey;
				}
				return {
					id: childKey,
					name: child[this.comparisonProperty],
					path: childPath,
					children: child[this.childProperty]
				};
			}, this);
		},
		searchHandler: function (searchWord, renderedLevel) {
			var results = [],
				parentStat,
				nodes = renderedLevel;
			parentStat = {
				sectionName: '',
				currentPath: ''
			};
			results = this.searchAllBranches(searchWord, parentStat , nodes);
			if (results && results.length === 0) {
				this._noResultFound = this.noResultLocalFound;
				if (this._globalSearch === true) {
					this._noResultFound = this.noResultGlobalFound;
					this._globalSearch = false;
					this._resetSearch = true;
				}
				this._searchFailed = true;
			} else {
				this._noResultFound = this.noResultLocalFound;
				this._globalSearch = false;
				this._searchFailed = false;

			}
			return results;
		},
		searchAllBranches: function (searchWord, parentStat, nodeList) {
			var localPath = parentStat.currentPath,
				results = [];
			if (parentStat.currentPath !== '') {
				localPath += this.separatorSign;
			}
			nodeList.forEach(function (node) {
				if (node.name.toLowerCase().indexOf(searchWord.toLowerCase()) > -1) {
					node.sectionName = parentStat.sectionName;
					node.path = localPath +  node.id;
					results.push(node);
				}
				var children = node[this.childProperty];
				if (children) {
					parentStat.sectionName = node.name;
					parentStat.currentPath = localPath +  node.id;
					results = results.concat(this.searchAllBranches(searchWord, parentStat, this._computedRenderLevel('', children)));
				}
			}, this);
			return results;
		},
		getPathName: function (pl) {
			var path,
				nodeOnPath,
				namesOnPath = '';
			if(pl.indexOf(this.separatorSign) === -1) {
				path = pl;
				if (pl === '') {
					return this.data[Object.keys(this.data)[0]][this.comparisonProperty];
				}
				return this.data[path][this.comparisonProperty];
			}
			path = pl.split(this.separatorSign);
			nodeOnPath = this.data[path[0]];
			namesOnPath = nodeOnPath[this.comparisonProperty] + ' / ';
			path = path.slice(1);
			if (path.length > 0) {
				path.forEach(function (key) {
					if (nodeOnPath[this.childProperty] && nodeOnPath[this.childProperty][key]) {
						nodeOnPath = nodeOnPath[this.childProperty][key];
						namesOnPath += nodeOnPath[this.comparisonProperty] + ' / ';
					}
				}, this);
			}
			return namesOnPath;
		},
		noChildrenFound: function (node) {
			var child = node.children;
			if (Object.keys(child).length === 0 && child.constructor === Object) {
				return true;
			}
			return false;
		},
		checkSection: function (section) {
			if (this._searchInProgress && section !== this._currentSectionName) {
				this._currentSectionName = section;
				return true;
			}
			return false;
		},
		openNode: function (event) {
			var nodeClicked,
				node;
			node = event.model.node;
			console.log('nodeSelect', node);
			if (this._locationPath !== '') {
				nodeClicked = this._locationPath + this.separatorSign + node.id;
			} else {
				nodeClicked = node.path;
			}
			this.inputValue = '';
			this.currentBranchPathName = this.getPathName(nodeClicked);
			this._locationPath = nodeClicked;
		},
		openParentNode: function () {
			if(this._locationPath.indexOf(this.separatorSign) === -1) {
				this.currentBranchPathName = '';
				this._locationPath = '';
			} else {
				this._locationPath =  this._locationPath.substring(0, this._locationPath.lastIndexOf(this.separatorSign));
				this.currentBranchPathName = this.getPathName(this._locationPath);
			}
		},
		nodeSelect: function (event) {
			var node;
			if (event.target._iconName) {
				return;
			}
			console.log('nodeSelect event', event);
			node = event.model.node;
			console.log('nodeSelect', node);
			this.currentBranchPathName = this.getPathName(node.path);
			this.chosenNode = {
				folderPath: this.currentBranchPathName,
				pathToNode: node.path,
				name: node.name
			};
		},
		checkForParent: function (path) {
			if (path !== '') {
				return false;
			}
			return true;
		},
		tryGlobalSearch: function () {
			if (this._resetSearch) {
				this._resetSearch = false;
				this._noResultFound = this.noResultLocalFound;
				this._searchFailed = false;
				this.inputValue = '';
			} else {
				this._globalSearch = true;
			}
			this._locationPath = '';
		}
	});
}());