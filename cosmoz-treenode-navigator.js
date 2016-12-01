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
			Object to be shown in component
			 */
			data: {
				type: Object
			},
			/*
			Node structure object
			that component is given
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
			 path value
			 */
			value: {
				type: String,
				value: '',
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
			_locationPath: {
				type: String,
				value: ''
			},
			/*
			 Currently selected node object
			 */
			chosenNode: {
				type: Object,
				value: function (){
					return {};
				},
				notify: true
			},
			/*
			 Current selected path expressed
			 in node names.
			*/
			_currentBranchPathName: {
				type: String,
				value: '',
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
			 Whether an search has been done.
			 */
			_noSearch: {
				type: Boolean,
				computed: '_computeNoSearch(inputValue)'
			},
			/*
			 Text bound value container.
			 Is set by other values.
			 */
			_searchText: {
				type: String
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
		observers: [
			'_valueChanged(value)'
		],
		_computeDataPlane: function (inputValue, renderedLevel) {
			if (inputValue.length >= this.searchMinLength) {
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
			return results;
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
					node.path = localPath +  node.id;
					results.push(node);
				}
				var children = node[this.childProperty];
				if (children) {
					parentStat.sectionName =localSection + node.name;
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
			namesOnPath = namesOnPath.substring(0, namesOnPath.lastIndexOf('/') - 1);
			return namesOnPath;
		},
		noChildrenFound: function (node) {
			var child = node.children;
			if (Object.keys(child).length === 0 && child.constructor === Object) {
				return true;
			}
			return false;
		},
		openNode: function (event) {
			var nodeClicked,
				node;
			node = event.model.node;
			if (this._locationPath !== '') {
				nodeClicked = this._locationPath + this.separatorSign + node.id;
			} else {
				nodeClicked = node.path;
			}
			this._searchText = this.localSearchDoneText;
			this.inputValue = '';
			this._currentBranchPathName = this.getPathName(nodeClicked);
			this._locationPath = nodeClicked;
		},
		openParentNode: function () {
			if(this._locationPath.indexOf(this.separatorSign) === -1) {
				this._currentBranchPathName = '';
				this._locationPath = '';
			} else {
				this._locationPath =  this._locationPath.substring(0, this._locationPath.lastIndexOf(this.separatorSign));
				this._currentBranchPathName = this.getPathName(this._locationPath);
			}
		},
		nodeSelect: function (event) {
			var node;
			if (event.target._iconName) {
				return;
			}
			node = event.model.node;
			this._currentBranchPathName = this.getPathName(node.path);
			this.value = node.path;
			this.chosenNode = {
				folderPath: this._currentBranchPathName,
				pathToNode: node.path,
				name: node.name
			};
		},
		_valueChanged: function (path) {
			var nodeName;
			if (!path) {
				return;
			}
			this._currentBranchPathName = this.getPathName(path);
			nodeName = this._currentBranchPathName;
			if (this._currentBranchPathName.indexOf('/') !== -1) {
				nodeName = this._currentBranchPathName.substring(this._currentBranchPathName.lastIndexOf('/') + 1);
			}
			this.chosenNode = {
				folderPath: this._currentBranchPathName,
				pathToNode: path,
				name: nodeName
			};
		},
		checkForParent: function (path) {
			if (path !== '') {
				return false;
			}
			return true;
		},
		tryGlobalSearch: function () {
			if (this._searchText === this.resetText) {
				this._searchText = this.localSearchDoneText;
				this._currentBranchPathName = '';
				this.inputValue = '';
			} else {
				this._searchText = this.resetText;
			}
			this._locationPath = '';
		},
		_computeNoSearch: function (inputeValue) {
			if (!inputeValue || inputeValue === '') {
				return true;
			}
			return false;
		}
	});
}());