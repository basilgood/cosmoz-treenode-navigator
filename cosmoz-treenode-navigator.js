import '@webcomponents/shadycss/entrypoints/apply-shim';

import '@polymer/polymer/lib/elements/custom-style';
import '@polymer/iron-flex-layout/iron-flex-layout-classes';
import '@polymer/paper-input/paper-input';
import '@polymer/paper-button/paper-button';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-list/iron-list';

import { PolymerElement } from '@polymer/polymer/polymer-element';
import { html } from '@polymer/polymer/lib/utils/html-tag';

import { Tree } from '@neovici/cosmoz-tree';
import { translatable } from '@neovici/cosmoz-i18next';

/**
Navigator through object with treelike datastructure.

@demo demo/index.html
@demo demo/rtl.html rtl issue

@appliesMixin translatable
*/
class CosmozTreenodeNavigator extends translatable(PolymerElement) {
	/* eslint-disable-next-line max-lines-per-function */
	static get template() {
		return html`
		<custom-style>
			<style include="iron-flex iron-flex-alignment">
				:host {
					--cosmoz-treenode-navigator-select-node-icon-color: var(--primary-color, white);
					--cosmoz-treenode-navigator-list-item-focused-color: #f0f8ff;
				}

				#header {
					margin: 0 16px;
				}

				#header a {
					text-decoration: none;
					color: inherit;
				}

				.section {
					background-color: #f5f5f5;
					padding: 5px;
				}

				.slash {
					margin: 0 2px;
				}

				.pointer {
					cursor: pointer;
				}

				iron-list {
					height: var(--cosmoz-treenode-navigator-list-height, 50vh);
				}

				.node-item {
					font-family: 'Roboto', 'Noto', sans-serif;
					@apply --paper-font-common-base;
					-webkit-font-smoothing: antialiased;
					padding: 6px 12px;
					font-size: 16px;
					font-weight: 400;
					line-height: 24px;
					height: 40px;
				}

				.node-item.selected {
					transition: background-color 0.2s ease-out;
					-moz-transition: background-color 0.2s ease-out;
					-o-transition: background-color 0.2s ease-out;
					background-color: var(--cosmoz-treenode-navigator-list-item-focused-color);
				}

				.node-item.selected paper-icon-button {
					transition: color 0.8s ease-out;
					-moz-transition: color 0.8s ease-out;
					-o-transition: color 0.8s ease-out;
					color: var(--cosmoz-treenode-navigator-select-node-icon-color);
				}
			</style>
		</custom-style>
		<div id="header">
			<h3 class="layout horizontal center wrap">
				<paper-icon-button data-path on-tap="openNode" icon="home"></paper-icon-button>
				<template is="dom-repeat" items="[[ _nodesOnOpenNodePath ]]" as="node">
					<span class="slash">/</span>
					<span class="pointer" tabindex="0" data-path$="[[ node.path ]]" on-tap="openNode" on-keydown="_clickOnEnterOrSpace">[[ _getNodeName(node) ]]
					</span>
				</template>
			</h3>
			<paper-input tabindex="0" id="searchInput" class="flex" label="[[ searchPlaceholder ]]" title$="[[ searchPlaceholder ]]" value="{{ searchValue }}">
				<paper-icon-button icon="clear" slot="suffix" hidden$="[[ !_search ]]" on-tap="_clearSearch"></paper-icon-button>
			</paper-input>
		</div>
		<iron-list id="ironList" items="[[ dataPlane ]]" as="node" selected-item="{{ highlightedNode }}" selection-enabled>
			<template>
				<div tabindex$="[[ tabIndex ]]">
					<div hidden$="[[ !_renderSection(_search, index, dataPlane, node) ]]" class="section">[[ node.sectionName ]]
					</div>
					<div class$="[[_computeRowClass('node-item pointer layout horizontal center', selected)]]">
						<div class="flex" on-dblclick="_onNodeDblClicked">[[ node.name ]]</div>
						<paper-icon-button hidden$="[[ !hasChildren(node) ]]" icon="icons:arrow-forward" data-path$="[[ node.path ]]" on-tap="openNode">
						</paper-icon-button>
					</div>
				</div>
			</template>
		</iron-list>
		<paper-button hidden$="[[ !_showGlobalSearchBtn(_search, _openNodePath) ]]" on-tap="tryGlobalSearch">[[ searchGlobalPlaceholder ]]
		</paper-button>
`;
	}

	static get is() {
		return 'cosmoz-treenode-navigator';
	}

