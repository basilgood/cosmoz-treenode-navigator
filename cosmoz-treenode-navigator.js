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
				computed: '_computeDataPlane(inputValue, data, _renderedLevel)'
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
		_computeDataPlane: function (inputValue, data) {
			if (inputValue.length > this.searchMinLength) {
				return this.searchHandler(inputValue, data);
			}
			return this._renderedLevel;
		},
		_computedRenderLevel: function (pl, nodes) {
			var children,
				path,
				nodeOnPath,
				pathNameParts = [];
			this._searchInProgress = false;
			this.currentBranchPathName = '';
			path = pl.split(this.separatorSign);
			children = nodes;
			path.some(function (key) {
				if (key === '') {
					return true;
				}
				nodeOnPath = children[key];
				if (!nodeOnPath) {
					console.error('Children/path doesnt exist ', path);
					return true;
				}
				children = nodeOnPath[this.childProperty];
				pathNameParts.push(nodeOnPath[this.comparisonProperty]);
			}, this);
			this.currentBranchPathName = pathNameParts.join(' / ');
			return Object.keys(children).map(function (childKey) {
				var child = children[childKey];
				return {
					generatedNodeId: childKey,
					generatedName: child[this.comparisonProperty],
					generatedPathName: this.currentBranchPathName,
					children: child[this.childProperty]
				};
			}, this);
		},
		searchHandler: function (searchWord, currentObject) {
			var parentNode,
				currentPath = '';
			this._searchNodes = [];
			this._currentSectionName = '';
			if(searchWord.length < this.searchMinLength) {
				// should existing results of previous navigation/searches be cleared away?
				return;
			}
			this._searchInProgress = true;
			this._searchFailed = false;
			if(this._locationPath.indexOf(this.separatorSign) === -1) {
				currentPath = this._locationPath;
			} else {
				currentPath = this._locationPath.substring(0,this._locationPath.indexOf(this.separatorSign));
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
					parentNode = this.getCurrentTree(this._locationPath);
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
			return this._searchNodes;
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
						child.generatedPath = currentPath + this.separatorSign + index;
						child.generatedName = child[this.comparisonProperty];
						child.sectionName = sectionName;
						this._searchNodes.push(child);
					}
					if (Object.keys(child[this.childProperty]).length > 0 && child.constructor === Object) {
						this.searchAllBranches(searchWord, child, currentPath + this.separatorSign + index, child.generatedPathName);
					}
				}, this);
			}
		},
		getCurrentTree: function (pl) {
			var path,
				tempChild;
			if(pl.indexOf(this.separatorSign) === -1) {
				path = pl;
				if (pl === '') {
					return this.data[Object.keys(this.data)[0]];
				}
				return this.data[path];
			}
			path = pl.split(this.separatorSign);
			tempChild = this.data[path[0]];
			path = path.slice(1);
			if (path.length > 0) {
				path.forEach(function (key) {
					if (tempChild[this.childProperty] && tempChild[this.childProperty][key]) {
						tempChild = tempChild[this.childProperty][key];
					}
				}, this);
			}
			return tempChild;
		},
		noChildrenFound: function (node) {
			if (Object.keys(node.children).length === 0 && node.children.constructor === Object) {
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
				nodeObject;
			console.log(event);
			nodeObject = event.model.node;
			if (this._locationPath !== '') {
				nodeClicked = this._locationPath + this.separatorSign + nodeObject.generatedNodeId;
			} else {
				nodeClicked = nodeObject.generatedNodeId;
			}
			this.selectedNodeName = '';
			this._locationPath = nodeClicked;
			this.inputValue = '';
		},
		openParentNode: function () {
			var parentNodePath = this._locationPath.substring(0, this._locationPath.lastIndexOf(this.separatorSign));
			this.selectedNodeName = '';
			this._locationPath = parentNodePath;
		},
		nodeSelect: function (event) {
			var nodeObject;
			if (event.target._iconName) {
				return;
			}
			nodeObject = event.target.nodeObject;
			this.selectedNodeName = ' / ' + nodeObject.generatedName;
			this.currentBranchPathName = nodeObject.generatedPathName;
			this.chosenNode = {
				folderPath: nodeObject.generatedPathName,
				pathToNode: this._locationPath + '.' + nodeObject.generatedNodeId,
				name: nodeObject.generatedName
			};
		},
		checkForParent: function (path) {
			if (path !== '') {
				return false;
			}
			return true;
		},
		clearSearch: function () {
			this.inputValue = '';
			this._locationPath = '';
		},
		tryGlobalSearch: function () {
			if (this._resetSearch) {
				this._resetSearch = false;
				this._noResultFound = this.noResultLocalFound;
				this._searchFailed = false;
				this.inputValue = '';
				this._locationPath = '';

			} else {
				this._globalSearch = true;
				this._locationPath = '';
			}
		},
		childrenExist: function (node) {
			if (Object.keys(node.children).length === 0 && node.children.constructor === Object) {
				return false;
			}
			return true;
		}
	});
}());