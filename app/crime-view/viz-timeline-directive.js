'use strict';

angular.module('myApp.crimeView', ['ngRoute'])
  .directive('vizTimeLine', [function() {

    function link(scope, element) {

      // OPTIONALLY BIND TO MAP
      var vizID = element.attr('viz-time-line');

      var mapID = element.attr('crime-viz-map');

      var promiseAttr = element.attr('viz-time-data');

      var wrapper = d3.select(element[0]);

      //  SVG DIMENSIONS
      var padding = element[0].offsetWidth * 0.05;
      var wdth = element[0].offsetWidth;
      var hght = element[0].offsetHeight;

      var svg = wrapper
        .append('svg')
        .attr({
          height: hght,
          width: wdth
        });

      var timeFormatMD = d3.time.format('%m/%d');

      var timeFormatFull = d3.time.format('%A at %H:%M');

      var scaleAxisX = d3.time.scale()
        .range([0, wdth]);

      var scaleAxisY = d3.time.scale()
        .domain([new Date('Wed Dec 31 1969 00:00:00'), new Date('Wed Dec 31 1969 24:00:00')])
        .range([padding, (hght - padding)]);

      var xAxis = d3.svg.axis()
        .orient('bottom')
        .innerTickSize(-wdth)
        .outerTickSize(0)
        .tickPadding(10)
        .tickFormat(timeFormatMD);

      var yAxis = d3.svg.axis()
        .orient('left')
        .innerTickSize(-(hght + padding))
        .outerTickSize(0)
        .tickPadding(10)
        .tickFormat(d3.time.format("%H"))
        .ticks(d3.time.hours, 1);

      var crimeReportData = scope[promiseAttr];

      scope.toolTipLock = scope.toolTipLock || false;

      crimeReportData.promise.then(function(data) {

        var toolTipEl = d3.select('#cicle-tool-tip');

        var _incidents = data.incidents;

        var _index = data.index;

        var dateRange = d3.extent(_incidents, function(d) {
          return new Date(d.properties.date_reported).valueOf();
        });

        var firstDate = _incidents[0];

        var rectWidth = 20;

        scaleAxisX.domain(dateRange);
        scaleAxisX.nice(d3.time.day);

        xAxis.scale(scaleAxisX);

        yAxis.scale(scaleAxisY);

        svg.append('g')
          .attr('class', 'axis x')
          .attr('transform', 'translate(' + (padding * 1.75) + ',' + (hght - 30) + ')')
          .call(xAxis);

        svg.append('g')
          .attr('class', 'axis y')
          .attr('transform', 'translate(' + padding + ', 0)')
          .call(yAxis);

        var reportMarks = svg.append('g')
          .attr('id', 'reports-vz-marks')
          .attr('transform', 'translate(' + (padding * 1.75) + ', 0)');

        reportMarks.selectAll('circle')
          .data(_incidents)
          .enter()
          .append('circle')
          .attr('class', 'timeline-circle')
          .attr('fill', function(d) {
            //  PARENT TYPE
            var offType = d.properties.offense_type;

            var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

            return _index[parentType].fillColor;
          })
          .attr('cx', plotXcirc)
          .attr('cy', plotYcirc)
          .attr('r', 4)
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
            if (scope[mapID].markers !== null) {
              scope[mapID].markers.setMap(null);
            }

            var _marker = new google.maps.Marker({
              'position': uluru,
              'map': scope[mapID].$g,
              'icon': 'images/spacer.png'
            });

            var _HTMLcontent = '<span class=\"glyphicon glyphicon-map-marker\" style=\"color: ' + scope.$index[parentType].fillColor + '\"></span>&nbsp;' + event.properties.summarized_offense_description;

            var infowindow = new google.maps.InfoWindow({
              content: _HTMLcontent
            });

            infowindow.open(scope[mapID].$g, _marker);

            google.maps.event.addListener(infowindow, 'closeclick', function() {

              scope.incidentDetail = null;

              scope.$apply();

              toolTipHide();
            });

            scope[mapID].$g.setCenter(_marker.getPosition());

            // Cache marker for removal later
            scope[mapID].$markers = infowindow;

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
              toolTipShow(d.properties, this);

              this.setAttribute('r', '8');
            }
          })
          .on('mouseout', function(d) {
            if (!scope.toolTipLock) {
              toolTipHide();
            }
          });

        function toolTipShow(data, element) {
          try {
            scope[mapID].$markers.close();
          } catch (e) {}

          var incident = data;

          var circ = (element !== undefined) ? element :
            reportMarks.selectAll('circle')
            .filter(function(d) {
              return d.properties.general_offense_number === incident.general_offense_number;
            })[0][0];

          if (circ.getAttribute('fill') !== 'transparent') {

            circ.setAttribute('r', '4');

            // Populate tooltop now, need height to calculate offsets
            toolTipEl.html(timeFormatFull(new Date(incident.date_reported)) + ' / ' + incident.offense_type);

            var parent = circ.parentElement;

            var parentbounding = parent.getBoundingClientRect();

            var bounding = circ.getBoundingClientRect();

            var newWdth = bounding.left;

            var newHght = bounding.top;

            var toolTipHght = toolTipEl[0][0].getBoundingClientRect().height;

            var offsetX = true ? (newWdth - parentbounding.left) : 0;

            var offsetY = true ? (newHght - parentbounding.top + toolTipHght + 24) : 0;

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
            .duration(250)
            .attr('r', '4');
          // .attr('opacity', 1);

          scope.toolTipLock = false;

          scope[mapID].$markers = null;

          try {
            scope[mapID].$markers.close();
          } catch (e) {}

          // scope.incidentDetail = _incident;

          // scope.$apply();

        }

        // PUBLIC SCOPE METHODS
        scope[vizID] = {
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

                  return 0;
                }
              })
              .attr('fill', function(d) {
                //  PARENT TYPE
                var offType = d.properties.offense_type;

                var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

                return (filterIndex.indexOf(parentType) < 0) ? _index[parentType].fillColor : "transparent";
              });
          },

          refresh: function() {

            var newPadding = element[0].offsetWidth * 0.05;
            var newWdth = element[0].offsetWidth;
            var newHght = element[0].offsetHeight;

            svg
              .attr({
                height: newHght,
                width: newWdth
              });

            scaleAxisX.range([newPadding, (newWdth - (newPadding * 2))]);

            scaleAxisY.range([newPadding, (newHght - newPadding)]);

            svg.select('g#reports-vz-marks')
              .transition()
              .duration(100)
              .attr('transform', 'translate(' + (newPadding * 1.75) + ', 0)');

            svg.select('.axis.x')
              .transition()
              .duration(100)
              .attr('transform', 'translate(' + (newPadding * 1.75) + ',' + (newHght - 30) + ')')
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
          },

          toolTipHide: function() {
            toolTipHide();
          },

          toolTipShow: function(incident) {
            toolTipShow(incident);
          }
        };
      });

      function plotXcirc(d) {
        var incidentDate = new Date(d.properties.date_reported)
          .toDateString();

        var _q_ = scaleAxisX(new Date(incidentDate));

        return _q_;
      }

      function plotYcirc(d) {
        var incidentDate = new Date(d.properties.date_reported);

        var incidentTime = incidentDate.toTimeString();

        return scaleAxisY(new Date('Wed Dec 31 1969 ' + incidentTime));
      }

    }

    return {
      'link': link,
      'templateUrl': 'crime-view/template-reports-viz.html'
    };

  }]);
