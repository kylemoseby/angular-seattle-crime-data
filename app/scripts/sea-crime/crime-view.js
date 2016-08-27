'use strict';

angular.module('mkm.seaCrimeData', [
    'ngRoute'
  ])
  .service('seattleDataGov', ['$http', '$q', function($http, $q) {

    var _mapBounds = new google.maps.LatLngBounds();

    var _http = $http({
      'method': 'GET',
      'url': 'https://data.seattle.gov/resource/7ais-f98f.json'
        // url: 'scripts/sea-crime/7ais-f98f.json'
    });

    function processIncidentData(data) {
      /*
          Loops through data returns from 'https://data.seattle.gov/resource/7ais-f98f.json'
          Establishes parent/child relationships from offense description
          Assigns incident colors based up incident catefories
          creates a GEOJSON object to pass to mapCanvas directive compatable with Google Maps API standards
      */

      function indexUpdate(_report_) {

        //  PARENT TYPE
        var offType = _report_.offense_type;

        var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

        function updateIndex(typeStr, currentChildren) {

          if (typeStr !== 'VEH-THEFT-AUTO') {

            var newChildren = getChildType(typeStr);

            for (var i = newChildren.length - 1; i >= 0; i--) {
              var childType = newChildren[i];

              if (currentChildren.hasOwnProperty(childType)) {
                currentChildren[childType].count++;
              } else {
                currentChildren[childType] = {
                  $type: childType,
                  count: 1
                };
              }
            }
          }

          return currentChildren;
        }

        /*
            Returns all childtypes from index

            requires report full report type string

            uses indexof('-') to splice string and get childtypes
        */
        function getChildType(typeStr) {

          var q = typeStr;
          var childTypes = [];

          while (q.lastIndexOf('-') !== -1) {
            childTypes.push(q.slice(q.lastIndexOf('-') + 1, q.length));

            q = q.slice(0, q.lastIndexOf('-'));
          }

          return childTypes;
        }

        if (_index_.hasOwnProperty(parentType)) {

          var childrenNow = _index_[parentType].children;

          _index_[parentType].children = updateIndex(offType, childrenNow);

          _index_[parentType].count++;

        } else if (parentType !== undefined) {

          // if code is node found a new $inex object property is created
          _index_[parentType] = {
            'count': 1,
            'offenseCategory': offType === 'VEH-THEFT-AUTO' ? offType : parentType,
            'show': true,
            'children': null
          };

          _index_[parentType].children = updateIndex(offType, {});

        }
      }

      /*
        GET report object

        extends _mapBounds and adds a GEOJSON report object to _plots_
      */
      function plotsAddReport(_report_) {
        var _longitude = Number(_report_.longitude);
        var _latitude = Number(_report_.latitude);

        if (!isNaN(_longitude) && !isNaN(_latitude)) {

          _mapBounds.extend(new google.maps.LatLng(_latitude, _longitude));

          _plots_.push({
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [_longitude, _latitude]
            },
            'properties': _report_
          });

        }

      }

      function setIndexColors() {

        // function colorBrewer(ind) {
        //   var brew = [
        //     '#1f78b4',
        //     '#b2df8a',
        //     '#33a02c',
        //     '#fb9a99',
        //     '#a6cee3',
        //     '#e31a1c',
        //     '#fdbf6f',
        //     '#ff7f00',
        //     '#cab2d6',
        //     '#6a3d9a',
        //     '#ffff99',
        //     '#b15928'
        //   ];

        //   return brew[ind % brew.length];
        // }

        // var q = 0;

        // for (var key in _index_) {

        //   _index_[key].fillColor = colorBrewer(q);

        //   q++;
        // }

        var d3Colour = d3.scale.category20()
          .domain(d3.keys(_index_));

        for (var key in _index_) {
          _index_[key].fillColor = d3Colour(key);
        }
      }


      var _index_ = {};

      var _plots_ = [];

      for (var i = data.length - 1; i >= 0; i--) {

        plotsAddReport(data[i]);

        indexUpdate(data[i]);
      }

      setIndexColors();

      return {
        reports: _plots_,
        index: _index_
      };
    }

    /*
      Promise is resolved with data from returned from _http
       that has been processed by processIncidentData
       this is then rendered by directives
    */
    var _promise = $q.defer();

    _http
      .then(function(response) {
        var processedData = processIncidentData(response.data);

        _promise.resolve({
          'incidents': processedData.reports,
          'index': processedData.index,
          'mapBounds': _mapBounds
        });
      });

    return _promise;

  }])
  .directive('filterReportTypes', [function() {
    function link(scope, element) {

      // Dynamically set property names on view
      var filterInd = element.attr('filter-report-types');
      var filterMap = element.attr('crime-map-filter');
      var filterTime = element.attr('crime-timeline-filter');

      // Used to update class on 'update buttons'
      scope.updated = false;

      /*
        toggles clicked  index values 'show' attribute
        true / false
      */
      scope.filterPushSplice = function($event) {

        $event.cancelBubble = true;

        this.val.show = !this.val.show;

        scope.updated = true;
      };

      /*
        filters any viz and maps based on current index
      */
      scope.filterApply = function($event) {

        $event.preventDefault();

        var _index = this.mapIndexFilter();

        if (typeof this.mapIndexFilter === 'function') {
          this[filterMap].update(_index);
        }

        if (typeof this[filterTime].filterData === 'function') {
          this[filterTime].filterData(_index);
        }

        scope.updated = false;
      };

      /*
        Sets all attributes 'show' to 'false' on index
      */
      scope.filterClear = function($event) {

        $event.preventDefault();

        $event.cancelBubble = true;

        for (var key in this[filterInd]) {

          this[filterInd][key].show = false;
        }

        scope.updated = false;
      };

      /*
        Sets all attributes 'show' to 'true' on index
      */
      scope.filterReset = function($event) {

        $event.preventDefault();

        $event.cancelBubble = true;

        for (var key in this[filterInd]) {

          this[filterInd][key].show = true;
        }

        scope.updated = true;
      };

      scope.mapIndexFilter = function() {
        var _index_ = this[filterInd] || {};

        // Create lookup array for speed
        var filteredArray = [];

        for (var key in _index_) {

          if (!_index_[key].show) {

            filteredArray.push(key);
          }
        }

        return filteredArray;
      };

      // scope.$indexLength = function() {
      //   return (this[filterInd] === undefined || null) ? 0 : Object.keys(this[filterInd]).length;
      // };
    }

    return {
      'link': link,
      'templateUrl': 'views/template-crime-map-filter.html'
    };

  }])
  .directive('summaryList', [function() {

    return {
      'templateUrl': 'views/template-summary-list.html'
    };

  }])
  .directive('crimeReportsSummary', [function() {
    function link(scope, element) {

      var summaryType = element.attr('crime-reports-summary');
      var summaryIndex = element.attr('summary-index');

      scope[summaryType] = {
        data: null,
        filtered: false,
        renderChart: function(reportTypes) {

          scope[summaryType].data = reportTypes;

          scope.$apply();
        }
      };

      /*
        Sets summarytype's data attribute to 'null'
        Hides view from DOM
      */
      scope.clearTypeDetail = function() {
        scope[summaryType].data = null;
      };

      scope.filterTypeDetail = function($event) {

        scope[summaryType].filtered = !scope[summaryType].filtered;

        if (scope[summaryType].filtered) {

          var d = scope[summaryType].data;

          var offenseCategory = (d.offenseCategory === 'VEH-THEFT-AUTO') ? 'VEH' : d.offenseCategory;

          scope.filterClear($event);

          scope[summaryIndex][offenseCategory].show = true;

          scope.filterApply($event);

        } else {

          scope.filterReset($event);

          scope.filterApply($event);
        }
      };
    }

    return {
      'link': link,
      'templateUrl': '/views/template-reports-summary.html'
    };

  }])
  .directive('vizTimeLine', [function() {

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
            pad = 16;
          }

          return pad;
        }

        var elm = element[0];

        var wrapper = d3.select(elm);

        //  SVG DIMENSIONS
        var padding = paddingCalc(elm);
        var wdth = elm.offsetWidth;
        var hght = elm.offsetHeight;

        var svg = wrapper
          .append('svg')
          .attr({
            height: hght,
            width: wdth
          });

        var scaleAxisX = d3.time.scale()
          .range([(padding * 2), (wdth - padding)]);

        var scaleAxisY = d3.time.scale.utc()
          .domain([new Date('Wed Dec 31 1969 00:00:00 GMT-0800 (PST)'), new Date('Wed Dec 31 1969 23:59:00 GMT-0800 (PST)')])
          .range([padding, (hght - padding)]);

        var xAxis = d3.svg.axis()
          .orient('bottom')
          .ticks(d3.time.day, 1)
          // .innerTickSize(-wdth)
          // .outerTickSize(0)
          // .tickPadding(10)
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

              var newPadding = elm.offsetWidth * 0.05;
              var newWdth = elm.offsetWidth;
              var newHght = elm.offsetHeight;

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
      }
    };

  }])
  .directive('mapCanvas', [function() {

    function link(scope, element) {

      var promiseAttr = element.attr('map-promise');
      var vizID = element.attr('map-timeline');

      var crimeReportData = scope[promiseAttr];

      scope.mapID = {
        $g: null
      };

      crimeReportData.promise
        .then(function(data) {
          scope.toolTipLock = scope.toolTipLock || false;

          scope.mapID.markers = null;

          scope.markerOver = null;

          scope.mapID.refresh = function() {
            scope.mapID.$g.fitBounds(data.mapBounds);
          };

          scope.mapID.$g = new google.maps.Map(document.getElementById('map-canvas'), {
            'scrollwheel': false,
            'streetViewControl': false,
            'mapTypeControl': false,
            'panControl': false
          });

          scope.mapID.$g.setOptions({
            'styles': [{
              'stylers': [{
                'hue': '#fff'
              }, {
                'saturation': -100
              }]
            }, {
              'featureType': 'road',
              'elementType': 'geometry',
              'stylers': [{
                'lightness': 100
              }, {
                'visibility': 'simplified'
              }]
            }, {
              'featureType': 'road',
              'elementType': 'labels',
              'stylers': [{
                'visibility': 'off'
              }]
            }, {
              'featureType': 'transit.line',
              'stylers': [{
                'visibility': 'off'
              }]
            }, {
              'featureType': 'poi',
              'stylers': [{
                'visibility': 'off'
              }]
            }, {
              'featureType': 'water',
              'elementType': 'labels',
              'stylers': [{
                'visibility': 'off'
              }]
            }, {
              'featureType': 'road',
              'stylers': [{
                'visibility': 'on'
              }]
            }]
          });

          function plotstyleBasic(feature) {
            if (scope.mapID.$g !== undefined && scope.mapID.$g !== undefined) {

              //  PARENT TYPE
              var offType = feature.f.offense_type;

              var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

              var offense = scope.$index[parentType];

              return {
                icon: {
                  'path': google.maps.SymbolPath.CIRCLE,
                  'scale': 3,
                  'fillColor': offense.fillColor,
                  'fillOpacity': 1,
                  'strokeWeight': 0
                }
              };
            }
          }

          function markerClick(event) {
            scope.toolTipLock = true;

            // Map data
            var currentFiltered = scope.mapIndexFilter();

            //  PARENT TYPE
            var offType = event.feature.f.offense_type;

            var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

            if (currentFiltered.indexOf(parentType) === -1) {

              var _incident = event.feature.f;

              var _latitude = Number(_incident.latitude);
              var _longitude = Number(_incident.longitude);

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

              var _HTMLcontent = '<span class=\"glyphicon glyphicon-map-marker\" style=\"color: ' + scope.$index[parentType].fillColor + '\"></span>&nbsp;' + _incident.summarized_offense_description;

              var infowindow = new google.maps.InfoWindow({
                content: _HTMLcontent
              });

              infowindow.open(scope.mapID.$g, _marker);

              google.maps.event.addListener(infowindow, 'closeclick', function() {

                scope.incidentDetail = null;

                scope.$apply();

                scope[vizID].toolTipHide();
              });

              scope.mapID.$g.setCenter(_marker.getPosition());

              // Cache marker for removal later
              scope.mapID.markers = infowindow;

              scope.incidentDetail = _incident;

              scope.$apply();

              scope[vizID].toolTipShow(_incident);

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
            }
          }

          scope.mapID.$g.data.addGeoJson({
            'type': 'FeatureCollection',
            'features': data.incidents
          });

          scope.mapID.$g.data.setStyle(plotstyleBasic);

          scope.mapID.$g.data.addListener('click', function($event) {
            markerClick($event);
          });

          scope.mapID.$g.fitBounds(data.mapBounds);

          scope.mapID.update = function(indexArray) {
            function indexSelected(feature) {
              //  PARENT TYPE
              var offType = feature.f.offense_type;

              var parentType = (offType.indexOf('-') === -1) ? offType : offType.slice(0, offType.indexOf('-'));

              var filterOffence = (indexArray.indexOf(parentType) > -1);

              var offenseHex = scope.$index[parentType].fillColor;

              return {
                icon: {
                  'path': google.maps.SymbolPath.CIRCLE,
                  'scale': 2.75,
                  'fillColor': filterOffence ? 'transparent' : offenseHex,
                  'fillOpacity': filterOffence ? 0 : 1,
                  'strokeWeight': 0,
                  'zIndex': filterOffence ? 100 : 1
                }
              };
            }

            scope.mapID.$g.data.setStyle(indexSelected);
          };

        });
    }

    return {
      'link': link,
      'templateUrl': 'views/template-map-canvas.html'
    };

  }])
  .directive('incidentDetail', [function() {

    function link(scope, element) {
      var vizID = element.attr('timeline-id');

      scope.incidentDetail = null;

      if (document.getElementById('street-view-detail') !== null) {

        scope.$detailMap = new google.maps.Map(document.getElementById('street-view-detail'), {
          zoom: 14
        });
      }

      scope.closeDetail = function() {
        try {
          scope.mapID.$markers.close();
        } catch (e) {}

        scope[vizID].toolTipHide();

        this.incidentDetail = null;
      };
    }

    return {
      'link': link,
      'templateUrl': 'views/template-incident-detail.html'
    };

  }])
  .filter('orderObjectBy', function() {
    /*
        Originally found at:

        http://justinklemm.com/angularjs-filter-ordering-objects-ngrepeat/
    */
    return function(items, field, reverse) {

      var filtered = [];

      angular.forEach(items, function(item) {
        filtered.push(item);
      });

      filtered.sort(function(a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });

      if (reverse) {
        filtered.reverse();
      }

      return filtered;
    };

  });
