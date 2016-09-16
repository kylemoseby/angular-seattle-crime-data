'use strict';

angular.module('mkm.seaCrimeData')
  .directive('vizTimeLine', ['$window', '$mdPanel', function($window, $mdPanel) {

    return {

      templateUrl: 'views/template-reports-viz.html',
      scope: {
        vizID: '=vizTimeLine',
        mapID: '=crimeVizMap',
        promiseAttr: '=vizTimeData'

      },

      link: function(scope, element) {

        function padByWidth(_el_) {

          var elWdth = _el_.offsetWidth;
          var pad = 3;

          if (elWdth > 600) {
            pad = 16;
          } else if (elWdth > 1280) {
            pad = 24;
          }

          return pad;
        }

        scope.$panel = $mdPanel;

        var elm = element[0];

        var wrapper = d3.select(elm);

        //  SVG DIMENSIONS
        var padding = padByWidth(elm);

        var wdth = elm.offsetWidth;
        var hght = elm.offsetHeight;

        var addPadding = {
          x: function(_wdth_) {
            // Add 60 pixels on right side for axis/labels
            return [padding + 60, _wdth_ - padding];
          },
          y: function(_hght_) {
            // Add 60 pixels on bottom for axis/labels
            return [padding + 10, _hght_ - padding - 36];
          }
        };

        var svg = wrapper
          .append('svg')
          .attr({
            height: hght,
            width: wdth,
            class: 'seattle-crime-timeline'
          });

        var toolTip = d3.select("body").append("div")
          .attr("class", "cicle-tool-tip")
          .style("opacity", 0);

        var scaleAxisX = d3.time.scale()
          .range(addPadding.x(wdth));

        var scaleAxisY = d3.time.scale.utc()
          .domain([new Date('Wed Dec 31 1969 00:00:00 GMT-0800 (PST)'), new Date('Wed Dec 31 1969 24:00:00 GMT-0800 (PST)')])
          .range(addPadding.y(hght));

        var xAxis = d3.svg.axis()
          .orient('bottom')
          .ticks(d3.time.day, 1)
          .tickFormat(d3.time.format('%a %m/%d'));

        var yAxis = d3.svg.axis()
          .orient('left')
          .innerTickSize(-(hght + padding))
          .outerTickSize(0)
          .tickPadding(10)
          .tickFormat(d3.time.format("%H:%M"))
          .ticks(d3.time.hours, 1);

        scope.toolTipLock = scope.toolTipLock || false;

        scope.promiseAttr.promise.then(function(data) {

          var _incidents = data.incidents;

          var _index = data.index;

          var dateRange = d3.extent(_incidents, function(d, i) {

            return (i === 0) ? d3.time.day.floor(new Date(d.properties.date_reported)) : new Date(d.properties.date_reported);
          });

          scaleAxisX.domain(dateRange);

          xAxis.scale(scaleAxisX);
          yAxis.scale(scaleAxisY);


          /*   FUNCTIONS FOR CIRCLES   */
          function setCircStyle(currentState, d) {

            var offType = d.properties.offense_type;
            var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

            var colour = _index[parentType].fillColor;

            switch (currentState) {

              case 'initial':
                return 'stroke: ' + colour +
                  '; stroke-width: ' + '2px' +
                  '; fill-opacity: ' + '0' +
                  '; stroke-opacity: ' + '.67';

              case 'mouseover':
                return 'fill: ' + colour +
                  '; stroke-width: ' + '0px' +
                  '; fill-opacity: ' + '1' +
                  '; stroke-opacity: ' + '.67';

              case 'mouseout':
                return 'stroke: ' + colour +
                  '; stroke-width: ' + '2px' +
                  '; fill-opacity: ' + '0' +
                  '; stroke-opacity: ' + '.67';
            }
          }

          function plotXcirc(d) {
            var incidentDate = new Date(d.properties.date_reported);

            var timeFormat = d3.time.format('%x');

            // return scaleAxisX(new Date(incidentDate));
            return scaleAxisX(new Date(timeFormat(incidentDate)));
          }

          function plotYcirc(d) {

            var timeFormat = d3.time.format('%X');

            var incidentTime = timeFormat(new Date(d.properties.date_reported));

            return scaleAxisY(new Date('Wed Dec 31 1969 ' + incidentTime));
          }

          function toolTipShow(data) {

            var incident = data;

            // reportMarks.selectAll('circle')
            //   .filter(function(d) {
            //     return d.properties.general_offense_number === incident.general_offense_number;
            //   })[0][0];

            // if (element.getAttribute('fill') !== 'transparent') {

            var timeFormatFull = d3.time.format('%H:%M %p');

            // Populate tooltop now, need height to calculate offsets
            toolTip.html(timeFormatFull(new Date(incident.date_reported)) + ' / ' + incident.offense_type);

            toolTip.style('left', function() {
                return (d3.event.pageX + 30) + "px";
              })
              .style('top', function() {
                return (d3.event.pageY - 28) + "px";
              });

            toolTip
              .transition()
              .duration(200)
              .style('opacity', 1)
              .style('background', function() {
                //  PARENT TYPE
                var offType = incident.offense_type;

                var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

                return _index[parentType].fillColor;
              })
              .attr('transform', 'translate(' + padding + ',' + (hght - 30) + ')');
            // }
          }

          function toolTipHide() {
            toolTip.transition()
              .duration(500)
              .style('opacity', 0);

            reportMarks.selectAll('circle')
              .transition()
              .duration(250);
            // .attr('r', '4');
            // .attr('opacity', 1);

            scope.toolTipLock = false;

            // scope.mapID.$markers = null;

            try {
              scope.mapID.$markers.close();
            } catch (e) {}

            // scope.incidentDetail = _incident;

            // scope.$apply();
          }
          /*   END FUNCTIONS FOR CIRCLES   */

          var axXoffset = 10;

          var reportMarks = svg.append('g')
            .attr('transform', 'translate(' + axXoffset + ', 0)')
            .attr('id', 'reports-vz-marks');


          function crimeReportDetail($scope, mdPanelRef, incidentDetail) {

            $scope.incidentDetail = incidentDetail;

            $scope.closeDetail = function() {

              this.incidentDetail = null;

              mdPanelRef.close();
            };
          }

          var radius = 5;

          reportMarks.selectAll('circle')
            .data(_incidents)
            .enter()
            .append('circle')
            .attr('cx', plotXcirc)
            .attr('cy', plotYcirc)
            .attr('r', radius)
            .attr('class', 'timeline-circle')
            .attr('style', function(d) {
              return setCircStyle('initial', d);
            })
            .on('click', function(event) {

              var position = scope.$panel.newPanelPosition()
                .absolute()
                .center();

              /* OPEN THE PANEL */
              scope.$panel.open({
                attachTo: angular.element(document.body),
                controller: crimeReportDetail,
                controllerAs: 'ctrl',
                disableParentScroll: true,
                templateUrl: 'views/template-incident-detail.html',
                hasBackdrop: true,
                panelClass: 'crime-report-detail',
                position: position,
                trapFocus: true,
                zIndex: 150,
                clickOutsideToClose: true,
                escapeToClose: true,
                focusOnOpen: true,
                targetEvent: event,
                locals: {
                  incidentDetail: event.properties
                }
              }).finally(function() {

                var StreetView = new google.maps.Map(document.getElementById('street-view-detail'), {
                  scrollwheel: false,
                  zoomControl: false,
                  zoom: 0
                });

                var panorama = new google.maps.StreetViewPanorama(
                  document.getElementById('street-view-detail'), {
                    'position': {
                      'lat': Number(event.properties.latitude),
                      'lng': Number(event.properties.longitude)
                    },
                    'pov': {
                      'heading': 34,
                      'pitch': 5
                    },
                    'scrollwheel': false
                  });

                StreetView.setStreetView(panorama);

                // promise resolved with GEOJSON


              });

              scope.incidentDetail = event.properties;

              // scope.$apply();
            })
            .on('mouseover', function(d) {

              if (!scope.toolTipLock) {

                this.setAttribute('style', setCircStyle('mouseover', d));

                this.setAttribute('r', radius * 2);

                toolTipShow(d.properties, this);
              }
            })
            .on('mouseout', function(d) {
              if (!scope.toolTipLock) {

                this.setAttribute('style', setCircStyle('mouseout', d));

                this.setAttribute('r', radius);

                toolTipHide();
              }
            });

          svg.append('g')
            .attr('class', 'axis x')
            .attr('transform', 'translate(' + axXoffset + ',' + (hght - 30) + ')') // LABELS AT BOTTOM
            .call(xAxis);

          svg.append('g')
            .attr('class', 'axis y')
            .attr('transform', 'translate(50, 0)') // BRINGS DATES OFF SCREEN
            .call(yAxis);

          function _refreshTimeLine() {

            var newWdth = elm.offsetWidth;
            var newHght = elm.offsetHeight;

            svg
              .attr({
                height: newHght,
                width: newWdth
              });

            scaleAxisX.range(addPadding.x(newWdth));

            scaleAxisY.range(addPadding.y(newHght));


            svg.select('g#reports-vz-marks')
              .transition()
              .duration(100);

            svg.select('.axis.x')
              .transition()
              .duration(100)
              .ease("sin-in-out")
              .call(xAxis);

            svg.select('.axis.y')
              .transition()
              .duration(100)
              .ease("sin-in-out")
              .call(yAxis);

            reportMarks.selectAll('circle')
              .transition()
              .duration(200)
              .attr('cx', plotXcirc)
              .attr('cy', plotYcirc);
          }

          // PUBLIC SCOPE METHODS
          scope.vizID = {

            filterData: function(filterIndex) {

              reportMarks.selectAll('circle')
                .transition()
                .duration(200)
                .attr('cx', function(d) {
                  //  PARENT TYPE
                  var offType = d.properties.offense_type;

                  var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

                  if (filterIndex.indexOf(parentType) < 0) {

                    var incidentDate = new Date(d.properties.date_reported)
                      .toDateString();

                    var _q_ = scaleAxisX(new Date(incidentDate));

                    return _q_;

                  } else {

                    return -12000000000000000000;
                  }
                })
                .attr('fill', function(d) {
                  //  PARENT TYPE
                  var offType = d.properties.offense_type;

                  var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

                  return (filterIndex.indexOf(parentType) < 0) ? _index[parentType].fillColor : "transparent";
                });
            },

            refresh: _refreshTimeLine,

            toolTipHide: function() {
              toolTipHide();
            },

            toolTipShow: function(incident) {
              toolTipShow(incident);
            }
          };

          angular.element($window).bind('resize', function() {
            _refreshTimeLine();
          });

        });
      }
    };

  }]);
