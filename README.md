# cosmoz-treenode-navigator

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