	/* eslint-disable-next-line max-lines-per-function */
	static get properties() {
		return {
			/*
			* The main node structure
			*/
			tree: {
				type: Tree
			},
			/*
			* The currently displayed node list
			*/
			dataPlane: {
				type: Array,
				notify: true,
				computed: '_computeDataPlane(_search, searchValue, _renderedLevel, tree)'
			},
			/*
			* The selected node
			*/
			selectedNode: {
				type: Object,
				computed: '_getNode(nodePath, tree)',
				notify: true
			},
			/*
			* The path of the selected node
			* This is the node which was highlighted and after the user tapped the select button
			*/
			nodePath: {
				type: String,
				value: '',
				notify: true,
				observer: '_nodePathChanged'
			},
			/*
			* The nodes on the path of the selected node
			*/
			nodesOnNodePath: {
				type: Array,
				computed: '_getTreePathParts(nodePath, tree)',
				notify: true
			},
			/*
			* The highlighted (focused) node
			* This is the node which is currently selected in the list
			*/
			highlightedNode: {
				type: Object,
				observer: '_highlightedNodeChanged'
			},
			/*
			* The path string of highlighted (focused) node
			*/
			highlightedNodePath: {
				type: String,
				notify: true
			},
			/*
			* The search string
			*/
			searchValue: {
				type: String,
				value: ''
			},
			/*
			* Placeholder for search field.
			*/
			searchPlaceholder: {
				type: String,
				value: 'Search'
			},
			/*
			* Text displayed when local search has finished
			* to suggest a search on the entire tree
			*/
			searchGlobalPlaceholder: {
				type: String,
				value: 'Click to search again but globally.'
			},
			/*
			* Minimum length of searchValue to trigger a search
			*/
			searchMinLength: {
				type: Number,
				value: 1
			},

			/** PRIVATE */

			/*
			* Nodes (children) to be displayed when opening a node
			*/
			_renderedLevel: {
				type: Array,
				computed: '_renderLevel(_openNodePath, tree)'
			},
			/*
			* The path of the opened node
			*/
			_openNodePath: {
				type: String,
				value: ''
			},
			/*
			* The nodes on the path of the opened node
			*/
			_nodesOnOpenNodePath: {
				type: Array,
				computed: '_getTreePathParts(_openNodePath, tree)'
			},
			/*
			* Whether a search should be executed
			*/
			_search: {
				type: Boolean,
				computed: '_computeSearching(searchValue, searchMinLength)'
			}
		};
	}
	/**
	 * Selects the doubled clicked node and dispatches an node-dblclicked event.
	 * @param {Event} event The triggering event
	 * @return {undefined}
	 */
	_onNodeDblClicked(event) {
		this.$.ironList.selectIndex(event.model.index);
		this.dispatchEvent(new CustomEvent('node-dblclicked', {
			composed: true,
			bubbles: false,
			detail: {
				model: event.model
			}
		}));
	}
	/**
	 * Focusses the search input.
	 * @return {undefined}
	 */
	focus() {
		this.$.searchInput.focus();
	}
	/**
	 * Returns the found nodes based on a search string and a given tree to be searched
	 * @param {Boolean} searching - If true, a search should be executed
	 * @param {String} searchString - The search string
	 * @param {Array} renderedLevel - The node list on which the search should be executed
	 * @param {Tree} tree - The main tree
	 * @return {Array} - The found nodes
	 */
	_computeDataPlane(searching, searchString, renderedLevel, tree) {
		if (searching && tree) {
			const results = tree.searchNodes(searchString, renderedLevel, false);
			return this._normalizeNodes(results);
		}
		return renderedLevel;
	}
	/**
	 * Returns a node array with the children of a node on the given path
	 * If the node doesn't have children, the node gets returned
	 * @param {String} pathLocator - The separated address parts of a node
	 * @param {Tree} tree - The main tree
	 * @return {Array} - Nodes
	 */
	_renderLevel(pathLocator, tree) {
		if (!tree) {
			return;
		}

		const node = tree.getNodeByPathLocator(pathLocator),
			children = tree.getChildren(node),
			level = tree.hasChildren(node) ? children : node,
			sortFunc = (a, b) => {
				// First sort based on "folder" status (containing children)
				if (this.hasChildren(a)) {
					if (!this.hasChildren(b)) {
						return -1;
					}
				} else if (this.hasChildren(b)) {
					return 1;
				}
				// Then sort on searchProperty
				const val1 = a[this.tree.searchProperty],
					val2 = b[this.tree.searchProperty];

				if (val1 > val2) {
					return 1;
				}

				if (val1 < val2) {
					return -1;
				}

				return 0;
			};

		return this._normalizeNodes(level).sort(sortFunc);
	}
	/**
	 * Normalizes and returns an Array of nodes
	 * with the properties name, path, sectionName, children
	 * @param {Array} nodes - The input nodes
	 * @return {Array} - The normalized nodes
	 */
	_normalizeNodes(nodes) {
		if (!Array.isArray(nodes)) {
			return [];
		}

		return nodes.map(node => {
			if (!node) {
				return node;
			}

			const
				path = node.pathLocator || node.path,
				name = node[this.tree.searchProperty],
				sectionName = this.tree.getPathString(path, this.tree.searchProperty, ' / ').replace(new RegExp(name + '$', 'u'), '');

			return {
				name,
				path,
				sectionName,
				children: node[this.tree.childProperty]
			};
		});
	}
	/**
	 * Returns a node based on a given path locator.
	 * If pathLocator is empty or not defined, null gets returned.
	 * If pathLocator is only partly valid, the last valid node gets returned.
	 * @param {String} pathLocator - The separated address parts of a node
	 * @param {Tree} tree - The main tree
	 * @return {Object} - The found node
	 */
	_getNode(pathLocator, tree) {
		if (!tree || !pathLocator) {
			return null;
		}

		const node = this.tree.getNodeByPathLocator(pathLocator);
		let nodes;

		if (!node) {
			nodes = tree.getPathNodes(pathLocator).filter(n => n != null);
		}

		return nodes && nodes.length > 0 ? nodes.pop() : node;
	}
	/**
	 * Returns the nodes on a path specified by a given path locator
	 * @param {String} pathLocator - The separated address parts of a node
	 * @param {Tree} tree - The main tree
	 * @return {Array} - The found nodes or empty array
	 */
	_getTreePathParts(pathLocator, tree) {
		if (!tree || !pathLocator) {
			return [];
		}

		return this._normalizeNodes(tree.getPathNodes(pathLocator));
	}
	/**
	 * Clears the search input
	 * @param {Event} e - The trigger event
	 * @return {undefined}
	 */
	_clearSearch(e) {
		e.preventDefault();
		e.stopPropagation();
		this.searchValue = '';
	}
	/**
	 * Returns the name of a given node
	 * @param {Object} node - The node
	 * @return {String} - The name
	 */
	_getNodeName(node) {
		return node[this.tree.searchProperty];
	}
	/**
	 * Sets the highlightedNodePath when highlightedNode changed
	 * @param {Object} node - The highlighted node
	 * @return {undefined}
	 */
	_highlightedNodeChanged(node) {
		if (!node) {
			this.highlightedNodePath = '';
			return;
		}
		this.highlightedNodePath = node.path;
	}
	/**
	 * Returns true if a given node has children
	 * @param {Object} node - The node
	 * @return {Boolean} - True if node has children
	 */
	hasChildren(node) {
		return this.tree.hasChildren(node);
	}
	/**
	 * Opens a node (renderLevel) based on a given path
	 * @param {Event} e - The triggering event
	 * @param {Event} e.currentTarget.dataset.path - The path locator attribute
	 * @return {undefined}
	 */
	openNode(e) {
		this._openNodePath = e.currentTarget.dataset.path;
		this.searchValue = '';
		e.currentTarget.parentElement.blur();

		// stop event propagation to prevent iron-list trying to select the current item while it will be removed
		e.preventDefault();
		e.stopPropagation();
	}
	/**
	 * Gets called if the selected node (path) has changed
	 * @param {String} path - The path of the newly selected node
	 * @return {undefined}
	 */
	_nodePathChanged(path) {
		if (!path) {
			this.highlightedNodePath = '';

			return;
		}
		this.highlightedNodePath = path;
	}
	/**
	 * Returns true, if the button should be visible
	 * @param {Boolean} searching - If a search is currently executed
	 * @param {String} openNodeLevelPath - The open node level
	 * @return {Boolean} - The visibility of the button
	 */
	_showGlobalSearchBtn(searching, openNodeLevelPath) {
		return searching && openNodeLevelPath !== '';
	}
	/**
	 * Triggers a global search
	 * @return {undefined}
	 */
	tryGlobalSearch() {
		this._openNodePath = '';
	}
	/**
	 * Returns true, if a search string is eligable to trigger a search
	 * @param {String} value - The search string
	 * @param {Number} searchMinLength - The minimum length of value to be valid
	 * @return {Boolean} - If a search should be triggered
	 */
	_computeSearching(value, searchMinLength) {
		return value && value.length >= searchMinLength && value !== '';
	}
	/**
	 * Returns true, if the path of a node should be visible in the view
	 * @param {Boolean} searching - If a search is currently executed
	 * @param {Number} index - The node's current index in the list
	 * @param {Array} dataPlane - The node list
	 * @param {Object} node - The node
	 * @return {Boolean} - If the path should be visible
	 */
	_renderSection(searching, index, dataPlane, node) {
		if (!searching || index == null || dataPlane == null || index >= dataPlane.length || node == null || node.sectionName == null) {
			return false;
		}

		if (index === 0) {
			return true;
		}

		const prevItem = dataPlane[index - 1];
		if (prevItem.sectionName === node.sectionName) {
			return false;
		}

		return true;
	}
	/**
	 * Triggers a click event on the currentTarget
	 * if space or enter key was pressed
	 * @param {Event} e - The event
	 * @return {undefined}
	 */
	_clickOnEnterOrSpace(e) {
		if (e.keyCode === 13 || e.keyCode === 32) {
			// enter or space pressed!
			const fnName = 'click',
				target = e.currentTarget,
				// eslint-disable-next-line no-new-func
				fn = new Function('target', 'fnName', 'return target.' + fnName + '()');
			fn(target, fnName);
		}
	}
	/**
	 * Returns the classes of a row based its selection state
	 * @param {String} classes - The default classes
	 * @param {Boolean} selected - If the row is currently selected
	 * @return {String} - The CSS classes
	 */
	_computeRowClass(classes, selected) {
		return selected ? classes + ' selected' : classes;
	}
}
customElements.define(CosmozTreenodeNavigator.is, CosmozTreenodeNavigator);
