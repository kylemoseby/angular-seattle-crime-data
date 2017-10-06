"use strict";
angular.module("mkm.seaCrimeData", ["ngMaterial", "mkm.mapStyle"]).service("seattleDataGov", ["$http", "$q", function($http, $q) {
  var _http = $http({ method: "GET", url: "https://data.seattle.gov/resource/7ais-f98f.json" });
  var _promise = $q.defer();
  _http.then(function(response) {
    function getIncidentParent(report) { return report.indexOf("-") === -1 ? report : report.slice(0, report.indexOf("-")) }
    var $offTypeNest = d3.nest().key(function(d) {
      try { return getIncidentParent(d.offense_type) } catch (e) {
        console.log(e);
        console.log(d)
      }
    }).entries(response.data);
    var $typeColorScale = d3.scaleOrdinal().domain($offTypeNest.map(function(d) { return d.key })).range(d3.schemeCategory20);
    _promise.resolve({ incidents: response.data, indexOffType: $offTypeNest, colorScaleOff: $typeColorScale })
  });
  return _promise
}]).controller("CrimeReportrsCtrl", ["$scope", "seattleDataGov", "mapStyle", function($scope, seattleDataGov, mapStyle) {
  $scope.$seaCrimeData = seattleDataGov;
  $scope.$seaCrimeData.promise.then(function(data) {
    $scope.$index = data.index;
    $scope.$reports = data.incidents
  });
  $scope.mapStyle = mapStyle
}]);
angular.module("mkm.seaCrimeData").directive("filterReportTypes", [function() {
  return {
    templateUrl: "views/template-crime-map-filter.html",
    scope: { filterInd: "=filterReportTypes", filterMap: "=crimeMapFilter", filterTime: "=crimeTimelineFilter" },
    link: function(scope) {
      scope.updated = false;
      scope.filterPushSplice = function($event) {
        $event.preventDefault();
        $event.cancelBubble = true;
        this.val.show = !this.val.show;
        scope.updated = true
      };
      scope.filterApply = function($event) {
        $event.preventDefault();
        var _index = this.mapIndexFilter();
        scope.filterMap.update(_index);
        scope.filterTime.filterData(_index);
        scope.updated = false
      };
      scope.filterClear = function($event) {
        $event.preventDefault();
        $event.cancelBubble = true;
        for (var key in scope.filterInd) { scope.filterInd[key].show = false } scope.updated = false
      };
      scope.filterReset = function($event) {
        $event.preventDefault();
        $event.cancelBubble = true;
        for (var key in scope.filterInd) { scope.filterInd[key].show = true } scope.updated = true
      };
      scope.mapIndexFilter = function() { var _index_ = scope.filterInd || {}; var filteredArray = []; for (var key in _index_) { if (!_index_[key].show) { filteredArray.push(key) } } return filteredArray }
    }
  }
}]);
angular.module("mkm.seaCrimeData").directive("incidentDetail", [function() {
  function link(scope, element) {
    var vizID = element.attr("timeline-id");
    scope.incidentDetail = null;
    if (document.getElementById("street-view-detail") !== null) { scope.$detailMap = new google.maps.Map(document.getElementById("street-view-detail"), { zoom: 14 }) } scope.closeDetail = function() {
      try { scope.mapID.$markers.close() } catch (e) {} scope[vizID].toolTipHide();
      this.incidentDetail = null
    }
  }
  return { link: link, templateUrl: "views/template-incident-detail.html" }
}]);
angular.module("mkm.seaCrimeData").directive("crimeReportsBlock", ["$window", "$mdPanel", function($window, $mdPanel) {
  return {
    templateUrl: "views/template-reports-block.html",
    scope: { $promise: "=crimeReportsData" },
    link: function(scope, element) {
      var $elm = element[0];
      scope.$panel = $mdPanel;
      var padding = $elm.offsetWidth * .033;
      var wdth = $elm.offsetWidth;
      var hght = $elm.offsetHeight;
      var barHght = hght - padding - hght * .45;
      var wrapper = d3.select($elm);
      wrapper.append("svg").attr("height", hght).attr("width", wdth);
      var progressBar = wrapper.select(".loading-wrapper");
      var svg = wrapper.select("svg");
      var rectGroup = svg.selectAll("g.reports-index-rect");
      scope.progress = { now: 2, max: 100, loaded: 2 };

      function progressUpdate() {
        scope.progress.now++;
        scope.progress.loaded = scope.progress.now / scope.progress.max * 100
      }

      function hideProgressBar() { progressBar.classed("loaded", true) }
      var scaleAxisX = d3.scaleBand().range([padding, wdth - padding]);
      var scaleAxisY = d3.scaleLinear().range([padding, barHght]);

      function checkVehKey(reportKey) { return reportKey === "VEH-THEFT-AUTO" ? "VEH" : reportKey }

      function renderBlocksWithData(data) {
        var _index_ = data.indexOffType.sort(function(a, b) { return d3.descending(a.values.length, b.values.length) });
        scope.progress.max = _index_.length;
        var colorScale = data.colorScaleOff;
        var axisTitles = _index_.map(function(d) { return checkVehKey(d.key) });
        scaleAxisX.domain(axisTitles.reverse());
        scaleAxisY.domain([0, d3.max(_index_, function(d) { return d.values.length })]);

        function typeDetailModalInit(d) {
          var position = scope.$panel.newPanelPosition().absolute().center();
          scope.$panel.open({
            attachTo: angular.element(document.body),
            controllerAs: "ctrl",
            disableParentScroll: true,
            templateUrl: "views/template-report-type-detail.html",
            hasBackdrop: true,
            panelClass: "report-type-detail",
            position: position,
            trapFocus: true,
            zIndex: 150,
            clickOutsideToClose: true,
            escapeToClose: true,
            focusOnOpen: true,
            targetEvent: event,
            locals: { reportType: d },
            controller: function($scope, mdPanelRef, reportType) {
              console.log(reportType);
              $scope.reportType = reportType;
              $scope.reportType.fillColor = colorScale(reportType.key);
              $scope.dataTypeDay = d3.nest().key(function(d) { var byDay = d3.timeFormat("%x"); return byDay(new Date(d.date_reported)) }).entries(reportType.values);
              $scope.dataTypeChild = d3.nest().key(function(d) { return d.offense_type }).entries(reportType.values);
              $scope.dataZoneBeat = d3.nest().key(function(d) { return d.district_sector }).key(function(d) { return d.zone_beat }).entries(reportType.values);
              $scope.closeDetail = function() { mdPanelRef.close() }
            }
          })
        }
        rectGroup.data(_index_).enter().append("g").attr("id", function(d) { return d.key }).attr("class", "reports-index-rect").attr("transform", "translate(" + padding + ",80)");
        var labelCatg = svg.selectAll("g.reports-index-rect").append("text").attr("transform", function(d) { var xTrans = scaleAxisX(checkVehKey(d.key)); return "translate(" + (xTrans - scaleAxisX.bandwidth() * .33) + ", " + (barHght - padding + 9) + ") rotate(-50)" }).attr("text-anchor", "end").attr("class", "block-label category").text(function(d) { return d.key });
        var labelCnt = svg.selectAll("g.reports-index-rect").append("text").attr("transform", function(d) { var xTrans = scaleAxisX(checkVehKey(d.key)); return "translate(" + (xTrans - scaleAxisX.bandwidth() * .5) + ", " + (barHght - scaleAxisY(d.values.length) - padding - 5) + ")" }).attr("class", "block-label count").attr("text-anchor", "middle").text(function(d) { return d.values.length });
        var rect = svg.selectAll("g.reports-index-rect").append("rect").attr("transform", function(d) { var scaleVal = scaleAxisX(checkVehKey(d.key)); return "translate(" + scaleVal + "," + (barHght - padding) * 2 + ") rotate(180)" }).attr("y", function() { return barHght - padding }).attr("width", scaleAxisX.bandwidth()).attr("height", function(d) { return scaleAxisY(d.values.length) }).attr("fill", function(d) { progressUpdate(); return colorScale(d.key) }).on("click", typeDetailModalInit);

        function _refreshBlocks() {
          padding = $elm.offsetWidth * .033;
          wdth = $elm.offsetWidth;
          hght = $elm.offsetHeight;
          barHght = hght - padding - 120;
          svg.attr("height", hght).attr("width", wdth);
          scaleAxisX.range([padding, wdth - padding]);
          scaleAxisY.range([padding, barHght]);
          var t = d3.transition().duration(100).ease(d3.easeLinear);
          labelCatg.transition(t).attr("transform", function(d) { var xTrans = scaleAxisX(checkVehKey(d.key)); return "translate(" + (xTrans - scaleAxisX.bandwidth() * .33) + ", " + (barHght - padding + 7) + ") rotate(-50)" });
          labelCnt.transition(t).attr("transform", function(d) { var xTrans = scaleAxisX(checkVehKey(d.key)); return "translate(" + (xTrans - scaleAxisX.bandwidth() * .5) + ", " + (barHght - scaleAxisY(d.values.length) - padding - 6) + ")" });
          rect.transition(t).attr("transform", function(d) { var scaleVal = scaleAxisX(checkVehKey(d.key)); return "translate(" + scaleVal + "," + (barHght - padding) * 2 + ") rotate(180)" }).attr("y", function() { return barHght - padding }).attr("width", scaleAxisX.bandwidth()).attr("height", function(d) { return scaleAxisY(d.values.length) })
        }
        angular.element($window).bind("resize", _refreshBlocks);
        scope.blockID = { refreshBlocks: _refreshBlocks }
      }
      scope.$promise.promise.then(renderBlocksWithData);
      scope.$promise.promise.finally(hideProgressBar)
    }
  }
}]);
angular.module("mkm.seaCrimeData").directive("seattleCrimeMap", ["seattleDataGov", "mapStyle", "$mdPanel", function(seattleDataGov, mapStyle, $mdPanel) {
  return {
    controller: function($scope) {
      $scope.getIncidentParent = function(report) { return report.indexOf("-") === -1 ? report : report.slice(0, report.indexOf("-")) };
      var $panel = $mdPanel;
      var $detailModal = function(_incident) {
        console.log(_incident);
        var position = $panel.newPanelPosition().absolute().center();
        $panel.open({
          attachTo: angular.element(document.body),
          controller: function($scope, mdPanelRef, incidentDetail) {
            $scope.incidentDetail = incidentDetail;
            $scope.closeDetail = function() {
              this.incidentDetail = null;
              mdPanelRef.close()
            }
          },
          panelClass: "map-report-detail",
          controllerAs: "ctrl",
          templateUrl: "views/template-incident-detail.html",
          zIndex: 150,
          disableParentScroll: true,
          hasBackdrop: true,
          position: position,
          trapFocus: true,
          clickOutsideToClose: true,
          escapeToClose: true,
          focusOnOpen: true,
          targetEvent: event,
          locals: { incidentDetail: _incident }
        }).finally(function() {
          var $modalElm = document.getElementById("street-view-detail");
          var StreetView = new google.maps.Map($modalElm, { scrollwheel: false, zoomControl: false, zoom: 0 });
          var panorama = new google.maps.StreetViewPanorama($modalElm, { position: { lat: Number(_incident.latitude), lng: Number(_incident.longitude) }, pov: { heading: 34, pitch: 1 }, zoom: 0, scrollwheel: false });
          StreetView.setStreetView(panorama)
        })
      };
      var infowindow = new google.maps.InfoWindow;
      $scope.$infoWindow = function(map, report) {
        var _r_ = report.feature.f;
        infowindow.setContent('<ul class="list-unstyled">' + '<li><span class="glyphicon glyphicon-pushpin" style="color: ' + $scope.colorScaleOff($scope.getIncidentParent(_r_.offense_type)) + '"></span>' + _r_.offense_type + " " + _r_.date_reported + "</li>" + "<li>Block: " + _r_.hundred_block_location + "</li>" + "<li>Description: " + _r_.summarized_offense_description + "</li>" + '<li><button id="map-info-btn" class="btn btn-sm btn-primary"><span class="glyphicon glyphicon-new-window"></span></button></li>' + "</ul>");
        var marker = new google.maps.Marker({ position: report.latLng.toJSON(), map: map, title: _r_.offense_type, icon: "images/spacer.gif" });
        infowindow.open(map, marker);
        google.maps.event.addListener(infowindow, "domready", function() {
          var infoWinBtn = d3.select("#map-info-btn");
          infoWinBtn.on("click", function() {
            console.log(_r_);
            $detailModal(_r_)
          })
        })
      };
      $scope.$seaCrimeData = seattleDataGov;
      $scope.$seaCrimeData.promise.then(function(data) {
        $scope.$index = data.index;
        $scope.$reports = data.incidents;
        $scope.dateRange = d3.extent(data.incidents, function(d) { return new Date(d.date_reported) });
        $scope.filters.startDate = $scope.dateRange[0];
        $scope.filters.endDate = $scope.dateRange[1];
        $scope.indexOffType = data.indexOffType;
        $scope.colorScaleOff = data.colorScaleOff
      }).finally(function() { console.log("finally") });
      $scope.mapStyle = mapStyle !== undefined ? mapStyle : null
    }
  }
}]).directive("mapCanvas", ["$window", function($window) {
  return {
    require: "^seattleCrimeMap",
    link: function($scope, $element) {
      $scope.$map = function() {
        var $googleMap = new google.maps.Map($element[0], { scrollwheel: false, streetViewControl: false, mapTypeControl: false, panControl: false, maxZoom: 17 });

        function markerClick($event) { $scope.$infoWindow($googleMap, $event) } $googleMap.data.addListener("click", markerClick);
        if (!!$scope.mapStyle) { $googleMap.setOptions($scope.mapStyle) }
        return {
          addCrimeData: function(reports) {
            var plots = [];
            var $mapBounds = new google.maps.LatLngBounds;

            function filterByDate(reportDate) { var dateReported = new Date(reportDate); return dateReported >= $scope.filters.startDate && dateReported <= $scope.filters.endDate ? true : false }

            function filterByType(reportType) { return $scope.filters.reportFilter.indexOf($scope.getIncidentParent(reportType)) > -1 ? false : true }
            for (var i = reports.length - 1; i >= 0; i--) {
              var _report_ = reports[i];
              var long = Number(_report_.longitude);
              var lati = Number(_report_.latitude);
              if (!isNaN(long) && !isNaN(lati)) {
                if (filterByDate(_report_.date_reported)) {
                  if (filterByType(_report_.offense_type)) {
                    $mapBounds.extend(new google.maps.LatLng(lati, long));
                    plots.push({ type: "Feature", geometry: { type: "Point", coordinates: [long, lati] }, properties: _report_ })
                  }
                }
              }
            }
            $googleMap.data.addGeoJson({ type: "FeatureCollection", features: plots });
            var filteredNest = d3.nest().key(function(d) {
              try { return $scope.getIncidentParent(d.properties.offense_type) } catch (e) {
                console.log(e);
                console.log(d)
              }
            }).entries(plots);
            $scope.filters.indexDateDisabled = filteredNest.map(function(d) { return d.key });
            $googleMap.fitBounds($mapBounds);
            angular.element($window).bind("resize", function() { $googleMap.fitBounds($mapBounds) });
            return this
          },
          applyFilters: function() { $googleMap.data.setStyle(function(feature) { return { icon: { path: google.maps.SymbolPath.CIRCLE, scale: 4, fillColor: typeof $scope.colorScaleOff === "function" ? $scope.colorScaleOff($scope.getIncidentParent(feature.f.offense_type)) : "transparent", fillOpacity: 1, strokeWeight: 0 } } }); return this },
          removeCrimeData: function() { $googleMap.data.forEach(function(feature) { $googleMap.data.remove(feature) }); return this }
        }
      }();
      $scope.mapRefresh = function() { $scope.$map.removeCrimeData() };
      $scope.filterToggleType = function($event) {
        $event.preventDefault();
        $event.cancelBubble = true;
        var toggleKey = $scope.filters.reportFilter.indexOf(this.val.key);
        if (toggleKey === -1) { $scope.filters.reportFilter.push(this.val.key) } else { $scope.filters.reportFilter.splice(toggleKey, 1) } $scope.showApply = true
      };
      $scope.filterAll = function() { for (var filter in $scope.indexOffType) { $scope.filters.reportFilter.push($scope.indexOffType[filter].key) } $scope.showApply = true };
      $scope.filterNone = function() {
        $scope.filters.reportFilter = [];
        $scope.showApply = true
      };
      $scope.dateChange = function($event) {
        $event.preventDefault();
        $scope.showApply = true
      };
      $scope.filterApply = function($event) {
        $event.preventDefault();
        $scope.$map.removeCrimeData();
        $scope.$map.addCrimeData($scope.$reports, $scope.filters);
        $scope.$map.applyFilters();
        $scope.showApply = false
      };
      if ($scope.$seaCrimeData !== undefined) { $scope.$seaCrimeData.promise.then(function(data) { $scope.$map.addCrimeData(data.incidents).applyFilters() }) } else if ($scope.report !== undefined) {
        var report = $scope.report;
        $scope.filters.startDate = new Date(report.date_reported);
        $scope.filters.endDate = new Date(report.date_reported);
        var _longitude = Number(report.longitude);
        var _latitude = Number(report.latitude);
        if (!isNaN(_longitude) && !isNaN(_latitude)) {
          var detailBounds = new google.maps.LatLngBounds;
          detailBounds.extend(new google.maps.LatLng(_latitude, _longitude));
          $scope.$map.addCrimeData([report]).applyFilters()
        }
      }
    }
  }
}]).directive("mapFilters", [function() {
  return {
    require: "^seattleCrimeMap",
    templateUrl: "views/template-map-filters.html",
    link: function($scope) {
      $scope.filters = { reportFilter: [], indexDateDisabled: [], startDate: new Date, endDate: new Date };
      $scope.showApply = false;
      $scope.colorScaleOff = d3.schemeCategory20
    }
  }
}]);
angular.module("mkm.seaCrimeData").directive("seattleCrimePlotted", ["$http", function($http) {
  function _controller_($scope, $element) {
    $element.addClass("loading");
    $scope._seaCrimeData_ = $http({ method: "GET", url: "https://data.seattle.gov/resource/7ais-f98f.json" });
    $scope._offenseCodes_ = $http({ method: "GET", url: "https://data.seattle.gov/resource/aj7i-nahf.json" }).then(function(response) { $scope.offCodeMap = d3.map(response.data, function(d) { return d.summary_offense_code }) }).finally(function() { $element.removeClass("loading") });
    $scope.disp = { axis: "district", color: "extension", circRad: 5 };
    $scope.filter = { extension: {}, district: {} };
    var $scales = $scope.scales = { dateReported: d3.scaleTime(), extBand: d3.scaleBand(), extColour: d3.scaleOrdinal(d3.schemeCategory20), distBand: d3.scaleBand(), distColour: d3.scaleOrdinal(d3.schemeCategory20b) };
    $scope.setElementScales = function(_svg_) {
      var svgElm = _svg_.node();
      $scales.dateReported.range([40, svgElm.width.baseVal.value - 40]);
      $scales.distBand.range([40, svgElm.height.baseVal.value - 40]);
      $scales.extBand.range([40, svgElm.height.baseVal.value - 40])
    };
    $scope.setDataScales = function(dataArr) {
      var dateReportedExt = d3.extent(dataArr, function(d) { return new Date(d.date_reported) });
      $scales.dateReported.domain(dateReportedExt);
      var distrists = [];
      var offenseCode = [];
      dataArr.forEach(function(d) { if (!distrists.includes(d.district_sector)) { distrists.push(d.district_sector) } if (!offenseCode.includes(d.summary_offense_code)) { offenseCode.push(d.summary_offense_code) } });
      $scales.extBand.domain(offenseCode);
      $scales.distBand.domain(distrists)
    };

    function calcTotals(response) {
      function d3Nest(_data, _prop) { return d3.nest().key(function(d) { return d[_prop] }).entries(_data) } $scope.offCodes = d3Nest(response.data, "summary_offense_code");
      $scope.districts = d3Nest(response.data, "district_sector")
    }
    $scope._seaCrimeData_.then(calcTotals)
  }
  return { controller: _controller_ }
}]).directive("crimePlotMenu", [function() {
  function _link_($scope) {
    $scope.isIndeterminate = function() { return $scope.selected.length !== 0 && $scope.selected.length !== $scope.items.length };
    $scope.isChecked = function(type) { var _filter_ = $scope.filter[type]; var checked = true; if (Object.keys(_filter_).length > 0) { for (var key in _filter_) { if (!_filter_[key]) { checked = false; break } } } return checked };
    $scope.toggleAll = function(type) { var vals = Object.values($scope.filter[type]); var $test = vals.every(function(d) { return d === true }); for (var key in $scope.filter[type]) { $scope.filter[type][key] = !$test } $scope.filterCircle() };
    $scope.fileterChange = function() {
      console.log("cahnged");
      $scope.filterCircle()
    }
  }
  return { require: "^seattleCrimePlotted", templateUrl: "views/template-crime-plot-menu.html", link: _link_ }
}]).directive("crimePlotSvg", ["$window", "crimeReportPanelPlots", function($window, $reportPanel) {
  function _link_($scope, $element) {
    var $panel = $reportPanel();
    var $svg = d3.select($element[0]).append("svg");
    var xAxis = d3.axisBottom().ticks(d3.timeHour, 24).tickFormat(d3.timeFormat("%m/%d"));
    var yAxisDist = d3.axisLeft();
    var yAxisExt = d3.axisLeft();
    var axDate = $svg.append("g").attr("class", "axis x");
    var axDist = $svg.append("g").attr("transform", "translate(35, -22)").attr("class", "axis y dist").attr("opacity", 1);
    var axExt = $svg.append("g").attr("transform", "translate(35, -22)").attr("class", "axis y type").attr("opacity", 0);

    function callAxis(_scales_) {
      xAxis.scale(_scales_.dateReported);
      axDate.call(xAxis);
      yAxisDist.scale(_scales_.distBand);
      yAxisExt.scale(_scales_.extBand);
      axDist.call(yAxisDist);
      axExt.call(yAxisExt)
    }
    var circWrap = $svg.append("g").attr("class", "crime-report-plots");
    var $scales = $scope.scales;
    var _t_ = d3.transition().duration(950).ease(d3.easeLinear);

    function debounce(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this,
          args = arguments;
        var later = function() { timeout = null; if (!immediate) { func.apply(context, args) } };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) { func.apply(context, args) }
      }
    }

    function _init_(response) {
      var crimeReports = response.data;
      $svg.attr("height", $element[0].offsetHeight).attr("width", $element[0].offsetWidth);
      $scope.setElementScales($svg);
      $scope.setDataScales(crimeReports);
      callAxis($scales);

      function calcCircR(d) { if (!$scope.filter.extension[d.summary_offense_code] && !$scope.filter.district[d.district_sector]) { return $scope.disp.circRad / 10 + "vh" } else { return "0px" } } $scope.circles = circWrap.selectAll("circle").data(response.data).enter().append("circle").attr("r", calcCircR).attr("class", "timeline-circle").attr("cx", function(d) { return $scales.dateReported(new Date(d.date_reported)) }).attr("cy", function(d) { return $scales.distBand(d.district_sector) }).style("fill", function(d) { $scales.distColour(d.district_sector); return $scales.extColour(d.summary_offense_code) }).on("click", function(d) { $panel.showPanel(d, d3.event, this) });

      function reloadCanvas() {
        $svg.attr("height", $element[0].offsetHeight).attr("width", $element[0].offsetWidth);
        $scope.setElementScales($svg);
        $scope.circles.transition(_t_).attr("cx", function(d) { return $scales.dateReported(new Date(d.date_reported)) }).attr("cy", function(d) { if ($scope.disp.axis === "district") { return $scales.distBand(d.district_sector) } else if ($scope.disp.axis === "extension") { return $scales.extBand(d.summary_offense_code) } });
        callAxis($scales)
      }
      $scope.setCircleRad = function() {
        console.log("fired");
        debounce(function() { $scope.circles.transition(_t_).attr("r", calcCircR) }, 250)
      };
      $scope.filterCircle = reloadCanvas;
      $scope.circSetColorType = function() {
        $scope.circles.transition(_t_).style("fill", function(d) { return $scales.extColour(d.summary_offense_code) });
        $scope.disp.color = "extension"
      };
      $scope.circSetColorDist = function() {
        $scope.circles.transition(_t_).style("fill", function(d) { return $scales.distColour(d.district_sector) });
        $scope.disp.color = "district"
      };

      function plotDistricts() {
        axDist.attr("opacity", 1);
        axExt.attr("opacity", 0);
        $scope.circles.transition(_t_).attr("cy", function(d) { return $scales.distBand(d.district_sector) })
      }

      function plotCodeExt() {
        axDist.attr("opacity", 0);
        axExt.attr("opacity", 1);
        $scope.circles.transition(_t_).attr("cy", function(d) { return $scales.extBand(d.summary_offense_code) })
      }
      $scope.toggleAxis = function() {
        if ($scope.disp.axis === "extension") {
          plotDistricts();
          $scope.disp.axis = "district"
        } else if ($scope.disp.axis === "district") {
          plotCodeExt();
          $scope.disp.axis = "extension"
        }
      };
      angular.element($window).bind("resize", debounce(reloadCanvas, 250));
      $scope.scaleType = $scales.extColour;
      $scope.scaleDist = $scales.distColour
    }
    $scope._seaCrimeData_.then(_init_)
  }
  return { require: ["^seattleCrimePlotted"], link: _link_ }
}]).factory("crimeReportPanelPlots", ["$mdPanel", function($mdPanel) {
  var $panel = $mdPanel;

  function _showPanel(d, $event, d3elm) {
    var $elm = angular.element(d3elm);
    var panelPosition = $mdPanel.newPanelPosition().relativeTo($elm);
    var panelAnimation = $mdPanel.newPanelAnimation().openFrom($elm).duration(137).closeTo($elm).withAnimation($mdPanel.animation.SCALE);
    var config = { attachTo: angular.element(document.body), controller: DialogController, controllerAs: "ctrl", position: panelPosition, animation: panelAnimation, targetEvent: $event, panelClass: "timeline-report-detail-panel", templateUrl: "views/timeline-report-detail-panel.html", clickOutsideToClose: true, escapeToClose: true, focusOnOpen: true, locals: { report: d } };
    $panel.open(config).then(function(result) { $panel = result })
  }

  function DialogController($scope, mdPanelRef, report) {
    $scope.report = report;
    $scope.keys = Object.keys(report);
    $scope.closeDialog = function() { if (mdPanelRef) { mdPanelRef.close() } }
  }
  return function reportPanel() { return { showPanel: _showPanel } }
}]);
angular.module("mkm.seaCrimeData").directive("crimeReportsSummary", [function() {
  function link(scope, element) {
    var summaryType = element.attr("crime-reports-summary");
    var summaryIndex = element.attr("summary-index");
    scope[summaryType] = {
      data: null,
      filtered: false,
      renderChart: function(reportTypes) {
        scope[summaryType].data = reportTypes;
        scope.$apply()
      }
    };
    scope.clearTypeDetail = function() { scope[summaryType].data = null };
    scope.filterTypeDetail = function($event) {
      scope[summaryType].filtered = !scope[summaryType].filtered;
      if (scope[summaryType].filtered) {
        var d = scope[summaryType].data;
        var offenseCategory = d.offenseCategory === "VEH-THEFT-AUTO" ? "VEH" : d.offenseCategory;
        scope.filterClear($event);
        scope[summaryIndex][offenseCategory].show = true;
        scope.filterApply($event)
      } else {
        scope.filterReset($event);
        scope.filterApply($event)
      }
    }
  }
  return { link: link, templateUrl: "/views/template-reports-summary.html" }
}]);
angular.module("mkm.seaCrimeData").directive("vizTimeLine", ["$window", "$mdPanel", function($window, $mdPanel) {
  return {
    templateUrl: "views/template-reports-viz.html",
    scope: { promiseAttr: "=vizTimeData" },
    link: function(scope, element) {
      scope.getIncidentParent = function(report) { return report.indexOf("-") === -1 ? report : report.slice(0, report.indexOf("-")) };
      var getIncidentParent = scope.getIncidentParent;
      scope.$panel = $mdPanel;
      scope.reportFilter = [];
      var elm = element.children(".crime-report-timeline")[element.children(".crime-report-timeline").length - 1];
      var padding = 10;
      var wdth = elm.offsetWidth;
      var hght = elm.offsetHeight;
      var calcPadding = { x: function(_wdth_) { return [padding, _wdth_ - 40] }, y: function(_hght_) { return [padding + 10, _hght_ - padding - 30] } };
      var wrapper = d3.select(elm);
      wrapper.append("svg").attr("height", hght).attr("width", wdth).attr("class", "seattle-crime-timeline");
      var svg = wrapper.select("svg");
      var toolTip = d3.select("body").append("div").classed("cicle-tool-tip", true);
      var scaleAxisX = d3.scaleTime().range(calcPadding.x(wdth));
      var scaleAxisY = d3.scaleUtc().domain([new Date("Wed Dec 31 1969 00:00:00 GMT-0800 (PST)"), new Date("Wed Dec 31 1969 24:00:00 GMT-0800 (PST)")]).range(calcPadding.y(hght));
      var xAxis = d3.axisBottom().ticks(d3.timeHour, 24).tickFormat(d3.timeFormat("%m/%d")).scale(scaleAxisX);
      var yAxis = d3.axisLeft();
      scope.toolTipLock = scope.toolTipLock || false;

      function _init_(data) {
        var _incidents = data.incidents;
        scope.$index = data.indexOffType;
        scope.colorScaleOff = data.colorScaleOff;

        function colorScaleApply(reportType) { return scope.colorScaleOff(getIncidentParent(reportType)) }
        var dateRange = d3.extent(_incidents, function(d, i) { return i === 0 ? d3.timeDay.floor(new Date(d.date_reported)) : new Date(d.date_reported) });
        scaleAxisX.domain(dateRange);
        xAxis.scale(scaleAxisX);
        yAxis.scale(scaleAxisY);

        function setCircStyle(currentState, d) {
          var colour = colorScaleApply(d.offense_type);
          switch (currentState) {
            case "initial":
              return "stroke: " + colour + "; stroke-width: " + "2px" + "; fill-opacity: " + "0" + "; stroke-opacity: " + ".67";
            case "mouseover":
              return "fill: " + colour + "; stroke-width: " + "0px" + "; fill-opacity: " + "1" + "; stroke-opacity: " + ".67";
            case "mouseout":
              return "stroke: " + colour + "; stroke-width: " + "2px" + "; fill-opacity: " + "0" + "; stroke-opacity: " + ".67"
          }
        }

        function plotXcirc(d) { var incidentDate = new Date(d.date_reported); var timeFormat = d3.timeFormat("%x"); return scaleAxisX(new Date(timeFormat(incidentDate))) }

        function plotYcirc(d) { var timeFormat = d3.timeFormat("%X"); var incidentTime = timeFormat(new Date(d.date_reported)); return scaleAxisY(new Date("Wed Dec 31 1969 " + incidentTime)) }

        function _toolTipShow(data) {
          var incident = data;
          var timeFormatFull = d3.timeFormat("%x %H:%M %p");
          toolTip.html(timeFormatFull(new Date(incident.date_reported)) + " / " + incident.offense_type).style("left", function() { if (d3.event.offsetX > wdth * .5) { return d3.event.pageX - 330 + "px" } else { return d3.event.pageX + 24 + "px" } }).style("top", function() { return d3.event.pageY - 21 + "px" }).classed({ "left-side": d3.event.offsetX < wdth * .5, "rght-side": d3.event.offsetX > wdth * .5 });
          toolTip.transition(d3.transition().duration(200)).style("opacity", 1).style("background", function() { return colorScaleApply(incident.offense_type) }).attr("transform", "translate(" + padding + "," + hght + ")")
        }

        function toolTipHide() {
          toolTip.transition(d3.transition().duration(500)).style("opacity", 0);
          reportMarks.selectAll("circle").transition(d3.transition().duration(250));
          scope.toolTipLock = false
        }

        function crimeReportDetail($scope, mdPanelRef, incidentDetail) {
          $scope.incidentDetail = incidentDetail;
          $scope.closeDetail = function() {
            this.incidentDetail = null;
            mdPanelRef.close()
          }
        }

        function reportDetailShow(event) {
          var position = scope.$panel.newPanelPosition().absolute().center();
          scope.$panel.open({ attachTo: angular.element(document.body), controller: crimeReportDetail, controllerAs: "ctrl", disableParentScroll: true, templateUrl: "views/template-incident-detail.html", hasBackdrop: true, panelClass: "timeline-report-detail", position: position, trapFocus: true, zIndex: 150, clickOutsideToClose: true, escapeToClose: true, focusOnOpen: true, targetEvent: event, locals: { incidentDetail: event } }).finally(function() {
            var StreetView = new google.maps.Map(document.getElementById("street-view-detail"), { scrollwheel: false, zoomControl: false, zoom: 0 });
            var panorama = new google.maps.StreetViewPanorama(document.getElementById("street-view-detail"), { position: { lat: Number(event.latitude), lng: Number(event.longitude) }, pov: { heading: 34, pitch: 5 }, scrollwheel: false });
            StreetView.setStreetView(panorama)
          });
          scope.incidentDetail = event
        }
        var axXoffset = 10;
        var radius = 7;
        var reportMarks = svg.append("g").attr("transform", "translate(" + axXoffset + ", 0)").attr("id", "reports-vz-marks");
        var circles = reportMarks.selectAll("circle").data(_incidents).enter().append("circle").attr("cx", plotXcirc).attr("cy", plotYcirc).attr("r", radius).attr("class", "timeline-circle").attr("style", function(d) { return setCircStyle("initial", d) }).on("click", reportDetailShow).on("mouseover", function(d) {
          if (!scope.toolTipLock) {
            this.setAttribute("style", setCircStyle("mouseover", d));
            this.setAttribute("r", radius * 2);
            _toolTipShow(d, this)
          }
        }).on("mouseout", function(d) {
          if (!scope.toolTipLock) {
            this.setAttribute("style", setCircStyle("mouseout", d));
            this.setAttribute("r", radius);
            toolTipHide()
          }
        });
        var axisX = svg.append("g").attr("class", "axis x").attr("transform", "translate(" + axXoffset + "," + (hght - 20) + ")").call(xAxis);
        var axisY = svg.append("g").attr("class", "axis y").attr("transform", "translate(50, 0)").call(yAxis);

        function _refreshTimeLine() {
          var newWdth = elm.offsetWidth;
          var newHght = elm.offsetHeight;
          svg.attr("height", newHght).attr("width", newWdth);
          scaleAxisX.range(calcPadding.x(newWdth));
          scaleAxisY.range(calcPadding.y(newHght));
          axisX.transition().duration(100).ease("sin-in-out").attr("transform", "translate(" + axXoffset + "," + (newHght - 20) + ")").call(xAxis);
          axisY.transition().duration(100).ease("sin-in-out").attr("transform", "translate(50, 0)").call(yAxis);
          circles.transition().duration(200).attr("cx", plotXcirc).attr("cy", plotYcirc)
        }
        scope.filterData = function(filterIndex) { reportMarks.selectAll("circle").transition().duration(200).attr("cx", function(d) { var offType = d.offense_type; var parentType = offType.indexOf("-") === -1 ? offType : offType.slice(0, offType.indexOf("-")); if (filterIndex.indexOf(parentType) < 0) { var incidentDate = new Date(d.date_reported).toDateString(); var _q_ = scaleAxisX(new Date(incidentDate)); return _q_ } else { return -12e18 } }).attr("fill", function(d) { return colorScaleApply(d.offense_type) }) };
        scope.filterToggleType = function($event) {
          $event.preventDefault();
          $event.cancelBubble = true;
          var toggleKey = scope.reportFilter.indexOf(this.val.key);
          if (toggleKey === -1) { scope.reportFilter.push(this.val.key) } else { scope.reportFilter.splice(toggleKey, 1) } scope.updated = true
        };
        scope.filterAll = function($event) {
          $event.preventDefault();
          $event.cancelBubble = true;
          scope.reportFilter = [];
          for (var i = scope.$index.length - 1; i >= 0; i--) { scope.reportFilter.push(scope.$index[i].key) } scope.updated = true
        };
        scope.filterReset = function($event) {
          $event.preventDefault();
          $event.cancelBubble = true;
          scope.reportFilter = [];
          scope.updated = false
        };
        angular.element($window).bind("resize", function() { _refreshTimeLine() })
      }
      scope.promiseAttr.promise.then(_init_)
    }
  }
}]);
angular.module("mkm.seaCrimeData").filter("orderObjectBy", function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) { filtered.push(item) });
    filtered.sort(function(a, b) { return a[field] > b[field] ? 1 : -1 });
    if (reverse) { filtered.reverse() }
    return filtered
  }
});
angular.module("mkm.seaCrimeData").directive("reportZoneBeat", ["$mdMenu", function($mdMenu) {
  return {
    scope: { reports: "=reportData", reportColor: "=reportColor" },
    templateUrl: "views/template-zone-beat.html",
    link: function($scope, element) {
      var reportsByZone = $scope.reports;
      var $wrapper = d3.select(element.find(".report-zone-beat")[0]);
      $scope.$typeColorScale = d3.scaleOrdinal(d3.schemeCategory20).domain($scope.reports.map(function(d) { return d.summarized_offense_description }));
      var labels = $wrapper.insert("div").html("Districts<br>Zones");
      var wdthStr = Math.floor(100 / reportsByZone.length) + "%";
      var districts = $wrapper.selectAll("div").data(reportsByZone).enter().append("div").sort(function(a, b) { return d3.ascending(a.key, b.key) }).classed("report-districts", true).text(function(d) { return d.key }).style("width", wdthStr);
      var zones = districts.selectAll("div").data(function(d) { return d.values }).enter().append("div").sort(function(a, b) { return d3.ascending(a.key, b.key) }).classed({ "report-zones": true }).text(function(d) { return d.key });
      var report = zones.selectAll("div").data(function(d) { return d.values }).enter().append("div").style("background", $scope.reportColor).classed({ badge: true }).html(function() { return "&nbsp;" });
      $scope.sortBy = "zone id";
      $scope.labelShow = true;
      $scope.sortReports = function(sortStr) {
        switch (sortStr) {
          case "report count by district":
            districts.sort(function(a, b) { return d3.ascending(a.values.length, b.values.length) });
            break;
          case "report count by zone":
            zones.sort(function(a, b) { return d3.descending(a.values.length, b.values.length) });
            break;
          case "zone id":
            zones.sort(function(a, b) { return d3.ascending(a.key, b.key) });
            break;
          case "district id":
            districts.sort(function(a, b) { return d3.ascending(a.key, b.key) });
            break
        }
      };
      $scope.openMenu = function(ev) { $mdMenu.show(ev) };
      $scope.changeColor = function() { report.style("background", function(d) { return $scope.$typeColorScale(d.summarized_offense_description) }) };
      $scope.labelsHide = function() {
        labels.style("opacity", $scope.labelShow ? 0 : 1);
        $scope.labelShow = !$scope.labelShow;
      }
    }
  }
}]);
angular.module("mkm.seaCrimeData").directive("reportTypeDay", ["$window", function($window) {
  var $w = angular.element($window);
  $w.bind("resize", function(event) { console.log(event) });
  return {
    scope: { reports: "=reportData", reportCount: "=reportCount", reportColor: "=reportColor" },
    link: function($scope, element) {
      element.ready(function(event) { $scope.elmWidth = event("report-type-day").outerWidth() });
      var wrapper = d3.select(element[0]);
      $scope.$typeColorScale = d3.scale.category20().domain($scope.reports.map(function(d) { return d.summarized_offense_description }));
      var reportDate = wrapper.selectAll("div.report-date").data($scope.reports).enter().append("div").attr("layout", "row").classed({ "report-date": true }).text(function(d) { return d.key + " Count: " + d.values.length });
      var reportTypes = reportDate.append("div").classed({ "report-types": true }).style("width", function(d) { return Math.ceil(d.values.length) + "%" }).style("background", function(d) { return d.values[0].fillColor });
      reportTypes.selectAll("div").data(function(d) { return d.values }).enter().append("div").classed({ "report-type": true }).style("background", function(d) { return $scope.$typeColorScale(d.summarized_offense_description) }).style("width", function() { return Math.ceil($scope.elmWidth * .01) + "px" }).html("&nbsp;")
    }
  }
}]);
angular.module("mkm.seaCrimeData").directive("reportTypeChild", [function() {
  return {
    scope: { reports: "=reportData", reportCount: "=reportCount" },
    link: function($scope, element) {
      var $elm = element[0];
      var wrapper = d3.select($elm);
      var diameter = 960;
      var bubble = d3.layout.pack().sort(null).size([diameter, diameter]).padding(1.5);
      var svg = wrapper.append("svg").attr("width", diameter).attr("height", diameter).attr("class", "bubble");
      var node = svg.selectAll(".node").data(bubble.nodes($scope.reports)).enter().append("g").attr("class", "node").attr("transform", function(d) { if (!isNaN(d.x && d.y)) { return "translate(" + d.x + "," + d.y + ")" } else { return "translate(0,0)" } });
      node.append("title").text(function(d) { return d.key });
      node.append("circle").attr("r", function() { return 10 }).style("fill", function(d) { return d.fillColor });
      d3.select(this.frameElement).style("height", diameter + "px")
    }
  }
}]);
angular.module("mkm.seaCrimeData").run(["$templateCache", function($templateCache) {
  $templateCache.put("views/template-report-type-detail.html", '<div layout="row" layout-padding layout-margin layout-wrap> <div flex> <button type="button" class="btn btn-close btn-primary" ng-click="closeDetail()" aria-label="Close Detail"> <span class="glyphicon glyphicon-remove"></span> </button> <h2>{{reportType.key}} <span class="badge" ng-style="{ background: reportType.fillColor}">{{reportType.values.length}}</span></h2> <h3>Reports per zone</h3> <report-zone-beat report-data="dataZoneBeat" report-color="reportType.fillColor"></report-zone-beat> </div> <div flex="100"> <h3>Reports per day</h3> <!-- NEED A WAY TO PASS FILL COLOUR TO DIRECTIVE --> <!-- <report-type-day report-count="reportType.values.length" report-data="dataTypeDay" report-color="reportType.fillColor"></report-type-day> --> </div> </div>');
  $templateCache.put("views/crime-view.html", '<!-- INTRO --><!-- <div flex="100" flex-gt-md="50">\n' + "  <h1>Seattle Crime Reports</h1>\n" + '  <p>The following examples all use data that can be found at <a href="https://data.seattle.gov/Public-Safety/Seattle-Police-Department-Police-Report-Incident/7ais-f98f" target="_blank">data.seattle.gov</a>. An HTTP requests a <a href="https://data.seattle.gov/resource/7ais-f98f.json" target="_blank">JSON object</a> at page load. JSON data is then processed using D3 and native JavaScript, and finally rendered as Angular directives. All visualastions are SVG elements generated by D3. Mapping is done with Google Maps JavaScript API.</p>\n' + '  <p>Coded by <a href="http://kylemoseby.com" target="_blank">Kyle Moseby</a>.</p>\n' + '  <p><a href="https://github.com/kylemoseby/angular-seattle-crime-data" target="_blank">A GitHub Repo can be found here <span class="icon-github"></span></a></p>\n' + "  <h3>Dependencies</h3>\n" + "  <ul>\n" + '    <li><a href="https://angularjs.org/" target="_blank">AngularJS</a></li>\n' + '    <li><a href="https://D3js.org/" target="_blank">D3</a></li>\n' + '    <li><a href="https://developers.google.com/maps//" target="_blank">Google Maps</a></li>\n' + "  </ul>\n" + "</div>\n" + ' --><!-- // INTRO --><!-- TIMELINE --> <div class="container-fluid"> <seattle-crime-plotted class="row"> <div class="col-sm-5 crime-plot-menu"> <crime-plot-menu></crime-plot-menu> </div> <div class="col-sm-7"> <crime-plot-svg></crime-plot-svg> </div> </seattle-crime-plotted> <!-- // TIMELINE --> <!-- GOOGLE MAP --> <!-- flex-gt-md="40" --> <div flex="100"> <h2>Reports by Latitude and Longitude</h2> <seattle-crime-map layout="row" flex="100" map-promise="$seaCrimeData" map-style="mapStyle"> <map-canvas flex="40"></map-canvas> <map-filters flex="40"></map-filters> </seattle-crime-map> </div> <!-- // GOOGLE MAP --> <!-- BAR CHART --> <div flex="100" flex-gt-md="100"> <h2>Report count by incident type</h2> <div id="crime-reports-block" crime-reports-block crime-reports-data="$seaCrimeData"></div> </div> <!-- // BAR CHART --> </div> <!-- TYPE DETAIL EXAMPLE --> <!-- <div layout="column" class="report-type-detail"> --> <!-- <div flex> --> <!-- <h2>Type Detail</h2> --> <!-- <div ng-include="\'views/template-report-type-detail.html\'"></div> --> <!-- <h2>Incident Detail</h2> --> <!-- <div ng-include="\'views/template-incident-detail.html\'" onload="incidentStreetView()" class="incident-example"></div> --> <!-- </div> --> <!-- </div> --> <!-- // TYPE DETAIL EXAMPLE --> <!-- // REPORT DETAIL EXAMPLE -->');
  $templateCache.put("views/progress-bar.html", '<div class="loading-wrapper"> <div class="progress"> <div class="progress-bar" role="progressbar" aria-valuenow="{{valNow}}" aria-valuemin="2" aria-valuemax="{{valMax}}" style="width: {{valNow}}%"> <span class="sr-only">{{valNow}}% Complete</span> </div> </div> </div>');
  $templateCache.put("views/template-crime-map-filter.html", '<md-menu> <md-button aria-label="Filter crime data" class="md-icon-button" ng-click="$mdMenu.open($event)"> <span class="glyphicon glyphicon-filter"></span> </md-button> <md-menu-content width="8"> <md-menu-item> <md-button ng-click="filterApply($event)">Apply </md-button></md-menu-item> <md-menu-item> <md-button ng-click="filterReset($event)" ng-disabled="!mapIndexFilter().length > 0" md-prevent-menu-close>Reset </md-button></md-menu-item> <md-menu-item> <md-button ng-click="filterClear($event)" ng-disabled="$indexLength() === mapIndexFilter().length" md-prevent-menu-close>Clear All </md-button></md-menu-item> <md-menu-divider></md-menu-divider> <md-menu-item ng-repeat="(key, val) in filterInd | orderObjectBy : \'count\' : true"> <md-button ng-click="filterPushSplice($event)" ng-class="{\'md-primary\' : val.show}" md-prevent-menu-close> {{val.offenseCategory}} <span class="badge" style="background-color: {{val.fillColor}}">&nbsp;</span> </md-button> </md-menu-item> </md-menu-content> </md-menu>');
  $templateCache.put("views/template-crime-plot-menu.html", '<button class="btn" ng-click="toggleAxis()">{{disp.axis}}</button> <button class="btn" ng-click="circSetColorType()" ng-class="{ \'btn-primary\' : disp.color === \'extension\' }">By Code Extension</button> <button class="btn" ng-click="circSetColorDist()" ng-class="{ \'btn-primary\' : disp.color === \'district\' }">By District</button> <md-slider ng-model="disp.circRad" min="5" max="20" step="3" ng-change="setCircleRad()" aria-label="Plot display size"></md-slider> <br> Display size: {{disp.circRad}} <br> <ul class="filter-list"> <li> <h3>Code Extension</h3> </li> <li> <md-checkbox aria-label="Select All" ng-checked="isChecked(\'extension\')" ng-click="toggleAll(\'extension\')"> <span ng-if="isChecked(\'extension\')">Un-</span>Select All </md-checkbox> </li> <li ng-repeat="_c in offCodes | orderBy:\'-values.length\'"> <!-- <li ng-repeat="_c.key in scaleType.domain()"> --> <md-checkbox ng-model="filter.extension[_c.key]" aria-label="offCodeMap[\'$\' + _c.key].offense_type_description" ng-checked="true" ng-change="filterChange()"> <span class="badge" style="background-color: {{scaleType(_c.key)}}" ng-show="disp.color === \'extension\'">&nbsp;</span> {{_c.key}} - {{offCodeMap[\'$\' + _c.key].offense_type_description}} ({{_c.values.length}}) </md-checkbox> </li> </ul> <ul class="filter-list"> <li> <h3>Districts</h3> </li> <li> <md-checkbox aria-label="Select All" ng-checked="isChecked(\'district\')" ng-click="toggleAll(\'district\')"> <!-- md-indeterminate="isIndeterminate()" --> <span ng-if="isChecked(\'district\')">Un-</span>Select All </md-checkbox> </li> <li ng-repeat="_d in districts | orderBy:\'-values.length\'"> <!-- <li ng-repeat="_d.key in scaleDist.domain()"> --> <md-checkbox ng-model="filter.district[_d.key]" aria-label="_d.key" ng-checked="true" ng-change="filterCircle()"> <span class="badge" style="background-color: {{scaleDist(_d.key)}}">&nbsp;</span> {{_d.key}} ({{_d.values.length}}) </md-checkbox> </li> </ul>');
  $templateCache.put("views/template-incident-detail.html", '<div layout="row" layout-wrap layout-padding> <!-- TABLE --> <div flex="100"> <button type="button" class="btn btn-primary" ng-click="closeDetail()" aria-lable="Close Detail"> <span class="glyphicon glyphicon-remove"></span> </button> <div class="table-responsive"> <table class="table"> <thead> <tr> <td>Date Reported</td> <td>Address</td> <td>District Sector</td> <td>Census Tract</td> <td>General Offense Number</td> <td>Offense Type</td> <td>Offense Code</td> <td>Description</td> <td>Zone/Beat</td> </tr> </thead> <tbody> <tr> <td>{{incidentDetail.date_reported | date:\'medium\'}}</td> <td>{{incidentDetail.hundred_block_location}}</td> <td>{{incidentDetail.district_sector}}</td> <td>{{incidentDetail.census_tract_2000}}</td> <td>{{incidentDetail.general_offense_number}}</td> <td>{{incidentDetail.offense_type}}</td> <td>{{incidentDetail.offense_code}}</td> <td>{{incidentDetail.summarized_offense_description}}</td> <td>{{incidentDetail.zone_beat}}</td> </tr> </tbody> </table> </div> </div> <!-- // TABLE --> <!-- STREET VIEW --> <div flex="100" flex-gt-sm="50"> <div id="street-view-detail"></div> </div> <!-- // STREET VIEW --> </div>');
  $templateCache.put("views/template-map-filters.html", '<div ng-show="indexOffType"> <!-- FILTER TYPE --> <button ng-click="filterToggleType($event)" ng-repeat="(key, val) in indexOffType" class="btn" ng-class="{\n' + "        'btn-default'  : filters.reportFilter.indexOf(val.key) !== -1 && showApply,\n" + "        'btn-primary' : filters.reportFilter.indexOf(val.key) === -1,\n" + "        'btn-link' : filters.reportFilter.indexOf(val.key) !== -1 && !showApply\n" + '     }" aria-label="{{vall.key}}"> <div class="badge" style="background-color: {{filters.reportFilter.indexOf(val.key) !== -1 && !showApply ? \'#555\' : colorScaleOff(val.key)}}"><span class="glyphicon glyphicon-eye-close" ng-show="filters.reportFilter.indexOf(val.key) !== -1"></span>&nbsp;</div> {{val.key}} </button> <!-- // FILTER TYPE --> <!-- FILTER DATE --> <div class="map-filter-date"> <md-datepicker ng-model="filters.startDate" md-min-date="dateRange[0]" md-max-date="filters.endDate" md-placeholder="Start date" ng-click="dateChange($event)"></md-datepicker> <md-datepicker ng-model="filters.endDate" md-min-date="filters.startDate" md-max-date="dateRange[1]" md-placeholder="End date" ng-click="dateChange($event)"></md-datepicker> </div> <!-- // FILTER DATE --> <button class="btn btn-default" ng-click="filterApply($event)" ng-show="showApply" aria-labvel="Apply">Apply</button> <button class="btn btn-default" ng-click="filterAll()" aria-label="Filter All">Filter All</button> <button class="btn btn-default" ng-click="filterNone()" aria-label="Show All">Show All</button> </div>');
  $templateCache.put("views/template-report-type-detail.html", '<div layout="row" layout-padding layout-margin layout-wrap> <div flex> <button type="button" class="btn btn-close btn-primary" ng-click="closeDetail()" aria-label="Close Detail"> <span class="glyphicon glyphicon-remove"></span> </button> <h2>{{reportType.key}} <span class="badge" ng-style="{ background: reportType.fillColor}">{{reportType.values.length}}</span></h2> <h3>Reports per zone</h3> <report-zone-beat report-data="dataZoneBeat" report-color="reportType.fillColor"></report-zone-beat> </div> <div flex="100"> <h3>Reports per day</h3> <!-- NEED A WAY TO PASS FILL COLOUR TO DIRECTIVE --> <!-- <report-type-day report-count="reportType.values.length" report-data="dataTypeDay" report-color="reportType.fillColor"></report-type-day> --> </div> </div>');
  $templateCache.put("views/template-reports-block.html", '<div class="loading-wrapper"> <div class="progress"> <div class="progress-bar" role="progressbar" aria-valuenow="{{progress.now}}" aria-valuemin="2" aria-valuemax="{{progress.max}}" style="width: {{progress.loaded}}%"> <span class="sr-only">{{progress.now}}% Complete</span> </div> </div> <br> max {{progress.max}}<br> now {{progress.now}} </div>');
  $templateCache.put("views/template-reports-summary.html", '<div class="panel panel-default" ng-show="$typeDetail.data !== null"> <!-- Default panel contents --> <div class="panel-heading">Incident Type Summary</div> <div class="panel-body"> <table class="table"> <thead> <tr> <th>Offense Category</th> <th></th> <th>Offense Count</th> <th>% of Total Incidents</th> <th>Child types</th> <th></th> </tr> </thead> <tbody> <td> {{$typeDetail.data.offenseCategory}} </td> <td> <span class="badge" style="background-color: {{$typeDetail.data.fillColor}}">&nbsp;</span> </td> <td> {{$typeDetail.data.count}} </td> <td> {{ ($typeDetail.data.count / $reports.length) * 100 | number:0 }} </td> <td> <ul> <li ng-repeat="(key, value) in $typeDetail.data.children | orderObjectBy : \'count\' : true" class="list-unstyled"> {{value.$type}} {{value.count}} </li> </ul> </td> <td width="33%"> <ul> <li ng-repeat="(key, value) in $typeDetail.data.children | orderObjectBy : \'count\' : true" class="list-unstyled"> <div class="reportTotals" style="background-color: {{$typeDetail.data.fillColor}}; width: {{value.count / 10}}%">&nbsp;</div> </li> </ul> </td> </tbody> </table> <div class="btn-group" role="group"> <button type="button" class="btn btn-default" ng-click="filterTypeDetail($event)"><span class="glyphicon glyphicon-filter"></span></button> <button type="button" class="btn btn-default" ng-click="clearTypeDetail($event)"><span class="glyphicon glyphicon-remove"></span></button> </div> </div> </div>');
  $templateCache.put("views/template-reports-viz.html", '<!-- FILTER MENU --> <md-menu class="crime-map-filter"> <!-- FILTER BUTTON  --> <md-button aria-label="Filter crime data" class="md-icon-button" ng-click="$mdMenu.open($event)"> <span class="glyphicon glyphicon-filter"></span> </md-button> <!-- // FILTER BUTTON  --> <md-menu-content width="12"> <md-menu-item> <md-button ng-click="filterData(reportFilter)">Apply</md-button> </md-menu-item> <md-menu-item> <md-button ng-click="filterReset($event)" ng-disabled="reportFilter.length === 0" md-prevent-menu-close>Reset</md-button> </md-menu-item> <md-menu-item> <md-button ng-click="filterAll($event)" ng-disabled="reportFilter === []" md-prevent-menu-close>Clear All</md-button> </md-menu-item> <md-menu-divider></md-menu-divider> <md-menu-item ng-repeat="(key, val) in $index"> <md-button ng-click="filterToggleType($event)" ng-class="{\'md-primary\' : reportFilter.indexOf(val.key) === -1}" md-prevent-menu-close> <span class="badge" style="background-color: {{colorScaleOff(val.key)}}">&nbsp;</span> {{val.key}} ({{val.values.length}}) </md-button> </md-menu-item> </md-menu-content> </md-menu> <!-- // FILTER MENU --> <!-- TIMELINE CANVAS --> <div class="crime-report-timeline"></div> <!-- // TIMELINE CANVAS -->');
  $templateCache.put("views/template-summary-list.html", '<ul class="list-unstyled"> <li ng-repeat="(key, val) in $index | orderObjectBy : \'count\' : true"> <div class="reportTotals" style="background-color: {{val.fillColor}}; width: {{val.count / 10}}%"></div> {{val.offenseCategory}} <span class="badge">{{val.count}}</span> <span ng-repeat="child in val.children">{{child.$type}}&nbsp;&nbsp;{{child.count}}&nbsp;&nbsp;</span> </li> </ul>');
  $templateCache.put("views/template-zone-beat.html", '<!-- SORT BY --> <md-menu name="reportSortBy"> <md-button aria-label="Sort by" class="md-icon-button" ng-click="$mdMenu.open($event)"> <span class="glyphicon glyphicon-sort"></span> </md-button> <md-menu-content width="4"> <md-menu-item> <md-button ng-click="sortReports(\'report count by district\')"> report count by district </md-button> </md-menu-item> <md-menu-item> <md-button ng-click="sortReports(\'report count by zone\')"> report count by zone </md-button> </md-menu-item> <md-menu-item> <md-button ng-click="sortReports(\'zone id\')"> zone id </md-button> </md-menu-item> <md-menu-item> </md-menu-item> </md-menu-content> </md-menu> <!-- // SORT BY --> <!-- COLOR  --> <md-button ng-click="changeColor()"> Color </md-button> <!-- // COLOR --> <!-- INDEX --> <ul class="list-inline"> <li ng-repeat="report in $typeColorScale.domain()"> <span class="badge" style="background: {{$typeColorScale(report)}}">{{report}}</span> </li> </ul> <!-- // INDEX  --> <md-button ng-click="labelsHide()"> {{labelShow ? \'Hide\' : \'Show\'}} labels </md-button> <div class="report-zone-beat"></div>');
  $templateCache.put("views/timeline-report-detail-panel.html", '<ul> <li ng-repeat="key in keys">{{key}}</li> </ul> <button type="button" class="btn btn-primary" ng-click="closeDialog()" aria-lable="Close Detail"> <span class="glyphicon glyphicon-remove"></span> </button> <div class="table-responsive"> <table class="table"> <thead> <tr> <td>Date Reported</td> <td>Address</td> <td>District Sector</td> <td>Census Tract</td> <td>General Offense Number</td> <td>Offense Type</td> <td>Offense Code</td> <td>Description</td> <td>Zone/Beat</td> </tr> </thead> <tbody> <tr> <td>{{report.date_reported | date:\'medium\'}}</td> <td>{{report.hundred_block_location}}</td> <td>{{report.district_sector}}</td> <td>{{report.census_tract_2000}}</td> <td>{{report.general_offense_number}}</td> <td>{{report.offense_type}}</td> <td>{{report.offense_code}}</td> <td>{{report.summarized_offense_description}}</td> <td>{{report.zone_beat}}</td> </tr> </tbody> </table> </div>')
}]);
