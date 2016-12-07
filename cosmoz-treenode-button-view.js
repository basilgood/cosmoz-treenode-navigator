/* */
(function () {
	'use strict';

	Polymer({
		behaviors: [
			Cosmoz.TranslatableBehavior
		],
		is: 'cosmoz-treenode-button-view',

		properties: {
			/*
			Node structure object
			that component is given
			 */
			data: {
				type: Object
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
			locationPath: {
				type: String,
				value: '',
				notify: true
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
			 Currently selected node object
			 */
			potentiallySelectedNode: {
				type: Object,
				value: function (){
					return {};
				}
			},
			/*
			Placeholder for search field.
			 */
			searchPlaceholder: {
				type: String,
				value: '_("Search", t)'
			},
			/*
			Placeholder for button text.
			 */
			buttonTextPlaceholder: {
				type: String,
				value: '_("No selection made", t)'
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
			 Settable text given to user
			 when local search has
			 been done.
			 */
			localSearchDoneText: {
				type: String,
				value: '_("Click to search again but globally.", t)'
			},
			/*
			Settable text given to user
			when after an global search.
			*/
			resetText: {
				type: String,
				value: '_("Click to reset.", t)'
			},
			/*
			Settable text for dialog title.
			*/
			dialogText: {
				type: String,
				value: '_("Search or navigate to chosen destination", t)'
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
		openDialogTree: function (event) {
			this.$.dialogTree.open();
		},
		selectNode: function (event) {
			this.value = this.potentiallySelectedNode.pathToNode;
		}
	});
}());