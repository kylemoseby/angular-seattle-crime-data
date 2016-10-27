'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('reportZoneBeat', [function() {
    // Runs during compile
    return {
      scope: {
        'reports': '=reportData'
      },
      link: function($scope, element) {

        var zoneColor = d3.scale.category20b()
          .domain(d3.map($scope.reports, function(d) {
              return d.key;
            })
            .keys());

        var $elm = element[0];

        var wrapper = d3.select($elm);

        var districts = wrapper.selectAll('div')
          .data($scope.reports)
          .enter()
          .append('div')
          .classed('report-districts', true);

        var zones = districts.selectAll('div')
          .data(function(d) {
            return d.values;
          })
          .enter()
          .append('div')
          .classed({ 'report-zones': true })
          .style('background', function(d) {
            return zoneColor(d.values[0].district_sector);
          });

        zones.selectAll('div')
          .data(function(d) {
            return d.values;
          })
          .enter()
          .append('div')
          .classed({ 'zone-reports': true })
          .text(function(d) {
            return d.zone_beat;
          });
      }
    };
  }]);
