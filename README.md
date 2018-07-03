[![Coverage Status](https://coveralls.io/repos/github/njhoffman/instrumental-api/badge.svg?branch=master)](https://coveralls.io/github/njhoffman/instrumental-api?branch=master)

Other options are listed below and have reasonable default values if you want to omit them:

Option                    | Type     | Default     | Description
--------------------------|----------|-------------|-------------------------------------------------------------------------
`id`                      | String   | `'d3svg'`   | Sets the identifier of the SVG element —i.e your chart— that will be added to the DOM element you passed as first argument
`style`                   | Object   | `{}`        | Sets specific CSS properties of the chart (see below)
`size`                    | Number   | `500`       | Sets size of the chart in pixels
`aspectRatio`             | Float    | `1.0`       | Sets the chart height to `size * aspectRatio` and [viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox
`widthBetweenNodesCoeff`  | Float    | `1.0`       | Alters the horizontal space between each node
`heightBetweenNodesCoeff` | Float    | `1.0`       | Alters the vertical space between each node
`isSorted`                | Boolean  | `false`     | Sorts the chart in alphabetical order
`transitionDuration`      | Number   | `750`       | Sets the duration of all the transitions used by the chart
`tooltipOptions`          | Object   | [here](https://github.com/romseguy/d3tooltip) | Sets the options for the [tooltip](https://github.com/romseguy/d3tooltip) that is showing up
`rootKeyName`             | String   | `'state'`   | Sets the first node's name of the resulting tree structure. **Warning**: only works if you provide a `state` option
`pushMethod`              | String   | `'push'`    | Sets the method that shall be used to add array children to the tree. **Warning**: only works if you provide a `state` option


The following default styles are customizeable with the style option:

```javascript
style: {
  node: {
    colors: {
      'default': '#ccc',
      collapsed: 'lightsteelblue',
      parent: 'white'
    },
    opacity: {
      'default': 1.0,
      empty: 0.75
    },
    radius: 7
  },
  text: {
    colors: {
      'default': 'black',
      hover: 'skyblue'
    },
    opacity: {
      'default': 1.0,
      empty: 0.75
    }
  },
  link: {
    stroke: '#000',
    fill: 'none'
  }
};

```

- `parent`: fill color for parent nodes
- `collapsed`: fill color for nodeds collapsed by the user
- `empty`: opacity for Falsey values (besides 0), helps data of interest stand out
- `hover`: highlighted color of text when hovering to view a tooltip

