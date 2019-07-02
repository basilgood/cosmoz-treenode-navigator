import '@webcomponents/shadycss/entrypoints/apply-shim';

import '@polymer/polymer/lib/elements/custom-style';
import '@polymer/iron-flex-layout/iron-flex-layout-classes';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-button/paper-button';

import { Debouncer } from '@polymer/polymer/lib/utils/debounce';
import { timeOut } from '@polymer/polymer/lib/utils/async';

import { PolymerElement } from '@polymer/polymer/polymer-element';
import { html } from '@polymer/polymer/lib/utils/html-tag';

import '@neovici/cosmoz-dialog';
import { Tree } from '@neovici/cosmoz-tree';
import { translatable } from '@neovici/cosmoz-i18next';

import './cosmoz-treenode-navigator';

/**
	`cosmoz-treenode-navigator`
	Navigator through object with treelike datastructure.

	@appliesMixin translatable
*/
class CosmozTreenodeButtonView extends translatable(PolymerElement) {
	/* eslint-disable-next-line max-lines-per-function */
	static get template() {
		return html`
		<custom-style>
			<style include="iron-flex iron-flex-alignment">

				.pathToNode {
					max-width: 320px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					direction: rtl;
					text-align: left;
				}

				paper-dialog .buttons {
					@apply --cosmoz-treenode-button-view-dialog-container;
				}

				#chips {
					@apply --layout-horizontal;
					@apply --layout-end;
					@apply --layout-wrap;
					max-width: 90%;
					padding: 20px;
				}
				.chip {
					border-radius: 500px;
					background-color: #e0e0e0;
					margin: 1px 4px 1px 0;
					white-space: nowrap;
					overflow: hidden;
					@apply --layout-horizontal;
					@apply --layout-center;
				}
				.chip > span {
					color: #424242;
					margin-left: 10px;
					font-size: 13px;
					overflow: hidden;
					text-overflow: ellipsis;
				}
				.chip iron-icon {
					margin: 2px 4px;
					color: #cdcdcd;
					background-color: #a6a6a6;
					border-radius: 500px;
					cursor: pointer;
					min-width: 16px;
					width: 16px;
					min-height: 16px;
					height: 16px;
				}

				#dialogTree {
					min-width: 250px !important;
					width: 450px;
				}

				/* FIXME: https://github.com/PolymerElements/iron-flex-layout/issues/86 */
				[hidden] {
					display: none;
				}

			</style>
		</custom-style>

		<div class="vertical layout actions">
			<div class="horizontal layout actions">
				<paper-button class="flex" raised on-tap="openDialogTree">
					<div class="pathToNode">[[ _getButtonLabel(nodesOnNodePath, buttonTextPlaceholder) ]]</div>
				</paper-button>
				<paper-icon-button icon="clear" on-tap="reset" hidden$="[[ !_enableReset(nodePath, noReset) ]]"></paper-icon-button>
			</div>
			<template is="dom-if" if="[[ _showSelectedNodes(multiSelection, selectedNodes.length) ]]">
				<div id="chips" class="row">
					<template is="dom-repeat" items="[[ selectedNodes ]]">
						<div class="chip"><span>[[ _getChipText(item, tree) ]]</span><iron-icon icon="clear" on-click="_clearItemSelection"></iron-icon></div>
					</template>
				</div>
			</template>
		</div>

		<cosmoz-dialog id="dialogTree" class="treeDialog" on-iron-overlay-opened="focusSearch" modal prerender>
			<template>
				<h2>[[ dialogText ]]</h2>
				<cosmoz-treenode-navigator id="treeNavigator" tree="[[ tree ]]" selected-node="{{ selectedNode }}"
					on-data-plane-changed="refit" highlighted-node-path="{{ highlightedNodePath }}"
					search-placeholder="[[ searchPlaceholder ]]" search-global-placeholder="[[ searchGlobalPlaceholder ]]"
					search-min-length="[[ searchMinLength ]]" node-path="{{ nodePath }}" nodes-on-node-path="{{ nodesOnNodePath }}"
					on-node-dblclicked="_selectNodeAndCloseDialog">
						<slot></slot>
				</cosmoz-treenode-navigator>
				<div class="buttons">
					<paper-button disabled="[[!highlightedNodePath]]" dialog-confirm autofocus on-tap="selectNode">[[ _('Select', t) ]]</paper-button>
					<paper-button dialog-dismiss>[[ _('Cancel', t) ]]</paper-button>
				</div>
			</template>
		</cosmoz-dialog>
`;
	}

	static get is() {
		return 'cosmoz-treenode-button-view';
	}

