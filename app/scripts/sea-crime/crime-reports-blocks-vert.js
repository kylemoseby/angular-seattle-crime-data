'use strict';

// Declare app level module which depends on views, and components
angular.module('mkm.seaCrimeData')
  .directive('crimeReportsBlockVert', [function() {

    return {
      'templateUrl': 'views/template-reports-block.html',
      'scope': {
        '$promise': '=crimeReportsData'
      },
      'link': function(scope, element) {

        console.log(scope);

        var $elm = element[0];

        var wrapper = d3.select($elm);

        //  SVG DIMENSIONS
        var padding = $elm.offsetWidth * 0.025;
        var wdth = $elm.offsetWidth;
        var hght = $elm.offsetHeight;
        var barHght = hght * 0.8;

        var barLeft = 50;

        var svg = wrapper
          .append('svg')
          .attr({
            'height': hght,
            'width': wdth
          });

        var scaleAxisY = d3.scale.ordinal()
          .rangeBands([padding, (barHght - padding)]);

        var scaleAxisX = d3.scale.linear()
          .range([(padding + barLeft), (wdth - 24)]);

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

          scaleAxisY.domain(axisTitles.reverse());

          scaleAxisX.domain([0, d3.max(indexSorted, function(d) {
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
            .attr('transform', 'translate(' + padding + ',50)');

          console.log(scaleAxisX.range());

          indexRect.append('rect')
            .attr('class', '')
            // .attr('transform', function(d) {
            //   var scaleVal = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);
            //   return 'translate(' + scaleVal + ',' + ((barHght - padding) * 2) + ') rotate(180)';
            // })
            .attr('x', barLeft)
            .attr('y', function(d) {
              return (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisY('VEH') : scaleAxisY(d.offenseCategory);
            })
            .attr('height', scaleAxisY.rangeBand())
            .attr('width', function(d) {
              return scaleAxisX(d.count);
            })
            .attr('fill', function(d) {
              return d.fillColor;
            })
            .on('click', setTypeDetail);

          // CATEGORY LABELS
          indexRect.append("text")
            .attr("transform", function(d) {
              var trans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisY('VEH') : scaleAxisY(d.offenseCategory);

              return 'translate(' + (trans - (scaleAxisY.rangeBand() * 0.33)) + ', ' + (barHght - padding + 9) + ') rotate(-33)';
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

              var trans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisY('VEH') : scaleAxisY(d.offenseCategory);

              return 'translate(' + (scaleAxisX(d.count) + barLeft + 3) + ', ' + (trans + scaleAxisY.rangeBand() - 3) + ')';
            })
            .attr("class", "block-label count")
            .text(function(d) {
              return d.count;
            })
            .on('click', setTypeDetail);


          scope.blockID = {
            refreshBlocks: function() {

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
                .ease('sin-in-out');
              // .attr("transform", function(d) {
              //   var xTrans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);

              //   return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.33)) + ', ' + (barHght - padding + 7) + ') rotate(-50)';
              // });

              indexRect.selectAll('.block-label.count')
                .transition()
                .duration(100)
                .ease('sin-in-out');
              // .attr("transform", function(d) {
              //   var xTrans = (d.offenseCategory === 'VEH-THEFT-AUTO') ? scaleAxisX('VEH') : scaleAxisX(d.offenseCategory);

              //   return 'translate(' + (xTrans - (scaleAxisX.rangeBand() * 0.67) - 4) + ', ' + (barHght - scaleAxisY(d.count) - padding - 2) + ')';
              // });

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
          };

        });
      }
    };

  }]);
