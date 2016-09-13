'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('crimeReportsBlock', ['$window', function($window) {

    return {

      'templateUrl': 'views/template-reports-block.html',

      'scope': {
        '$promise': '=crimeReportsData'
      },

      'link': function(scope, element) {

        var $elm = element[0];

        var wrapper = d3.select($elm);

        //  SVG DIMENSIONS
        var padding = $elm.offsetWidth * 0.033;
        var wdth = $elm.offsetWidth;
        var hght = $elm.offsetHeight;
        var barHght = hght - padding - 120;

        var svg = wrapper
          .append('svg')
          .attr({
            'height': hght,
            'width': wdth
          });

        var scaleAxisX = d3.scale.ordinal()
          .rangeBands([padding, (wdth - padding)]);

        var scaleAxisY = d3.scale.linear()
          .range([padding, barHght]);

        scope.$promise.promise.then(function(data) {

          function setTypeDetail(d) {
            scope.$typeDetail.renderChart(d);
          }

          var _index_ = data.index;

          var indexArr = [];

          for (var ind in _index_) {
            indexArr.push(_index_[ind]);
          }

          var indexSorted = indexArr.sort(function(a, b) {
            if (a.count > b.count) {
              return 1;
            }
            if (a.count < b.count) {
              return -1;
            }

            return 0;
          });

          var axisTitles = [];

          indexSorted.forEach(function(d) {
            axisTitles.push((d.offenseCategory === 'VEH-THEFT-AUTO') ? 'VEH' : d.offenseCategory);
          });

          scaleAxisX.domain(axisTitles.reverse());

          scaleAxisY.domain([0, d3.max(indexSorted, function(d) {
            return d.count;
          })]);

          var indexRect = svg.selectAll('g.reports-index-rect')
            .data(indexSorted)
            .enter()
            .append('g')
            .attr('id', function(d) {
              return d.offenseCategory;
            })
            .attr('class', 'reports-index-rect')
            // FIX LATER
            .attr('transform', 'translate(' + padding + ',80)');

          indexRect.append('rect')
            .attr('transform', function(d) {
              var scaleVal = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);
              return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
            })
            .attr('y', function() {
              return barHght - padding;
            })
            .attr('width', scaleAxisX.rangeBand())
            .attr('height', function(d) {
              return scaleAxisY(d.count);
            })
            .attr('fill', function(d) {
              return d.fillColor;
            })
            .on('click', setTypeDetail);

          // CATEGORY LABELS
          indexRect.append("text")
            .attr("transform", function(d) {
              var xTrans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);

              return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.33)) + ', ' + (barHght - padding + 9) + ') rotate(-33)';
            })
            .attr("text-anchor", "end")
            .attr("class", "block-label category")
            .text(function(d) {
              return d.offenseCategory;
            })
            .on('click', setTypeDetail);

          // COUNT LABELS
          indexRect.append("text")
            .attr("transform", function(d) {
              var xTrans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);

              return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.67) - 4) + ', ' + (barHght - scaleAxisY(d.count) - padding - 2) + ')';
            })
            .attr("class", "block-label count")
            .text(function(d) {
              return d.count;
            })
            .on('click', setTypeDetail);

          function _refreshBlocks() {
            var padding = $elm.offsetWidth * 0.025;
            var wdth = $elm.offsetWidth;
            var hght = $elm.offsetHeight;
            var barHght = hght * 0.75;

            svg
              .attr({
                'height': hght,
                'width': wdth
              });

            scaleAxisX.rangeBands([padding, (wdth - padding)]);

            scaleAxisY.range([padding, barHght]);

            indexRect.selectAll('.block-label.category')
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr("transform", function(d) {
                var xTrans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);

                return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.33)) + ', ' + (barHght - padding + 7) + ') rotate(-50)';
              });

            indexRect.selectAll('.block-label.count')
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr("transform", function(d) {
                var xTrans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);

                return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.67) - 4) + ', ' + (barHght - scaleAxisY(d.count) - padding - 2) + ')';
              });

            indexRect.selectAll('g.reports-index-rect rect')
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr('transform', function(d) {
                var scaleVal = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);

                return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
              })
              .attr('y', function() {
                return barHght - padding;
              })
              .attr('width', scaleAxisX.rangeBand())
              .attr('height', function(d) {
                return scaleAxisY(d.count);
              });
          }

          scope.blockID = {
            refreshBlocks: _refreshBlocks
          };

          angular.element($window).bind('resize', _refreshBlocks);

        });
      }

    };

  }]);