	/* eslint-disable-next-line max-lines-per-function */
	static get properties() {
		return {

			multiSelection: {
				type: Boolean,
				value: false
			},
			/*
			* The main node structure
			*/
			tree: {
				type: Tree
			},
			/*
			* Currently selected node object
			*/
			selectedNode: {
				type: Object,
				value() {
					return {};
				},
				notify: true
			},
			/**
			 * Selected nodes
			 */
			selectedNodes: {
				type: Array,
				notify: true,
				value: () => []
			},
			/**
			 * If true, reset button gets hidden
			 */
			noReset: {
				type: Boolean,
				value: false
			},
			/*
			* Placeholder for the search field
			*/
			searchPlaceholder: {
				type: String
			},
			/*
			* Placeholder for button text
			*/
			buttonTextPlaceholder: {
				type: String,
				computed: 'getButtonTextPlaceholder(multiSelection)'
			},
			/*
			* The path of the selected node
			*/
			nodePath: {
				type: String,
				notify: true
			},
			/*
			* The nodes on the path of the selected node
			*/
			nodesOnNodePath: {
				type: Array
			},
			/*
			* Text displayed when local search has finished
			* to suggest a search on the entire tree
			*/
			searchGlobalPlaceholder: {
				type: String
			},
			/*
			* Settable text for dialog title.
			*/
			dialogText: {
				type: String,
				value: 'Search or navigate to chosen destination'
			},
			/*
			* Minimum length before an search
			* starts.
			*/
			searchMinLength: {
				type: Number
			},
			/*
			* Path string of highlighted (focused) node
			*/
			highlightedNodePath: {
				type: String
			}
		};
	}
	/**
	 * Event handler for node chip removal button, removes a node chip.
	 * @param {object} event Polymer event object.
	 * @returns {void}
	 */
	_clearItemSelection(event) {
		const item = event.model.item,
			selectedIndex = this.selectedNodes.indexOf(item);

		// This will remove from the DOM the source element of the processed event ...
		this.splice('selectedNodes', selectedIndex, 1);
		// ... so we must prevent further propagation of this event, because its source is now invalid.
		// (This has caused troubles in app-drawer-layout click event handler).
		event.preventDefault();
		event.stopPropagation();
	}
	/**
	 * Get a text label for the node selection button.
	 * @param {boolean} multiSelection Multi selection setting.
	 * @returns {string} Text label.
	 */
	getButtonTextPlaceholder(multiSelection) {
		return multiSelection ? this._('Select a node') : this._('No selection made');
	}
	/**
	 * Whether the reset button should be enabled or not.
	 * @param {string} nodePath Node path to check.
	 * @param {boolean} noReset Bypass to force disabled.
	 * @returns {boolean} Whether the button should be enabled or not.
	 */
	_enableReset(nodePath, noReset) {
		if (noReset) {
			return false;
		}
		return !!nodePath;
	}
	/**
	 * Get a button label based on path parts or a placeholder.
	 * @param {array} pathParts Nodes on the node path.
	 * @param {string} placeholder Replacement placeholder if no nodes are available.
	 * @returns {string} Button label.
	 */
	_getButtonLabel(pathParts, placeholder) {
		if (!Array.isArray(pathParts) || pathParts.length === 0) {
			return placeholder;
		}
		return pathParts.filter(n => n).map(part => part[this.tree.searchProperty]).join(' / ');
	}
	/**
	 * Get text from a node to set on a node chip.
	 * @param {object} node Node to get text from.
	 * @returns {string} Chip text.
	 */
	_getChipText(node) {
		return node.name;
	}
	/**
	 * Open the treenode navigator dialog.
	 * @returns {void}
	 */
	openDialogTree() {
		this.$.dialogTree.open();
	}
	/**
	 * Focus on the treenode navigator in the treenode navigator dialog.
	 * @returns {void}
	 */
	focusSearch() {
		this.$.dialogTree.paperDialog.querySelector('#treeNavigator').focus();
	}
	/**
	 * Reset the component to make it ready for reuse
	 * @returns {void}
	 */
	reset() {
		this.nodePath = '';
		this.selectedNodes = [];
	}
	/**
	 * Select the node in the treenode navigator.
	 * @returns {void}
	 */
	selectNode() {
		// nodePath selects the node, without it no selectedNode
		this.nodePath = this.highlightedNodePath;
		if (this.multiSelection) {
			if (!this.selectedNodes.some(node => node.pathLocator === this.highlightedNodePath)) {
				this.push('selectedNodes', this.selectedNode);
			}
			this.nodePath = '';
			this.selectedNode = {};
		}
	}
	/**
	 * Selects node and closes the dialog
	 * @returns {void}
	 */
	_selectNodeAndCloseDialog() {
		this.selectNode();
		this.$.dialogTree.close();
	}
	/**
	 * Determine if selected nodes container should be visible or not.
	 * @param {boolean} multiSelection Multi selection setting.
	 * @param {number} selectedNodesLength Selected nodes quantity.
	 * @returns {boolean} Whether the selected nodes container should be visible or not.
	 */
	_showSelectedNodes(multiSelection, selectedNodesLength) {
		return	multiSelection && selectedNodesLength > 0;
	}
	/**
	 * Callback event handler to refit the treenode navigator dialog when
	 * data plane has changed.
	 * @returns {void}
	 */
	refit() {
		this._debouncer = Debouncer.debounce(this._debouncer,
			timeOut.after(50), // 5 was enough during test
			() => {
				this.$.dialogTree.fit();
			});
	}
}
customElements.define(CosmozTreenodeButtonView.is, CosmozTreenodeButtonView);
