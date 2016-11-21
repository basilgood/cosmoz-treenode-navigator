/* */
(function () {
	'use strict';

	Polymer({

		is: 'cosmoz-treenode-navigator',

		properties: {
			/*
			Node structure object
			that component shows
			 */
			data: {
				type: Object
			},
			/*
			 Current node structure
			 */
			_dataPlane: {
				type: Array,
				value: function (){
					return [];
				}
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
			Currently selected node name
			 */
			selectedNodeName: {
				type: String,
				value: '',
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
				type: String
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
			 Current position in structure.
			 */
			_currentBranchPath: {
				type: String,
				value: ''
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
			Chosen seperator to denote
			navigation path.
			 */
			seperatorSign: {
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
			__searchFailed: {
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
				tempChild.generatedPathName = '/';
				tempChild.generatedPath = rootNode;
				tempChild.generatedName = tempChild[this.comparisonProperty];
				tempNodes.push(tempChild);
			}, this);
			return tempNodes;
		},
		renderLevel: function (pl, nodes) {
			var path,
				tempChild,
				tempPath,
				tempParentNodes = [],
				tempNodes = [],
				tempPathName = '';
			this._searchInProgress = false;
			this.currentBranchPathName = '';
			if (pl === '') {
				// root case (hoho)
				this.set('_dataPlane', this.getRootLevels(nodes));
				return;
			}
			path = pl.split(this.seperatorSign);
			tempPath = path.splice(0, 1)[0];
			tempChild = nodes[tempPath];
			tempPathName = tempChild[this.comparisonProperty] + '/';
			this._currentBranchPath = tempPath;
			if (path.length > 0) {
				path.some(function (key) {
					if (tempChild[this.childProperty] && tempChild[this.childProperty][key]) {
						tempChild = tempChild[this.childProperty][key];
						tempPathName = tempPathName + tempChild[this.comparisonProperty] + '/';
						this._currentBranchPath = this._currentBranchPath + this.seperatorSign + key;
					} else {
						console.log('Error: children/path doesnt exist ', path);
						return false;
					}
				}, this);
			}

			tempChild = tempChild[this.childProperty];

			this.currentBranchPathName = tempPathName;

			Object.keys(tempChild).forEach(function (child) {
				tempChild[child].generatedNodeId = child;
				tempChild[child].generatedPathName = tempPathName;
				tempChild[child].generatedName = tempChild[child][this.comparisonProperty];
				tempNodes.push(tempChild[child]);
			}, this);
			tempParentNodes.push(tempNodes);

			this.set('_dataPlane', tempNodes);
		},
		searchHandler: function (searchWord, currentObject) {
			var parentNode,
				currentPath = '';
			this._searchNodes = [];
			this._currentSectionName = '';
			if(searchWord.length < 3) {
				// should existing results of previous navigation/searches be cleared away?
				return;
			}
			this._searchInProgress = true;
			this._searchFailed = false;
			if(this._locationPath.indexOf(this.seperatorSign) === -1) {
				currentPath = this._locationPath;
			} else {
				currentPath = this._locationPath.substring(0,this._locationPath.indexOf(this.seperatorSign));
			}

			if (Object.keys(currentObject).length > 1 && currentPath === '') {
				Object.keys(currentObject).forEach(function (rootNode) {
					this.searchAllBranches(searchWord, currentObject[rootNode], rootNode, currentObject[rootNode][this.comparisonProperty]);
				}, this);

			} else {
				if (currentPath === '') {
					currentPath = Object.keys(currentObject)[0];
				}

				if (!this._globalSearch) {
					parentNode = this.getCurrentTree(this._currentBranchPath);
				} else {
					parentNode = currentObject[currentPath];
				}

				this.searchAllBranches(searchWord, parentNode, currentPath, parentNode[this.comparisonProperty]);
			}

			if (this._searchNodes && this._searchNodes.length === 0) {
				this._noResultFound = this.noResultLocalFound;
				if (this._globalSearch === true) {
					this._noResultFound = this.noResultGlobalFound;
					this._globalSearch = false;
					this._resetSearch = true;
				}
				this._searchFailed = true;
			}
			this.set('_dataPlane', this._searchNodes);

		},
		searchAllBranches: function (searchWord, parentNode, currentPath, sectionName) {
			var hasItemIndex,
				children = parentNode[this.childProperty],
				child;
			if (children && Object.keys(children).length > 0 && children.constructor === Object) {
				Object.keys(children).forEach(function (index) {
					child = children[index];
					hasItemIndex = child[this.comparisonProperty].toLowerCase().indexOf(searchWord.toLowerCase());
					if (hasItemIndex > -1) {
						child.generatedPathName = sectionName + '/' + child[this.comparisonProperty] + '/';
						child.generatedPath = currentPath + this.seperatorSign + index;
						child.generatedName = child[this.comparisonProperty];
						child.sectionName = sectionName;
						this._searchNodes.push(child);
					}
					if (Object.keys(child[this.childProperty]).length > 0 && child.constructor === Object) {
						this.searchAllBranches(searchWord, child, currentPath + this.seperatorSign + index, child.generatedPathName);
					}
				}, this);
			}
		},
		getCurrentTree: function (pl) {
			var path,
				tempChild;
			if(pl.indexOf(this.seperatorSign) === -1) {
				path = pl;
				if (pl === '') {
					return this.data[Object.keys(this.data)[0]];
				}
				return this.data[path];
			}

			path = pl.split(this.seperatorSign);

			tempChild = this.data[path[0]];
			path = path.slice(1);
			if (path.length > 0) {
				path.forEach(function (key) {
					if (tempChild[this.childProperty] && tempChild[this.childProperty][key]) {
						tempChild = tempChild[this.childProperty][key];
					} else {
						console.log('Error: children/path doesnt exist ', tempChild, path);
					}
				}, this);
			}
			return tempChild;

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
			this.selectedNodeName = nodeObject[this.comparisonProperty];
			this.currentBranchPathName = nodeObject.generatedPathName;
			this.chosenNode = {
				folderPath: nodeObject.generatedPathName,
				pathToNode: nodeObject.generatedPath,
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
			this.set('_dataPlane', []);
		},
		tryGlobalSearch: function (event) {
			if (this._resetSearch) {
				this._resetSearch = false;
				this._noResultFound = this.noResultLocalFound;
				this._searchFailed = false;
				this.inputValue = '';
				this.renderLevel('', this.data);

			} else {
				this._globalSearch = true;
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