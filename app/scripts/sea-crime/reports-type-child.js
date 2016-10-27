'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportTypeChild', [function() {
    // Runs during compile
    return {
      scope: {
        'reports': '=reportData',
        'reportCount': '=reportCount'
      },
      link: function($scope, element) {

        var $elm = element[0];

        var wrapper = d3.select($elm);

        var diameter = 960;

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
          .enter()
          .append("g")
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
          .attr("r", function() {
            return 10;
          })
          .style("fill", function(d) {
            return d.fillColor;
          });

        d3.select(this.frameElement)
          .style("height", diameter + "px");

      }
    };
  }]);
