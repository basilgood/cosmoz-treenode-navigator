# cosmoz-treenode-navigator


[![Build Status](https://github.com/Neovici/cosmoz-treenode-navigator/workflows/Github%20CI/badge.svg)](https://github.com/Neovici/cosmoz-treenode-navigator/actions?workflow=Github+CI)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

cosmoz-treenode-navigator is a Polymer component that lets you navigate and search through hierarchically structured data-nodes and select one of them.


It needs an object structure which looks for example like this in JSON:

```json
{
	"1": {
		"name": "Root",
		"children": {
			"7": {
				"name": "child seven",
				"children": {

				}
			},
			"8": {
				"name": "child eight",
				"children": {
					"9": {
						"name": "child nine",
						"children": {

						}
					}
				}
			}
		}
	}
}
```

The property names "name" and "children" are configurable in the component through the setting of "childProperty" and "comparisonProperty".


