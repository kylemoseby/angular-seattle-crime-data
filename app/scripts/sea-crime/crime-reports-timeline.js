'use strict';
angular.module('mkm.seaCrimeData')
  .directive('vizTimeLine', ['$window', '$mdPanel', function($window, $mdPanel) {

    return {

      templateUrl: 'views/template-reports-viz.html',
      scope: {
        promiseAttr: '=vizTimeData'
      },

      link: function(scope, element) {

        scope.getIncidentParent = function(report) {
          return (report.indexOf('-') === -1) ?
            report :
            report.slice(0, report.indexOf('-'));
        };

        var getIncidentParent = scope.getIncidentParent;




        scope.$panel = $mdPanel;
        scope.reportFilter = [];




        var elm = element.children('.crime-report-timeline')[element.children('.crime-report-timeline').length - 1];


        //  SVG DIMENSIONS
        var padding = 10;


        var wdth = elm.offsetWidth;
        var hght = elm.offsetHeight;

        // CANVAS PADDING
        var calcPadding = {

          x: function(_wdth_) {
            // Add 60 pixels on right side for axis/labels
            return [padding, _wdth_ - 40];
          },

          y: function(_hght_) {
            // Add 60 pixels on bottom for axis/labels
            return [padding + 10, _hght_ - padding - 30];
          }
        };


        var wrapper = d3.select(elm);

        wrapper
          .append('svg')
          .attr('height', hght)
          .attr('width', wdth)
          .attr('class', 'seattle-crime-timeline');








        // CANVAS ELEMENT
        var svg = wrapper.select('svg');


        // DIV FOR TOOLTIP
        var toolTip = d3.select("body").append("div")
          .classed('cicle-tool-tip', true);

        // FRAMING SCALES
        var scaleAxisX = d3.scaleTime()
          .range(calcPadding.x(wdth));

        var scaleAxisY = d3.scaleUtc()
          .domain([new Date('Wed Dec 31 1969 00:00:00 GMT-0800 (PST)'), new Date('Wed Dec 31 1969 24:00:00 GMT-0800 (PST)')])
          .range(calcPadding.y(hght));

        // AXIS ELEMENTS
        var xAxis = d3.axisBottom()
          .ticks(d3.timeHour, 24)
          .tickFormat(d3.timeFormat('%m/%d'))
          .scale(scaleAxisX);

        var yAxis = d3.axisLeft();

        scope.toolTipLock = scope.toolTipLock || false;

        function _init_(data) {

          var _incidents = data.incidents;

          scope.$index = data.indexOffType;

          scope.colorScaleOff = data.colorScaleOff;

          function colorScaleApply(reportType) {
            return scope.colorScaleOff(getIncidentParent(reportType));
          }

          var dateRange = d3.extent(_incidents, function(d, i) {
            return (i === 0) ? d3.timeDay.floor(new Date(d.date_reported)) : new Date(d.date_reported);
          });

          scaleAxisX.domain(dateRange);

          xAxis.scale(scaleAxisX);
          yAxis.scale(scaleAxisY);

          /*   FUNCTIONS FOR CIRCLES   */
          function setCircStyle(currentState, d) {

            var colour = colorScaleApply(d.offense_type);

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

          /*
              Returns X coordinate for a circle representing one police report
          */
          function plotXcirc(d) {

            var incidentDate = new Date(d.date_reported);

            var timeFormat = d3.timeFormat('%x');

            return scaleAxisX(new Date(timeFormat(incidentDate)));
          }
          /*
              Returns Y coordinate for a circle representing one polie report
           */
          function plotYcirc(d) {

            var timeFormat = d3.timeFormat('%X');

            var incidentTime = timeFormat(new Date(d.date_reported));

            return scaleAxisY(new Date('Wed Dec 31 1969 ' + incidentTime));
          }

          function _toolTipShow(data) {

            var incident = data;

            var timeFormatFull = d3.timeFormat('%x %H:%M %p');

            // Populate tooltop now, need height to calculate offsets
            toolTip
              .html(timeFormatFull(new Date(incident.date_reported)) + ' / ' + incident.offense_type)
              .style('left', function() {
                if (d3.event.offsetX > wdth * 0.5) {
                  // RIGHT of screen
                  return (d3.event.pageX - 330) + "px";
                } else {
                  // LEFT of screen
                  return (d3.event.pageX + 24) + "px";
                }
              })
              .style('top', function() {
                return (d3.event.pageY - 21) + "px";
              })
              .classed({
                // LEFT of screen
                'left-side': d3.event.offsetX < wdth * 0.5,
                // RIGHT of screen
                'rght-side': d3.event.offsetX > wdth * 0.5
              });

            toolTip
              .transition(d3.transition()
                .duration(200))
              .style('opacity', 1)
              .style('background', function() {
                return colorScaleApply(incident.offense_type);
              })
              .attr('transform', 'translate(' + padding + ',' + hght + ')');
          }

          function toolTipHide() {

            toolTip.transition(d3.transition()
                .duration(500))
              .style('opacity', 0);

            reportMarks.selectAll('circle')
              .transition(
                d3.transition()
                .duration(250)
              );

            scope.toolTipLock = false;
          }

          /*   END FUNCTIONS FOR CIRCLES   */
          function crimeReportDetail($scope, mdPanelRef, incidentDetail) {

            $scope.incidentDetail = incidentDetail;

            $scope.closeDetail = function() {

              this.incidentDetail = null;

              mdPanelRef.close();
            };
          }

          function reportDetailShow(event) {

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
                panelClass: 'timeline-report-detail',
                position: position,
                trapFocus: true,
                zIndex: 150,
                clickOutsideToClose: true,
                escapeToClose: true,
                focusOnOpen: true,
                targetEvent: event,
                locals: {
                  incidentDetail: event
                }
              })
              .finally(function() {

                var StreetView = new google.maps.Map(document.getElementById('street-view-detail'), {
                  scrollwheel: false,
                  zoomControl: false,
                  zoom: 0
                });

                var panorama = new google.maps.StreetViewPanorama(
                  document.getElementById('street-view-detail'), {
                    'position': {
                      'lat': Number(event.latitude),
                      'lng': Number(event.longitude)
                    },
                    'pov': {
                      'heading': 34,
                      'pitch': 5
                    },
                    'scrollwheel': false
                  });

                StreetView.setStreetView(panorama);

              });

            scope.incidentDetail = event;
          }

          var axXoffset = 10;
          var radius = 7;

          var reportMarks = svg.append('g')
            .attr('transform', 'translate(' + axXoffset + ', 0)')
            .attr('id', 'reports-vz-marks');

          var circles = reportMarks.selectAll('circle')
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
            .on('click', reportDetailShow)
            .on('mouseover', function(d) {

              if (!scope.toolTipLock) {

                this.setAttribute('style', setCircStyle('mouseover', d));

                this.setAttribute('r', radius * 2);

                _toolTipShow(d, this);
              }
            })
            .on('mouseout', function(d) {

              if (!scope.toolTipLock) {

                this.setAttribute('style', setCircStyle('mouseout', d));

                this.setAttribute('r', radius);

                toolTipHide();
              }
            });

          var axisX = svg.append('g')
            .attr('class', 'axis x')
            .attr('transform', 'translate(' + axXoffset + ',' + (hght - 20) + ')') // LABELS AT BOTTOM
            .call(xAxis);

          var axisY = svg.append('g')
            .attr('class', 'axis y')
            .attr('transform', 'translate(50, 0)') // BRINGS DATES OFF SCREEN
            .call(yAxis);

          function _refreshTimeLine() {

            var newWdth = elm.offsetWidth;
            var newHght = elm.offsetHeight;

            svg
              .attr('height', newHght)
              .attr('width', newWdth);

            scaleAxisX.range(calcPadding.x(newWdth));

            scaleAxisY.range(calcPadding.y(newHght));

            axisX
              .transition()
              .duration(100)
              .ease("sin-in-out")
              .attr('transform', 'translate(' + axXoffset + ',' + (newHght - 20) + ')')
              .call(xAxis);

            axisY
              .transition()
              .duration(100)
              .ease("sin-in-out")
              .attr('transform', 'translate(50, 0)')
              .call(yAxis);

            circles
              .transition()
              .duration(200)
              .attr('cx', plotXcirc)
              .attr('cy', plotYcirc);
          }

          /*
              PUBLIC SCOPE METHODS // FILTER TIMELINE
          */
          scope.filterData = function(filterIndex) {

            reportMarks.selectAll('circle')
              .transition()
              .duration(200)
              .attr('cx', function(d) {

                //  PARENT TYPE
                var offType = d.offense_type;

                var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

                if (filterIndex.indexOf(parentType) < 0) {

                  var incidentDate = new Date(d.date_reported)
                    .toDateString();

                  var _q_ = scaleAxisX(new Date(incidentDate));

                  return _q_;

                } else {

                  return -12000000000000000000;
                }
              })
              .attr('fill', function(d) {
                return colorScaleApply(d.offense_type);
              });
          };

          /*
              FILTER STUFF
            toggles clicked  index values 'show' attribute
            true / false
          */
          scope.filterToggleType = function($event) {

            $event.preventDefault();

            $event.cancelBubble = true;

            var toggleKey = scope.reportFilter.indexOf(this.val.key);

            if (toggleKey === -1) {

              scope.reportFilter.push(this.val.key);

            } else {

              scope.reportFilter.splice(toggleKey, 1);

            }

            scope.updated = true;
          };

          scope.filterAll = function($event) {

            $event.preventDefault();

            $event.cancelBubble = true;

            scope.reportFilter = [];

            for (var i = scope.$index.length - 1; i >= 0; i--) {

              scope.reportFilter.push(scope.$index[i].key);

            }

            scope.updated = true;
          };

          /*
            Sets all attributes 'show' to 'true' on index
          */
          scope.filterReset = function($event) {

            $event.preventDefault();

            $event.cancelBubble = true;

            scope.reportFilter = [];

            scope.updated = false;
          };

          // REFORMAT ON WINDOW RESIZE
          angular.element($window).bind('resize', function() {
            _refreshTimeLine();
          });
        }

        scope.promiseAttr.promise.then(_init_);
      }
    };
  }]);
