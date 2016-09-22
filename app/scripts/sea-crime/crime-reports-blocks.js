'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('crimeReportsBlock', ['$window', '$mdPanel', function($window, $mdPanel) {

    return {

      'templateUrl': 'views/template-reports-block.html',

      'scope': {
        '$promise': '=crimeReportsData'
      },

      'link': function(scope, element) {

        var $elm = element[0];

        scope.$panel = $mdPanel;

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

          var _index_ = data.index;

          var axisTitles = _index_.map(function(d) {
            return (d.key === 'VEH-THEFT-AUTO') ? 'VEH' : d.key;
          });

          scaleAxisX.domain(axisTitles.reverse());

          scaleAxisY.domain([0, d3.max(_index_, function(d) {
            return d.values.length;
          })]);

          var indexRect = svg.selectAll('g.reports-index-rect')
            .data(_index_)
            .enter()
            .append('g')
            .attr('id', function(d) {
              return d.key;
            })
            .attr('class', 'reports-index-rect')
            // FIX LATER
            .attr('transform', 'translate(' + padding + ',80)');

          indexRect.append('rect')
            .attr('transform', function(d) {
              var scaleVal = (d.key === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.key);
              return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
            })
            .attr('y', function() {
              return barHght - padding;
            })
            .attr('width', scaleAxisX.rangeBand())
            .attr('height', function(d) {
              return scaleAxisY(d.values.length);
            })
            .attr('fill', function(d) {
              return d.fillColor;
            })
            .on('click', function(d) {

              var position = scope.$panel.newPanelPosition()
                .absolute()
                .center();

              /* OPEN THE PANEL */
              scope.$panel
                .open({
                  attachTo: angular.element(document.body),
                  controllerAs: 'ctrl',
                  disableParentScroll: true,
                  templateUrl: 'views/template-report-type-detail.html',
                  hasBackdrop: true,
                  panelClass: 'report-type-detail',
                  position: position,
                  trapFocus: true,
                  zIndex: 150,
                  clickOutsideToClose: true,
                  escapeToClose: true,
                  focusOnOpen: true,
                  targetEvent: event,
                  locals: {
                    reportType: d
                  },
                  controller: function($scope, mdPanelRef, reportType) {

                    $scope.reportType = reportType;

                    $scope.closeDetail = function() {
                      mdPanelRef.close();
                    };
                  }
                })
                .finally();
            });

          // CATEGORY LABELS
          indexRect.append("text")
            .attr("transform", function(d) {
              var xTrans = (d.key === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.key);

              return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.33)) + ', ' + (barHght - padding + 9) + ') rotate(-33)';
            })
            .attr("text-anchor", "end")
            .attr("class", "block-label category")
            .text(function(d) {
              return d.key;
            });

          // COUNT LABELS
          indexRect.append("text")
            .attr("transform", function(d) {
              var xTrans = (d.key === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.key);

              return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.67) - 4) + ', ' + (barHght - scaleAxisY(d.values.length) - padding - 2) + ')';
            })
            .attr("class", "block-label count")
            .text(function(d) {
              return d.values.length;
            });

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
                var xTrans = (d.key === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.key);

                return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.33)) + ', ' + (barHght - padding + 7) + ') rotate(-50)';
              });

            indexRect.selectAll('.block-label.count')
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr("transform", function(d) {
                var xTrans = (d.key === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.key);

                return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.67) - 4) + ', ' + (barHght - scaleAxisY(d.values.length) - padding - 2) + ')';
              });

            indexRect.selectAll('g.reports-index-rect rect')
              .transition()
              .duration(100)
              .ease('sin-in-out')
              .attr('transform', function(d) {
                var scaleVal = (d.key === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.key);

                return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
              })
              .attr('y', function() {
                return barHght - padding;
              })
              .attr('width', scaleAxisX.rangeBand())
              .attr('height', function(d) {
                return scaleAxisY(d.values.length);
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
