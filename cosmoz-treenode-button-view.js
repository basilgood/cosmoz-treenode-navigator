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
			tree: {
				type: Cosmoz.tree
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
			/**
			 * Prevent reset button
			 */
			noReset: {
				type: Boolean,
				value: false
			},
			/*
			Placeholder for search field.
			 */
			searchPlaceholder: {
				type: String
			},
			/*
			Placeholder for button text.
			 */
			buttonTextPlaceholder: {
				type: String,
				value: 'No selection made'
			},
			/*
			 path value
			 */
			value: {
				type: String,
				notify: true
			},

			valuePathParts: {
				type: Array
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
				type: String
			},
			/*
			Settable text given to user
			when after an global search.
			*/
			resetText: {
				type: String
			},
			/*
			Settable text for dialog title.
			*/
			dialogText: {
				type: String,
				value: 'Search or navigate to chosen destination'
			},
			/*
			Minimum length before an search
			starts.
			*/
			searchMinLength: {
				type: Number
			},

			highlightedNodePath: {
				type: String
			}
		},
		_enableReset: function (value, noReset) {
			if (noReset) {
				return false;
			}
			return !!value;
		},
		_getButtonLabel: function (pathParts, placeholder) {
			if (!pathParts, pathParts.length < 1) {
				return placeholder;
			}
			return pathParts.map(function (part) {
				return part[this.comparisonProperty];
			}, this).join(' / ');
		},
		openDialogTree: function () {
			this.$.dialogTree.open();
		},
		focusSearch: function () {
			this.$.treeNavigator.focus();
		},
		reset: function () {
			this.value = '';
		},
		selectNode: function () {
			this.value = this.highlightedNodePath;
		},
		refit: function () {
			this.debounce('refit', function () {
				this.$.dialogTree.fit();
			}.bind(this), 50); // 5 was enough during test
		}
	});
}());