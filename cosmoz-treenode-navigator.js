/* */
(function () {
	'use strict';

	Polymer({

		is: 'cosmoz-treenode-navigator',

		properties: {
			/*
			 * original node structure
			 */
			data: {
				type: Object
			},
			/*
			 * current node structure
			 */
			dataPlane: {
				type: Array,
				value: function (){
					return [];
				}
			},
			/*
			 * current path to displayed node/folder
			 */
			_locationPath: {
				type: String,
				value: ''
			},
			/*
			 * currently selected node object
			 */
			chosenNode: {
				type: Array,
				value: function (){
					return {};
				},
				notify: true
			},
			/*
			 * currently selected node name
			 */
			selectedNodeName: {
				type: String,
				value: '',
				notify: true
			},
			/*
			 * current selected path expressed in node names.
			 */
			currentBranchPathName: {
				type: String,
				value: '',
				notify: true
			},
			/*
			 * Placeholder for search field.
			 */
			searchPlaceholder: {
				type: String,
				value: 'search'
			},
			/*
			 * current section(parent) of node.
			 */
			_currentSectionName: {
				type: String
			},
			/*
			 * input value for searches
			 */
			inputValue: {
				type: String
			},
			/*
			 * Property name that searches will compare too.
			 * Defaults to name
			 */
			childProperty: {
				type: String,
				value: 'children'
			},
			/*
			 * Property name that searches will compare too.
			 * Defaults to name
			 */
			comparisonProperty: {
				type: String,
				value: 'name'
			},
			/*
			 * Current position in structure.
			 */
			_currentBranchPath: {
				type: String,
				value: ''
			},
			/*
			 * Array of search results.
			 */
			_searchNodes: {
				type: Array,
				value: function () {
					return [];
				}
			},
			/*
			 * Chosen seperator to denote navigation paths.
			 * Defaults to .
			 */
			seperatorSign: {
				type: String,
				value: '.'
			},
			/*
			 * Whether search is based on currently selected node.
			 * Defaults to local
			 */
			globalSearch: {
				type: Boolean,
				value: false
			},
			/*
			 * Reset failed global search.
			 */
			resetSearch: {
				type: Boolean,
				value: false
			},
			/*
			 * Whether search is currently being done.
			 */
			searchInProgress: {
				type: Boolean,
				value: false
			},
			/*
			 * True if search results turns up empty.
			 */
			searchFailed: {
				type: Boolean,
				value: false
			},
			/*
			 * Text given to user when local search fails.
			 */
			noResultFound: {
				type: String
			},
			/*
			 * Text given to user when local search fails.
			 */
			noResultLocalFound: {
				type: String,
				value: 'No result found. Click to expand to global search.'
			},
			/*
			 * Text given to user when global search fails.
			 */
			noResultGlobalFound: {
				type: String,
				value: 'No result found in global search. Click to reset.'
			}
		},
		observers: [
			'renderLevel(_locationPath, data)',
			'searchHandler(inputValue, data)'
		],
		getRootLevels: function (nodes) {
			var tempChild,
				tempNodes = [];
			Object.keys(nodes).forEach(function (rootNode) {
				tempChild = nodes[rootNode];
				tempChild.generatedNodeId = rootNode;
				tempChild.generatedPath = rootNode;
				tempNodes.push(tempChild);
			});
			return tempNodes;
		},
		renderLevel: function (pl, nodes) {
			var path,
				that = this,
				tempChild,
				tempPath,
				tempParentNodes = [],
				tempNodes = [],
				tempPathName = '';
			that.searchInProgress = false;
			that.currentBranchPathName = '';
			if (pl === '') {
				// root case (hoho)
				that.set('dataPlane', that.getRootLevels(nodes));
				return;
			}
			path = pl.split(that.seperatorSign);
			tempPath = path.splice(0, 1)[0];
			tempChild = nodes[tempPath];
			tempPathName = tempChild[that.comparisonProperty] + '/';
			that._currentBranchPath = tempPath;
			if (path.length > 0) {
				path.some(function (key) {
					if (tempChild[that.childProperty] && tempChild[that.childProperty][key]) {
						tempChild = tempChild[that.childProperty][key];
						tempPathName = tempPathName + tempChild[that.comparisonProperty] + '/';
						that._currentBranchPath = that._currentBranchPath + that.seperatorSign + key;
					} else {
						console.log('Error: children/path doesnt exist ', path);
						return false;
					}
				});
			}

			tempChild = tempChild[that.childProperty];

			that.currentBranchPathName = tempPathName;

			Object.keys(tempChild).forEach(function (child) {
				tempChild[child].generatedNodeId = child;
				tempChild[child].generatedPathName = tempPathName;
				tempNodes.push(tempChild[child]);
			});
			tempParentNodes.push(tempNodes);

			that.set('dataPlane', tempNodes);
		},
		searchHandler: function (searchWord, currentObject) {
			var that = this,
				parentNode,
				currentPath = '';
			that._searchNodes = [];
			that._currentSectionName = '';
			if(searchWord.length < 3) {
				// should existing results of previous navigation/searches be cleared away?
				return;
			}
			that.searchInProgress = true;
			this.searchFailed = false;
			if(that._locationPath.indexOf(that.seperatorSign) === -1) {
				currentPath = that._locationPath;
			} else {
				currentPath = that._locationPath.substring(0,that._locationPath.indexOf(that.seperatorSign));
			}

			if (Object.keys(currentObject).length > 1 && currentPath === '') {
				Object.keys(currentObject).forEach(function (rootNode) {
					that.searchAllBranches(searchWord, currentObject[rootNode], rootNode);
				});

			} else {
				if (currentPath === '') {
					currentPath = Object.keys(currentObject)[0];
				}

				if (!that.globalSearch) {
					parentNode = that.getCurrentTree(that._currentBranchPath);
				} else {
					parentNode = currentObject[currentPath];
				}

				that.searchAllBranches(searchWord, parentNode, currentPath);
			}

			if (that._searchNodes && that._searchNodes.length === 0) {
				that.noResultFound = that.noResultLocalFound;
				if (that.globalSearch === true) {
					that.noResultFound = that.noResultGlobalFound;
					that.globalSearch = false;
					that.resetSearch = true;
				}
				that.searchFailed = true;
			}
			that.set('dataPlane', that._searchNodes);

		},
		searchAllBranches: function (searchWord, parentNode, currentPath) {
			var sectionName = '',
				hasItemIndex,
				that = this;
			sectionName = parentNode[that.comparisonProperty];
			if (parentNode[that.childProperty] && Object.keys(parentNode[that.childProperty]).length > 0 && parentNode[that.childProperty].constructor === Object) {
				Object.keys(parentNode[that.childProperty]).forEach(function (index) {
					hasItemIndex = parentNode[that.childProperty][index][that.comparisonProperty].toLowerCase().indexOf(searchWord.toLowerCase());
					if (hasItemIndex > -1) {
						parentNode[that.childProperty][index].generatedPathName = sectionName + '/' + parentNode[that.childProperty][index][that.comparisonProperty] + '/';
						parentNode[that.childProperty][index].generatedPath = currentPath + that.seperatorSign + index;
						parentNode[that.childProperty][index].sectionName = sectionName;
						that._searchNodes.push(parentNode[that.childProperty][index]);
					}
					if (Object.keys(parentNode[that.childProperty][index][that.childProperty]).length > 0 && parentNode[that.childProperty][index].constructor === Object) {
						that.searchInnerBranches(searchWord, parentNode[that.childProperty][index], currentPath + that.seperatorSign + index);
					}
				});
			}
		},
		searchInnerBranches: function (searchWord, parentNode, currentPath) {
			var that = this,
				sectionName = parentNode[that.comparisonProperty];
			if (parentNode[that.childProperty] && Object.keys(parentNode[that.childProperty]).length > 0 && parentNode[that.childProperty].constructor === Object) {
				Object.keys(parentNode[that.childProperty]).forEach(function (index) {
					var hasItemIndex = parentNode[that.childProperty][index][that.comparisonProperty].toLowerCase().indexOf(searchWord.toLowerCase());
					if (hasItemIndex > -1) {
						parentNode[that.childProperty][index].generatedPathName = parentNode.generatedPathName + '/' + parentNode[that.childProperty][index][that.comparisonProperty] + '/';
						parentNode[that.childProperty][index].generatedPath = currentPath + that.seperatorSign + index;
						parentNode[that.childProperty][index].sectionName = sectionName;
						that._searchNodes.push(parentNode[that.childProperty][index]);
					}
					if (Object.keys(parentNode[that.childProperty][index][that.childProperty]).length > 0 && parentNode[that.childProperty][index].constructor === Object) {
						that.searchInnerBranches(searchWord, parentNode[that.childProperty][index], currentPath + that.seperatorSign + index);
					}
				});
			}
		},
		getCurrentTree: function (pl) {
			var path,
				that = this,
				tempChild;
			if(pl.indexOf(that.seperatorSign) === -1) {
				path = pl;
				if (pl === '') {
					return that.data[Object.keys(that.data)[0]];
				}
				return that.data[path];
			}

			path = pl.split(that.seperatorSign);

			tempChild = that.data[path[0]];
			path = path.slice(1);
			if (path.length > 0) {
				path.forEach(function (key) {
					if (tempChild[that.childProperty] && tempChild[that.childProperty][key]) {
						tempChild = tempChild[that.childProperty][key];
					} else {
						console.log('Error: children/path doesnt exist ', tempChild, path);
					}
				});
			}
			return tempChild;

		},
		checkSection: function (section) {
			if (this.searchInProgress && section !== this._currentSectionName) {
				this._currentSectionName = section;
				return true;
			}
			return false;
		},
		openNode: function (event) {
			var nodeClicked,
				nodeObject;
			nodeObject = event.target.nodeObject;
			if (!nodeObject.generatedPath) {
				nodeClicked = this._locationPath + this.seperatorSign + nodeObject.generatedNodeId;
			} else {
				nodeClicked = nodeObject.generatedPath;
			}
			this.selectedNodeName = '';
			this._locationPath = nodeClicked;
			this.inputValue = '';
			this.renderLevel(nodeClicked, this.data);
		},
		openParentNode: function () {
			var parentNodePath = this._locationPath.substring(0, this._locationPath.lastIndexOf(this.seperatorSign));
			if (parentNodePath === '') {
				this._currentBranchPath = '';
			}
			this.selectedNodeName = '';
			this._locationPath = parentNodePath;
			this.renderLevel(parentNodePath, this.data);
		},
		nodeSelect: function (event) {
			var nodeObject;
			if (event.target._iconName) {
				return;
			}
			nodeObject = event.target.nodeObject;
			/* not needed anymore?
			if (!nodeObject.generatedPath) {
				this.selectedNode = this._locationPath + this.seperatorSign + nodeObject.generatedNodeId;
			} else {
				this.selectedNode = nodeObject.generatedPath;
			}*/
			this.selectedNodeName = nodeObject[this.comparisonProperty];
			this.currentBranchPathName = nodeObject.generatedPathName;
			this.chosenNode = {
				folderPath: nodeObject.generatedPathName,
				name: nodeObject[this.comparisonProperty]
			};
		},
		checkForParent: function (path) {
			if (path !== '') {
				return false;
			}
			return true;
		},
		clearSearch: function () {
			this._searchNodes = [];
			this.set('dataPlane', []);
		},
		tryGlobalSearch: function (event) {
			if (this.resetSearch) {
				this.resetSearch = false;
				this.noResultFound = this.noResultLocalFound;
				this.searchFailed = false;
				this.inputValue = '';
				this.renderLevel('', this.data);

			} else {
				this.globalSearch = true;
				this._locationPath = '';
				this.searchHandler(event.target.searchword, this.data);
			}
		},
		childrenExist: function (node) {
			if (Object.keys(node[this.childProperty]).length === 0 && node[this.childProperty].constructor === Object) {
				return false;
			}
			return true;
		}
	});
}());