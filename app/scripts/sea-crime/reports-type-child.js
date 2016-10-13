'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportTypeChild', [function() {
    // Runs during compile
    return {
      // name: '',
      // priority: 1,
      // terminal: true,
      scope: {
        'reports': '=reportData',
        'reportCount': '=reportCount'
      }, // {} = isolate, true = child, false/undefined = no change
      // controller: function($scope, $element, $attrs, $transclude) {},
      // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
      // restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
      // template: '',
      // templateUrl: '',
      // replace: true,
      // transclude: true,
      // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
      link: function($scope, element) {

        var $elm = element[0];

        var wrapper = d3.select($elm);

        var diameter = 960;
        // var format = d3.format(",d");
        // var color = d3.scale.category20c();

        var bubble = d3.layout.pack()
          .sort(null)
          .size([diameter, diameter])
          .padding(1.5);

        var svg = wrapper.append("svg")
          .attr("width", diameter)
          .attr("height", diameter)
          .attr("class", "bubble");


        var node = svg.selectAll(".node")
          .data(bubble.nodes($scope.reports))
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) {
            if (!isNaN(d.x && d.y)) {
              return "translate(" + d.x + "," + d.y + ")";
            } else {
              return 'translate(0,0)';
            }
          });

        node.append("title")
          .text(function(d) {
            return d.key;
          });

        node.append("circle")
          .attr("r", function(d) {
            console.log(d);
            return 10;
            // return d.r;
          })
          .style("fill", function(d) {
            return d.fillColor;
          });

        // node.append("text")
        //   .attr("dy", ".3em")
        //   .style("text-anchor", "middle")
        //   .text(function(d) {
        //     return d.className.substring(0, d.r / 3);
        //   });

        // // Returns a flattened hierarchy containing all leaf nodes under the root.
        // function classes(root) {

        //   var _classes = [];

        //   function recurse(name, node) {
        //     if (node.children) {
        //       node.children.forEach(function(child) { recurse(node.name, child); });
        //     } else { _classes.push({ packageName: name, className: node.name, value: node.size }) };
        //   }

        //   recurse(null, root);

        //   return { children: _classes };
        // }

        d3.select(this.frameElement).style("height", diameter + "px");



        // var days = wrapper.selectAll('div')
        //   .data($scope.reports)
        //   .enter()
        //   .append('div')
        //   .text(function(d) {
        //     return d.key.slice(d.key.indexOf('-') + 1, d.key.length);
        //   });

        // days.selectAll('div')
        //   .data(function(d) {
        //     return d.values;
        //   })
        //   .enter()
        //   .append('div')
        //   .classed({ 'report-types': true })
        //   .text(function() {
        //     return 'd';
        //   });
      }
    };
  }]);
