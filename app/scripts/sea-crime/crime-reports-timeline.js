'use strict';

angular.module('mkm.seaCrimeData')
  .directive('vizTimeLine', ['$window', function($window) {

    return {

      templateUrl: 'views/template-reports-viz.html',
      scope: {
        vizID: '=vizTimeLine',
        mapID: '=crimeVizMap',
        promiseAttr: '=vizTimeData'

      },

      link: function(scope, element) {

        /*
            Calulates padding based on parent element width and height
        */

        function radiusCalc(_el_) {

          var elWdth = _el_.offsetWidth;
          var rad = 8;

          if (elWdth > 600) {
            rad = 16;
          } else if (elWdth > 1280) {
            rad = 20;
          }

          return rad;
        }

        function paddingCalc(_el_) {

          var elWdth = _el_.offsetWidth;
          var pad = 3;

          if (elWdth > 600) {
            pad = 16;
          } else if (elWdth > 1280) {
            pad = 24;
          }

          return pad;
        }

        var elm = element[0];

        var wrapper = d3.select(elm);

        //  SVG DIMENSIONS
        var padding = paddingCalc(elm);

        var wdth = elm.offsetWidth;
        var hght = elm.offsetHeight;

        var padRange = {
          x: function(_wdth_) {
            return [padding + 60, _wdth_ - padding];
          },
          y: function(_hght_) {
            return [padding, _hght_ - padding - 36];
          }
        };

        var svg = wrapper
          .append('svg')
          .attr({
            height: hght,
            width: wdth
          });

        var scaleAxisX = d3.time.scale()
          .range(padRange.x(wdth));

        var scaleAxisY = d3.time.scale.utc()
          .domain([new Date('Wed Dec 31 1969 00:00:00 GMT-0800 (PST)'), new Date('Wed Dec 31 1969 23:59:00 GMT-0800 (PST)')])
          .range(padRange.y(hght));

        var xAxis = d3.svg.axis()
          .orient('bottom')
          .ticks(d3.time.day, 1)
          .innerTickSize(-wdth)
          .outerTickSize(0)
          .tickPadding(10)
          .tickFormat(d3.time
            .format('%a %m/%d'));

        var yAxis = d3.svg.axis()
          .orient('left')
          .innerTickSize(-(hght + padding))
          .outerTickSize(0)
          .tickPadding(10)
          .tickFormat(d3.time.format("%H:%M"))
          .ticks(d3.time.hours, 3);

        scope.toolTipLock = scope.toolTipLock || false;

        scope.promiseAttr.promise.then(function(data) {

          var toolTipEl = d3.select('#cicle-tool-tip');

          var _incidents = data.incidents;

          var _index = data.index;

          var dateRange = d3.extent(_incidents, function(d) {

            return new Date(d.properties.date_reported);

          });

          scaleAxisX.domain(dateRange);

          xAxis.scale(scaleAxisX);
          yAxis.scale(scaleAxisY);

          svg.append('g')
            .attr('class', 'axis x')
            .attr('transform', 'translate(0,' + (hght - 30) + ')')
            .call(xAxis);

          svg.append('g')
            .attr('class', 'axis y')
            .attr('transform', 'translate(50, 0)')
            .call(yAxis);

          var reportMarks = svg.append('g')
            .attr('id', 'reports-vz-marks')
            .attr('transform', 'translate(0, 0)');

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

            return scaleAxisX(new Date(timeFormat(incidentDate)));
          }

          function plotYcirc(d) {

            var timeFormat = d3.time.format('%X');

            var incidentTime = timeFormat(new Date(d.properties.date_reported));

            return scaleAxisY(new Date('Wed Dec 31 1969 ' + incidentTime));
          }

          function toolTipShow(data, element) {
            try {
              scope.mapID.$markers.close();
            } catch (e) {}

            var incident = data;

            var circ = (element !== undefined) ? element :
              reportMarks.selectAll('circle')
              .filter(function(d) {
                return d.properties.general_offense_number === incident.general_offense_number;
              })[0][0];

            if (circ.getAttribute('fill') !== 'transparent') {

              var timeFormatFull = d3.time.format('%A at %H:%M');

              var parent = circ.parentElement;

              var parentbounding = parent.getBoundingClientRect();

              var bounding = circ.getBoundingClientRect();

              var newWdth = bounding.left;

              var newHght = bounding.top;

              var toolTipHght = toolTipEl[0][0].getBoundingClientRect().height;

              var offsetX = true ? (newWdth - parentbounding.left) : 0;

              var offsetY = true ? (newHght - parentbounding.top + toolTipHght + 24) : 0;

              // circ.setAttribute('r', '4');

              // Populate tooltop now, need height to calculate offsets
              toolTipEl.html(timeFormatFull(new Date(incident.date_reported)) + ' / ' + incident.offense_type);

              toolTipEl.style('left', function() {
                  return offsetX + 'px';
                })
                .style('top', function() {
                  return offsetY + 'px';
                });

              toolTipEl
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
            }
          }

          function toolTipHide() {
            toolTipEl.transition()
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

          reportMarks.selectAll('circle')
            .data(_incidents)
            .enter()
            .append('circle')
            .attr('class', 'timeline-circle')
            .attr('style', function(d) {
              return setCircStyle('initial', d);
            })
            .attr('cx', plotXcirc)
            .attr('cy', plotYcirc)
            .attr('r', radiusCalc(element))
            .on('click', function(event) {

              toolTipShow(event.properties, this);

              scope.toolTipLock = true;

              //  PARENT TYPE
              var offType = event.properties.offense_type;

              var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

              var _latitude = Number(event.properties.latitude);
              var _longitude = Number(event.properties.longitude);

              var uluru = {
                'lat': _latitude,
                'lng': _longitude
              };

              // remove old marker
              if (scope.mapID.markers !== null) {
                scope.mapID.markers.setMap(null);
              }

              var _marker = new google.maps.Marker({
                'position': uluru,
                'map': scope.mapID.$g,
                'icon': 'images/spacer.png'
              });

              var _HTMLcontent = '<span class=\"glyphicon glyphicon-map-marker\" style=\"color: ' + scope.$index[parentType].fillColor + '\"></span>&nbsp;' + event.properties.summarized_offense_description;

              var infowindow = new google.maps.InfoWindow({
                content: _HTMLcontent
              });

              infowindow.open(scope.mapID.$g, _marker);

              google.maps.event.addListener(infowindow, 'closeclick', function() {

                scope.incidentDetail = null;

                scope.$apply();

                toolTipHide();
              });

              scope.mapID.$g.setCenter(_marker.getPosition());

              // Cache marker for removal later
              scope.mapID.$markers = infowindow;

              scope.incidentDetail = event.properties;

              scope.$apply();

              if (scope.$detailMap !== undefined) {

                var StreetView = new google.maps.Map(document.getElementById('street-view-detail'), {
                  scrollwheel: false,
                  zoomControl: false,
                  zoom: 0
                });

                var panorama = new google.maps.StreetViewPanorama(

                  document.getElementById('street-view-detail'), {
                    'position': uluru,
                    'pov': {
                      'heading': 34,
                      'pitch': 5
                    },
                    'scrollwheel': false
                  });

                StreetView.setStreetView(panorama);
              }
            })
            .on('mouseover', function(d) {

              if (!scope.toolTipLock) {

                this.setAttribute('style', setCircStyle('mouseover', d));

                toolTipShow(d.properties, this);
              }
            })
            .on('mouseout', function(d) {
              if (!scope.toolTipLock) {

                this.setAttribute('style', setCircStyle('mouseout', d));

                toolTipHide();

              }
            });

          function _refreshTimeLine() {

            var newWdth = elm.offsetWidth;
            var newHght = elm.offsetHeight;

            svg
              .attr({
                height: newHght,
                width: newWdth
              });

            scaleAxisX.range(padRange.x(newWdth));

            scaleAxisY.range(padRange.y(newHght));


            svg.select('g#reports-vz-marks')
              .transition()
              .duration(100)
              .attr('transform', 'translate(0, 0)');

            svg.select('.axis.x')
              .transition()
              .duration(100)
              .attr('transform', 'translate(0,' + (newHght - 30) + ')')
              .ease("sin-in-out")
              .call(xAxis);

            svg.select('.axis.y')
              .attr('transform', 'translate(50, 0)')
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
