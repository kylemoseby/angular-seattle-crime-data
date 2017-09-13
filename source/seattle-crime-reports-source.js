"use strict";

angular.module("mkm.seaCrimeData", [ "ngMaterial" ]).service("seattleDataGov", [ "$http", "$q", function(a, b) {
 var c = a({
  method: "GET",
  url: "https://data.seattle.gov/resource/7ais-f98f.json"
 });
 var d = b.defer();
 c.then(function(a) {
  function b(a) {
   return a.indexOf("-") === -1 ? a : a.slice(0, a.indexOf("-"));
  }
  var c = d3.nest().key(function(a) {
   try {
    return b(a.offense_type);
   } catch (c) {
    console.log(c);
    console.log(a);
   }
  }).entries(a.data);
  var e = d3.scaleOrdinal().domain(c.map(function(a) {
   return a.key;
  })).range(d3.schemeCategory20);
  d.resolve({
   incidents: a.data,
   indexOffType: c,
   colorScaleOff: e
  });
 });
 return d;
} ]).controller("CrimeReportrsCtrl", [ "$scope", "seattleDataGov", "mapStyle", function(a, b, c) {
 a.$seaCrimeData = b;
 a.$seaCrimeData.promise.then(function(b) {
  a.$index = b.index;
  a.$reports = b.incidents;
 });
 a.mapStyle = c;
} ]);

angular.module("mkm.seaCrimeData").directive("filterReportTypes", [ function() {
 return {
  templateUrl: "views/template-crime-map-filter.html",
  scope: {
   filterInd: "=filterReportTypes",
   filterMap: "=crimeMapFilter",
   filterTime: "=crimeTimelineFilter"
  },
  link: function(a) {
   a.updated = false;
   a.filterPushSplice = function(b) {
    b.preventDefault();
    b.cancelBubble = true;
    this.val.show = !this.val.show;
    a.updated = true;
   };
   a.filterApply = function(b) {
    b.preventDefault();
    var c = this.mapIndexFilter();
    a.filterMap.update(c);
    a.filterTime.filterData(c);
    a.updated = false;
   };
   a.filterClear = function(b) {
    b.preventDefault();
    b.cancelBubble = true;
    for (var c in a.filterInd) {
     a.filterInd[c].show = false;
    }
    a.updated = false;
   };
   a.filterReset = function(b) {
    b.preventDefault();
    b.cancelBubble = true;
    for (var c in a.filterInd) {
     a.filterInd[c].show = true;
    }
    a.updated = true;
   };
   a.mapIndexFilter = function() {
    var b = a.filterInd || {};
    var c = [];
    for (var d in b) {
     if (!b[d].show) {
      c.push(d);
     }
    }
    return c;
   };
  }
 };
} ]);

angular.module("mkm.seaCrimeData").directive("incidentDetail", [ function() {
 function a(a, b) {
  var c = b.attr("timeline-id");
  a.incidentDetail = null;
  if (document.getElementById("street-view-detail") !== null) {
   a.$detailMap = new google.maps.Map(document.getElementById("street-view-detail"), {
    zoom: 14
   });
  }
  a.closeDetail = function() {
   try {
    a.mapID.$markers.close();
   } catch (b) {}
   a[c].toolTipHide();
   this.incidentDetail = null;
  };
 }
 return {
  link: a,
  templateUrl: "views/template-incident-detail.html"
 };
} ]);

angular.module("mkm.seaCrimeData").directive("crimeReportsBlock", [ "$window", "$mdPanel", function(a, b) {
 return {
  templateUrl: "views/template-reports-block.html",
  scope: {
   $promise: "=crimeReportsData"
  },
  link: function(c, d) {
   var e = d[0];
   c.$panel = b;
   var f = e.offsetWidth * .033;
   var g = e.offsetWidth;
   var h = e.offsetHeight;
   var i = h - f - h * .45;
   var j = d3.select(e);
   j.append("svg").attr("height", h).attr("width", g);
   var k = j.select(".loading-wrapper");
   var l = j.select("svg");
   var m = l.selectAll("g.reports-index-rect");
   c.progress = {
    now: 2,
    max: 100,
    loaded: 2
   };
   function n() {
    c.progress.now++;
    c.progress.loaded = c.progress.now / c.progress.max * 100;
   }
   function o() {
    k.classed("loaded", true);
   }
   var p = d3.scaleBand().range([ f, g - f ]);
   var q = d3.scaleLinear().range([ f, i ]);
   function r(a) {
    return a === "VEH-THEFT-AUTO" ? "VEH" : a;
   }
   function s(b) {
    var d = b.indexOffType.sort(function(a, b) {
     return d3.descending(a.values.length, b.values.length);
    });
    c.progress.max = d.length;
    var j = b.colorScaleOff;
    var k = d.map(function(a) {
     return r(a.key);
    });
    p.domain(k.reverse());
    q.domain([ 0, d3.max(d, function(a) {
     return a.values.length;
    }) ]);
    function o(a) {
     var b = c.$panel.newPanelPosition().absolute().center();
     c.$panel.open({
      attachTo: angular.element(document.body),
      controllerAs: "ctrl",
      disableParentScroll: true,
      templateUrl: "views/template-report-type-detail.html",
      hasBackdrop: true,
      panelClass: "report-type-detail",
      position: b,
      trapFocus: true,
      zIndex: 150,
      clickOutsideToClose: true,
      escapeToClose: true,
      focusOnOpen: true,
      targetEvent: event,
      locals: {
       reportType: a
      },
      controller: function(a, b, c) {
       console.log(c);
       a.reportType = c;
       a.reportType.fillColor = j(c.key);
       a.dataTypeDay = d3.nest().key(function(a) {
        var b = d3.timeFormat("%x");
        return b(new Date(a.date_reported));
       }).entries(c.values);
       a.dataTypeChild = d3.nest().key(function(a) {
        return a.offense_type;
       }).entries(c.values);
       a.dataZoneBeat = d3.nest().key(function(a) {
        return a.district_sector;
       }).key(function(a) {
        return a.zone_beat;
       }).entries(c.values);
       a.closeDetail = function() {
        b.close();
       };
      }
     });
    }
    m.data(d).enter().append("g").attr("id", function(a) {
     return a.key;
    }).attr("class", "reports-index-rect").attr("transform", "translate(" + f + ",80)");
    var s = l.selectAll("g.reports-index-rect").append("text").attr("transform", function(a) {
     var b = p(r(a.key));
     return "translate(" + (b - p.bandwidth() * .33) + ", " + (i - f + 9) + ") rotate(-50)";
    }).attr("text-anchor", "end").attr("class", "block-label category").text(function(a) {
     return a.key;
    });
    var t = l.selectAll("g.reports-index-rect").append("text").attr("transform", function(a) {
     var b = p(r(a.key));
     return "translate(" + (b - p.bandwidth() * .5) + ", " + (i - q(a.values.length) - f - 5) + ")";
    }).attr("class", "block-label count").attr("text-anchor", "middle").text(function(a) {
     return a.values.length;
    });
    var u = l.selectAll("g.reports-index-rect").append("rect").attr("transform", function(a) {
     var b = p(r(a.key));
     return "translate(" + b + "," + (i - f) * 2 + ") rotate(180)";
    }).attr("y", function() {
     return i - f;
    }).attr("width", p.bandwidth()).attr("height", function(a) {
     return q(a.values.length);
    }).attr("fill", function(a) {
     n();
     return j(a.key);
    }).on("click", o);
    function v() {
     f = e.offsetWidth * .033;
     g = e.offsetWidth;
     h = e.offsetHeight;
     i = h - f - 120;
     l.attr("height", h).attr("width", g);
     p.range([ f, g - f ]);
     q.range([ f, i ]);
     var a = d3.transition().duration(100).ease(d3.easeLinear);
     s.transition(a).attr("transform", function(a) {
      var b = p(r(a.key));
      return "translate(" + (b - p.bandwidth() * .33) + ", " + (i - f + 7) + ") rotate(-50)";
     });
     t.transition(a).attr("transform", function(a) {
      var b = p(r(a.key));
      return "translate(" + (b - p.bandwidth() * .5) + ", " + (i - q(a.values.length) - f - 6) + ")";
     });
     u.transition(a).attr("transform", function(a) {
      var b = p(r(a.key));
      return "translate(" + b + "," + (i - f) * 2 + ") rotate(180)";
     }).attr("y", function() {
      return i - f;
     }).attr("width", p.bandwidth()).attr("height", function(a) {
      return q(a.values.length);
     });
    }
    angular.element(a).bind("resize", v);
    c.blockID = {
     refreshBlocks: v
    };
   }
   c.$promise.promise.then(s);
   c.$promise.promise.finally(o);
  }
 };
} ]);

angular.module("mkm.seaCrimeData").directive("seattleCrimeMap", [ "seattleDataGov", "mapStyle", "$mdPanel", function(a, b, c) {
 return {
  controller: function(d) {
   d.getIncidentParent = function(a) {
    return a.indexOf("-") === -1 ? a : a.slice(0, a.indexOf("-"));
   };
   var e = c;
   var f = function(a) {
    console.log(a);
    var b = e.newPanelPosition().absolute().center();
    e.open({
     attachTo: angular.element(document.body),
     controller: function(a, b, c) {
      a.incidentDetail = c;
      a.closeDetail = function() {
       this.incidentDetail = null;
       b.close();
      };
     },
     panelClass: "map-report-detail",
     controllerAs: "ctrl",
     templateUrl: "views/template-incident-detail.html",
     zIndex: 150,
     disableParentScroll: true,
     hasBackdrop: true,
     position: b,
     trapFocus: true,
     clickOutsideToClose: true,
     escapeToClose: true,
     focusOnOpen: true,
     targetEvent: event,
     locals: {
      incidentDetail: a
     }
    }).finally(function() {
     var b = document.getElementById("street-view-detail");
     var c = new google.maps.Map(b, {
      scrollwheel: false,
      zoomControl: false,
      zoom: 0
     });
     var d = new google.maps.StreetViewPanorama(b, {
      position: {
       lat: Number(a.latitude),
       lng: Number(a.longitude)
      },
      pov: {
       heading: 34,
       pitch: 1
      },
      zoom: 0,
      scrollwheel: false
     });
     c.setStreetView(d);
    });
   };
   var g = new google.maps.InfoWindow();
   d.$infoWindow = function(a, b) {
    var c = b.feature.f;
    g.setContent('<ul class="list-unstyled">' + '<li><span class="glyphicon glyphicon-pushpin" style="color: ' + d.colorScaleOff(d.getIncidentParent(c.offense_type)) + '"></span>' + c.offense_type + " " + c.date_reported + "</li>" + "<li>Block: " + c.hundred_block_location + "</li>" + "<li>Description: " + c.summarized_offense_description + "</li>" + '<li><button id="map-info-btn" class="btn btn-sm btn-primary"><span class="glyphicon glyphicon-new-window"></span></button></li>' + "</ul>");
    var e = new google.maps.Marker({
     position: b.latLng.toJSON(),
     map: a,
     title: c.offense_type,
     icon: "images/spacer.gif"
    });
    g.open(a, e);
    google.maps.event.addListener(g, "domready", function() {
     var a = d3.select("#map-info-btn");
     a.on("click", function() {
      console.log(c);
      f(c);
     });
    });
   };
   d.$seaCrimeData = a;
   d.$seaCrimeData.promise.then(function(a) {
    d.$index = a.index;
    d.$reports = a.incidents;
    d.dateRange = d3.extent(a.incidents, function(a) {
     return new Date(a.date_reported);
    });
    d.filters.startDate = d.dateRange[0];
    d.filters.endDate = d.dateRange[1];
    d.indexOffType = a.indexOffType;
    d.colorScaleOff = a.colorScaleOff;
   }).finally(function() {
    console.log("finally");
   });
   d.mapStyle = b !== undefined ? b : null;
  }
 };
} ]).directive("mapCanvas", [ "$window", function(a) {
 return {
  require: "^seattleCrimeMap",
  link: function(b, c) {
   b.$map = function() {
    var d = new google.maps.Map(c[0], {
     scrollwheel: false,
     streetViewControl: false,
     mapTypeControl: false,
     panControl: false,
     maxZoom: 17
    });
    function e(a) {
     b.$infoWindow(d, a);
    }
    d.data.addListener("click", e);
    if (!!b.mapStyle) {
     d.setOptions(b.mapStyle);
    }
    return {
     addCrimeData: function(c) {
      var e = [];
      var f = new google.maps.LatLngBounds();
      function g(a) {
       var c = new Date(a);
       return c >= b.filters.startDate && c <= b.filters.endDate ? true : false;
      }
      function h(a) {
       return b.filters.reportFilter.indexOf(b.getIncidentParent(a)) > -1 ? false : true;
      }
      for (var i = c.length - 1; i >= 0; i--) {
       var j = c[i];
       var k = Number(j.longitude);
       var l = Number(j.latitude);
       if (!isNaN(k) && !isNaN(l)) {
        if (g(j.date_reported)) {
         if (h(j.offense_type)) {
          f.extend(new google.maps.LatLng(l, k));
          e.push({
           type: "Feature",
           geometry: {
            type: "Point",
            coordinates: [ k, l ]
           },
           properties: j
          });
         }
        }
       }
      }
      d.data.addGeoJson({
       type: "FeatureCollection",
       features: e
      });
      var m = d3.nest().key(function(a) {
       try {
        return b.getIncidentParent(a.properties.offense_type);
       } catch (c) {
        console.log(c);
        console.log(a);
       }
      }).entries(e);
      b.filters.indexDateDisabled = m.map(function(a) {
       return a.key;
      });
      d.fitBounds(f);
      angular.element(a).bind("resize", function() {
       d.fitBounds(f);
      });
      return this;
     },
     applyFilters: function() {
      d.data.setStyle(function(a) {
       return {
        icon: {
         path: google.maps.SymbolPath.CIRCLE,
         scale: 4,
         fillColor: typeof b.colorScaleOff === "function" ? b.colorScaleOff(b.getIncidentParent(a.f.offense_type)) : "transparent",
         fillOpacity: 1,
         strokeWeight: 0
        }
       };
      });
      return this;
     },
     removeCrimeData: function() {
      d.data.forEach(function(a) {
       d.data.remove(a);
      });
      return this;
     }
    };
   }();
   b.mapRefresh = function() {
    b.$map.removeCrimeData();
   };
   b.filterToggleType = function(a) {
    a.preventDefault();
    a.cancelBubble = true;
    var c = b.filters.reportFilter.indexOf(this.val.key);
    if (c === -1) {
     b.filters.reportFilter.push(this.val.key);
    } else {
     b.filters.reportFilter.splice(c, 1);
    }
    b.showApply = true;
   };
   b.filterAll = function() {
    for (var a in b.indexOffType) {
     b.filters.reportFilter.push(b.indexOffType[a].key);
    }
    b.showApply = true;
   };
   b.filterNone = function() {
    b.filters.reportFilter = [];
    b.showApply = true;
   };
   b.dateChange = function(a) {
    a.preventDefault();
    b.showApply = true;
   };
   b.filterApply = function(a) {
    a.preventDefault();
    b.$map.removeCrimeData();
    b.$map.addCrimeData(b.$reports, b.filters);
    b.$map.applyFilters();
    b.showApply = false;
   };
   if (b.$seaCrimeData !== undefined) {
    b.$seaCrimeData.promise.then(function(a) {
     b.$map.addCrimeData(a.incidents).applyFilters();
    });
   } else if (b.report !== undefined) {
    var d = b.report;
    b.filters.startDate = new Date(d.date_reported);
    b.filters.endDate = new Date(d.date_reported);
    var e = Number(d.longitude);
    var f = Number(d.latitude);
    if (!isNaN(e) && !isNaN(f)) {
     var g = new google.maps.LatLngBounds();
     g.extend(new google.maps.LatLng(f, e));
     b.$map.addCrimeData([ d ]).applyFilters();
    }
   }
  }
 };
} ]).directive("mapFilters", [ function() {
 return {
  require: "^seattleCrimeMap",
  templateUrl: "views/template-map-filters.html",
  link: function(a) {
   a.filters = {
    reportFilter: [],
    indexDateDisabled: [],
    startDate: new Date(),
    endDate: new Date()
   };
   a.showApply = false;
   a.colorScaleOff = d3.schemeCategory20;
  }
 };
} ]);

angular.module("mkm.seaCrimeData").directive("seattleCrimePlotted", [ "$http", function(a) {
 function b(b, c) {
  c.addClass("loading");
  b._seaCrimeData_ = a({
   method: "GET",
   url: "https://data.seattle.gov/resource/7ais-f98f.json"
  });
  b._offenseCodes_ = a({
   method: "GET",
   url: "https://data.seattle.gov/resource/aj7i-nahf.json"
  }).then(function(a) {
   b.offCodeMap = d3.map(a.data, function(a) {
    return a.summary_offense_code;
   });
  }).finally(function() {
   c.removeClass("loading");
  });
  b.disp = {
   axis: "district",
   color: "extension",
   circRad: 5
  };
  b.filter = {
   extension: {},
   district: {}
  };
  var d = b.scales = {
   dateReported: d3.scaleTime(),
   extBand: d3.scaleBand(),
   extColour: d3.scaleOrdinal(d3.schemeCategory20),
   distBand: d3.scaleBand(),
   distColour: d3.scaleOrdinal(d3.schemeCategory20b)
  };
  b.setElementScales = function(a) {
   var b = a.node();
   d.dateReported.range([ 40, b.width.baseVal.value - 40 ]);
   d.distBand.range([ 40, b.height.baseVal.value - 40 ]);
   d.extBand.range([ 40, b.height.baseVal.value - 40 ]);
  };
  b.setDataScales = function(a) {
   var b = d3.extent(a, function(a) {
    return new Date(a.date_reported);
   });
   d.dateReported.domain(b);
   var c = [];
   var e = [];
   a.forEach(function(a) {
    if (!c.includes(a.district_sector)) {
     c.push(a.district_sector);
    }
    if (!e.includes(a.summary_offense_code)) {
     e.push(a.summary_offense_code);
    }
   });
   d.extBand.domain(e);
   d.distBand.domain(c);
  };
  function e(a) {
   function c(a, b) {
    return d3.nest().key(function(a) {
     return a[b];
    }).entries(a);
   }
   b.offCodes = c(a.data, "summary_offense_code");
   b.districts = c(a.data, "district_sector");
  }
  b._seaCrimeData_.then(e);
 }
 return {
  controller: b
 };
} ]).directive("crimePlotMenu", [ function() {
 function a(a) {
  a.isIndeterminate = function() {
   return a.selected.length !== 0 && a.selected.length !== a.items.length;
  };
  a.isChecked = function(b) {
   var c = a.filter[b];
   var d = true;
   if (Object.keys(c).length > 0) {
    for (var e in c) {
     if (!c[e]) {
      d = false;
      break;
     }
    }
   }
   return d;
  };
  a.toggleAll = function(b) {
   var c = Object.values(a.filter[b]);
   var d = c.every(function(a) {
    return a === true;
   });
   for (var e in a.filter[b]) {
    a.filter[b][e] = !d;
   }
   a.filterCircle();
  };
  a.fileterChange = function() {
   console.log("cahnged");
   a.filterCircle();
  };
 }
 return {
  require: "^seattleCrimePlotted",
  templateUrl: "views/template-crime-plot-menu.html",
  link: a
 };
} ]).directive("crimePlotSvg", [ "$window", "crimeReportPanelPlots", function(a, b) {
 function c(c, d) {
  var e = b();
  var f = d3.select(d[0]).append("svg");
  var g = d3.axisBottom().ticks(d3.timeHour, 24).tickFormat(d3.timeFormat("%m/%d"));
  var h = d3.axisLeft();
  var i = d3.axisLeft();
  var j = f.append("g").attr("class", "axis x");
  var k = f.append("g").attr("transform", "translate(35, -22)").attr("class", "axis y dist").attr("opacity", 1);
  var l = f.append("g").attr("transform", "translate(35, -22)").attr("class", "axis y type").attr("opacity", 0);
  function m(a) {
   g.scale(a.dateReported);
   j.call(g);
   h.scale(a.distBand);
   i.scale(a.extBand);
   k.call(h);
   l.call(i);
  }
  var n = f.append("g").attr("class", "crime-report-plots");
  var o = c.scales;
  var p = d3.transition().duration(950).ease(d3.easeLinear);
  function q(a, b, c) {
   var d;
   return function() {
    var e = this, f = arguments;
    var g = function() {
     d = null;
     if (!c) {
      a.apply(e, f);
     }
    };
    var h = c && !d;
    clearTimeout(d);
    d = setTimeout(g, b);
    if (h) {
     a.apply(e, f);
    }
   };
  }
  function r(b) {
   var g = b.data;
   f.attr("height", d[0].offsetHeight).attr("width", d[0].offsetWidth);
   c.setElementScales(f);
   c.setDataScales(g);
   m(o);
   function h(a) {
    if (!c.filter.extension[a.summary_offense_code] && !c.filter.district[a.district_sector]) {
     return c.disp.circRad / 10 + "vh";
    } else {
     return "0px";
    }
   }
   c.circles = n.selectAll("circle").data(b.data).enter().append("circle").attr("r", h).attr("class", "timeline-circle").attr("cx", function(a) {
    return o.dateReported(new Date(a.date_reported));
   }).attr("cy", function(a) {
    return o.distBand(a.district_sector);
   }).style("fill", function(a) {
    o.distColour(a.district_sector);
    return o.extColour(a.summary_offense_code);
   }).on("click", function(a) {
    e.showPanel(a, d3.event, this);
   });
   function i() {
    f.attr("height", d[0].offsetHeight).attr("width", d[0].offsetWidth);
    c.setElementScales(f);
    c.circles.transition(p).attr("cx", function(a) {
     return o.dateReported(new Date(a.date_reported));
    }).attr("cy", function(a) {
     if (c.disp.axis === "district") {
      return o.distBand(a.district_sector);
     } else if (c.disp.axis === "extension") {
      return o.extBand(a.summary_offense_code);
     }
    });
    m(o);
   }
   c.setCircleRad = function() {
    console.log("fired");
    q(function() {
     c.circles.transition(p).attr("r", h);
    }, 250);
   };
   c.filterCircle = i;
   c.circSetColorType = function() {
    c.circles.transition(p).style("fill", function(a) {
     return o.extColour(a.summary_offense_code);
    });
    c.disp.color = "extension";
   };
   c.circSetColorDist = function() {
    c.circles.transition(p).style("fill", function(a) {
     return o.distColour(a.district_sector);
    });
    c.disp.color = "district";
   };
   function j() {
    k.attr("opacity", 1);
    l.attr("opacity", 0);
    c.circles.transition(p).attr("cy", function(a) {
     return o.distBand(a.district_sector);
    });
   }
   function r() {
    k.attr("opacity", 0);
    l.attr("opacity", 1);
    c.circles.transition(p).attr("cy", function(a) {
     return o.extBand(a.summary_offense_code);
    });
   }
   c.toggleAxis = function() {
    if (c.disp.axis === "extension") {
     j();
     c.disp.axis = "district";
    } else if (c.disp.axis === "district") {
     r();
     c.disp.axis = "extension";
    }
   };
   angular.element(a).bind("resize", q(i, 250));
   c.scaleType = o.extColour;
   c.scaleDist = o.distColour;
  }
  c._seaCrimeData_.then(r);
 }
 return {
  require: [ "^seattleCrimePlotted" ],
  link: c
 };
} ]).factory("crimeReportPanelPlots", [ "$mdPanel", function(a) {
 var b = a;
 function c(c, e, f) {
  var g = angular.element(f);
  var h = a.newPanelPosition().relativeTo(g);
  var i = a.newPanelAnimation().openFrom(g).duration(137).closeTo(g).withAnimation(a.animation.SCALE);
  var j = {
   attachTo: angular.element(document.body),
   controller: d,
   controllerAs: "ctrl",
   position: h,
   animation: i,
   targetEvent: e,
   panelClass: "timeline-report-detail-panel",
   templateUrl: "views/timeline-report-detail-panel.html",
   clickOutsideToClose: true,
   escapeToClose: true,
   focusOnOpen: true,
   locals: {
    report: c
   }
  };
  b.open(j).then(function(a) {
   b = a;
  });
 }
 function d(a, b, c) {
  a.report = c;
  a.keys = Object.keys(c);
  a.closeDialog = function() {
   if (b) {
    b.close();
   }
  };
 }
 return function e() {
  return {
   showPanel: c
  };
 };
} ]);

angular.module("mkm.seaCrimeData").directive("crimeReportsSummary", [ function() {
 function a(a, b) {
  var c = b.attr("crime-reports-summary");
  var d = b.attr("summary-index");
  a[c] = {
   data: null,
   filtered: false,
   renderChart: function(b) {
    a[c].data = b;
    a.$apply();
   }
  };
  a.clearTypeDetail = function() {
   a[c].data = null;
  };
  a.filterTypeDetail = function(b) {
   a[c].filtered = !a[c].filtered;
   if (a[c].filtered) {
    var e = a[c].data;
    var f = e.offenseCategory === "VEH-THEFT-AUTO" ? "VEH" : e.offenseCategory;
    a.filterClear(b);
    a[d][f].show = true;
    a.filterApply(b);
   } else {
    a.filterReset(b);
    a.filterApply(b);
   }
  };
 }
 return {
  link: a,
  templateUrl: "/views/template-reports-summary.html"
 };
} ]);

angular.module("mkm.seaCrimeData").directive("vizTimeLine", [ "$window", "$mdPanel", function(a, b) {
 return {
  templateUrl: "views/template-reports-viz.html",
  scope: {
   promiseAttr: "=vizTimeData"
  },
  link: function(c, d) {
   c.getIncidentParent = function(a) {
    return a.indexOf("-") === -1 ? a : a.slice(0, a.indexOf("-"));
   };
   var e = c.getIncidentParent;
   c.$panel = b;
   c.reportFilter = [];
   var f = d.children(".crime-report-timeline")[d.children(".crime-report-timeline").length - 1];
   var g = 10;
   var h = f.offsetWidth;
   var i = f.offsetHeight;
   var j = {
    x: function(a) {
     return [ g, a - 40 ];
    },
    y: function(a) {
     return [ g + 10, a - g - 30 ];
    }
   };
   var k = d3.select(f);
   k.append("svg").attr("height", i).attr("width", h).attr("class", "seattle-crime-timeline");
   var l = k.select("svg");
   var m = d3.select("body").append("div").classed("cicle-tool-tip", true);
   var n = d3.scaleTime().range(j.x(h));
   var o = d3.scaleUtc().domain([ new Date("Wed Dec 31 1969 00:00:00 GMT-0800 (PST)"), new Date("Wed Dec 31 1969 24:00:00 GMT-0800 (PST)") ]).range(j.y(i));
   var p = d3.axisBottom().ticks(d3.timeHour, 24).tickFormat(d3.timeFormat("%m/%d")).scale(n);
   var q = d3.axisLeft();
   c.toolTipLock = c.toolTipLock || false;
   function r(b) {
    var d = b.incidents;
    c.$index = b.indexOffType;
    c.colorScaleOff = b.colorScaleOff;
    function k(a) {
     return c.colorScaleOff(e(a));
    }
    var r = d3.extent(d, function(a, b) {
     return b === 0 ? d3.timeDay.floor(new Date(a.date_reported)) : new Date(a.date_reported);
    });
    n.domain(r);
    p.scale(n);
    q.scale(o);
    function s(a, b) {
     var c = k(b.offense_type);
     switch (a) {
     case "initial":
      return "stroke: " + c + "; stroke-width: " + "2px" + "; fill-opacity: " + "0" + "; stroke-opacity: " + ".67";

     case "mouseover":
      return "fill: " + c + "; stroke-width: " + "0px" + "; fill-opacity: " + "1" + "; stroke-opacity: " + ".67";

     case "mouseout":
      return "stroke: " + c + "; stroke-width: " + "2px" + "; fill-opacity: " + "0" + "; stroke-opacity: " + ".67";
     }
    }
    function t(a) {
     var b = new Date(a.date_reported);
     var c = d3.timeFormat("%x");
     return n(new Date(c(b)));
    }
    function u(a) {
     var b = d3.timeFormat("%X");
     var c = b(new Date(a.date_reported));
     return o(new Date("Wed Dec 31 1969 " + c));
    }
    function v(a) {
     var b = a;
     var c = d3.timeFormat("%x %H:%M %p");
     m.html(c(new Date(b.date_reported)) + " / " + b.offense_type).style("left", function() {
      if (d3.event.offsetX > h * .5) {
       return d3.event.pageX - 330 + "px";
      } else {
       return d3.event.pageX + 24 + "px";
      }
     }).style("top", function() {
      return d3.event.pageY - 21 + "px";
     }).classed({
      "left-side": d3.event.offsetX < h * .5,
      "rght-side": d3.event.offsetX > h * .5
     });
     m.transition(d3.transition().duration(200)).style("opacity", 1).style("background", function() {
      return k(b.offense_type);
     }).attr("transform", "translate(" + g + "," + i + ")");
    }
    function w() {
     m.transition(d3.transition().duration(500)).style("opacity", 0);
     B.selectAll("circle").transition(d3.transition().duration(250));
     c.toolTipLock = false;
    }
    function x(a, b, c) {
     a.incidentDetail = c;
     a.closeDetail = function() {
      this.incidentDetail = null;
      b.close();
     };
    }
    function y(a) {
     var b = c.$panel.newPanelPosition().absolute().center();
     c.$panel.open({
      attachTo: angular.element(document.body),
      controller: x,
      controllerAs: "ctrl",
      disableParentScroll: true,
      templateUrl: "views/template-incident-detail.html",
      hasBackdrop: true,
      panelClass: "timeline-report-detail",
      position: b,
      trapFocus: true,
      zIndex: 150,
      clickOutsideToClose: true,
      escapeToClose: true,
      focusOnOpen: true,
      targetEvent: a,
      locals: {
       incidentDetail: a
      }
     }).finally(function() {
      var b = new google.maps.Map(document.getElementById("street-view-detail"), {
       scrollwheel: false,
       zoomControl: false,
       zoom: 0
      });
      var c = new google.maps.StreetViewPanorama(document.getElementById("street-view-detail"), {
       position: {
        lat: Number(a.latitude),
        lng: Number(a.longitude)
       },
       pov: {
        heading: 34,
        pitch: 5
       },
       scrollwheel: false
      });
      b.setStreetView(c);
     });
     c.incidentDetail = a;
    }
    var z = 10;
    var A = 7;
    var B = l.append("g").attr("transform", "translate(" + z + ", 0)").attr("id", "reports-vz-marks");
    var C = B.selectAll("circle").data(d).enter().append("circle").attr("cx", t).attr("cy", u).attr("r", A).attr("class", "timeline-circle").attr("style", function(a) {
     return s("initial", a);
    }).on("click", y).on("mouseover", function(a) {
     if (!c.toolTipLock) {
      this.setAttribute("style", s("mouseover", a));
      this.setAttribute("r", A * 2);
      v(a, this);
     }
    }).on("mouseout", function(a) {
     if (!c.toolTipLock) {
      this.setAttribute("style", s("mouseout", a));
      this.setAttribute("r", A);
      w();
     }
    });
    var D = l.append("g").attr("class", "axis x").attr("transform", "translate(" + z + "," + (i - 20) + ")").call(p);
    var E = l.append("g").attr("class", "axis y").attr("transform", "translate(50, 0)").call(q);
    function F() {
     var a = f.offsetWidth;
     var b = f.offsetHeight;
     l.attr("height", b).attr("width", a);
     n.range(j.x(a));
     o.range(j.y(b));
     D.transition().duration(100).ease("sin-in-out").attr("transform", "translate(" + z + "," + (b - 20) + ")").call(p);
     E.transition().duration(100).ease("sin-in-out").attr("transform", "translate(50, 0)").call(q);
     C.transition().duration(200).attr("cx", t).attr("cy", u);
    }
    c.filterData = function(a) {
     B.selectAll("circle").transition().duration(200).attr("cx", function(b) {
      var c = b.offense_type;
      var d = c.indexOf("-") === -1 ? c : c.slice(0, c.indexOf("-"));
      if (a.indexOf(d) < 0) {
       var e = new Date(b.date_reported).toDateString();
       var f = n(new Date(e));
       return f;
      } else {
       return -12e18;
      }
     }).attr("fill", function(a) {
      return k(a.offense_type);
     });
    };
    c.filterToggleType = function(a) {
     a.preventDefault();
     a.cancelBubble = true;
     var b = c.reportFilter.indexOf(this.val.key);
     if (b === -1) {
      c.reportFilter.push(this.val.key);
     } else {
      c.reportFilter.splice(b, 1);
     }
     c.updated = true;
    };
    c.filterAll = function(a) {
     a.preventDefault();
     a.cancelBubble = true;
     c.reportFilter = [];
     for (var b = c.$index.length - 1; b >= 0; b--) {
      c.reportFilter.push(c.$index[b].key);
     }
     c.updated = true;
    };
    c.filterReset = function(a) {
     a.preventDefault();
     a.cancelBubble = true;
     c.reportFilter = [];
     c.updated = false;
    };
    angular.element(a).bind("resize", function() {
     F();
    });
   }
   c.promiseAttr.promise.then(r);
  }
 };
} ]);

angular.module("mkm.seaCrimeData").filter("orderObjectBy", function() {
 return function(a, b, c) {
  var d = [];
  angular.forEach(a, function(a) {
   d.push(a);
  });
  d.sort(function(a, c) {
   return a[b] > c[b] ? 1 : -1;
  });
  if (c) {
   d.reverse();
  }
  return d;
 };
});

angular.module("mkm.seaCrimeData").directive("reportZoneBeat", [ "$mdMenu", function(a) {
 return {
  scope: {
   reports: "=reportData",
   reportColor: "=reportColor"
  },
  templateUrl: "views/template-zone-beat.html",
  link: function(b, c) {
   var d = b.reports;
   var e = d3.select(c.find(".report-zone-beat")[0]);
   b.$typeColorScale = d3.scaleOrdinal(d3.schemeCategory20).domain(b.reports.map(function(a) {
    return a.summarized_offense_description;
   }));
   var f = e.insert("div").html("Districts<br>Zones");
   var g = Math.floor(100 / d.length) + "%";
   var h = e.selectAll("div").data(d).enter().append("div").sort(function(a, b) {
    return d3.ascending(a.key, b.key);
   }).classed("report-districts", true).text(function(a) {
    return a.key;
   }).style("width", g);
   var i = h.selectAll("div").data(function(a) {
    return a.values;
   }).enter().append("div").sort(function(a, b) {
    return d3.ascending(a.key, b.key);
   }).classed({
    "report-zones": true
   }).text(function(a) {
    return a.key;
   });
   var j = i.selectAll("div").data(function(a) {
    return a.values;
   }).enter().append("div").style("background", b.reportColor).classed({
    badge: true
   }).html(function() {
    return "&nbsp;";
   });
   b.sortBy = "zone id";
   b.labelShow = true;
   b.sortReports = function(a) {
    switch (a) {
    case "report count by district":
     h.sort(function(a, b) {
      return d3.ascending(a.values.length, b.values.length);
     });
     break;

    case "report count by zone":
     i.sort(function(a, b) {
      return d3.descending(a.values.length, b.values.length);
     });
     break;

    case "zone id":
     i.sort(function(a, b) {
      return d3.ascending(a.key, b.key);
     });
     break;

    case "district id":
     h.sort(function(a, b) {
      return d3.ascending(a.key, b.key);
     });
     break;
    }
   };
   b.openMenu = function(b) {
    a.show(b);
   };
   b.changeColor = function() {
    j.style("background", function(a) {
     return b.$typeColorScale(a.summarized_offense_description);
    });
   };
   b.labelsHide = function() {
    f.style("opacity", b.labelShow ? 0 : 1);
    b.labelShow = !b.labelShow;
   };
  }
 };
} ]);

angular.module("mkm.seaCrimeData").directive("reportTypeDay", [ "$window", function(a) {
 var b = angular.element(a);
 b.bind("resize", function(a) {
  console.log(a);
 });
 return {
  scope: {
   reports: "=reportData",
   reportCount: "=reportCount",
   reportColor: "=reportColor"
  },
  link: function(a, b) {
   b.ready(function(b) {
    a.elmWidth = b("report-type-day").outerWidth();
   });
   var c = d3.select(b[0]);
   a.$typeColorScale = d3.scale.category20().domain(a.reports.map(function(a) {
    return a.summarized_offense_description;
   }));
   var d = c.selectAll("div.report-date").data(a.reports).enter().append("div").attr("layout", "row").classed({
    "report-date": true
   }).text(function(a) {
    return a.key + " Count: " + a.values.length;
   });
   var e = d.append("div").classed({
    "report-types": true
   }).style("width", function(a) {
    return Math.ceil(a.values.length) + "%";
   }).style("background", function(a) {
    return a.values[0].fillColor;
   });
   e.selectAll("div").data(function(a) {
    return a.values;
   }).enter().append("div").classed({
    "report-type": true
   }).style("background", function(b) {
    return a.$typeColorScale(b.summarized_offense_description);
   }).style("width", function() {
    return Math.ceil(a.elmWidth * .01) + "px";
   }).html("&nbsp;");
  }
 };
} ]);

angular.module("mkm.seaCrimeData").directive("reportTypeChild", [ function() {
 return {
  scope: {
   reports: "=reportData",
   reportCount: "=reportCount"
  },
  link: function(a, b) {
   var c = b[0];
   var d = d3.select(c);
   var e = 960;
   var f = d3.layout.pack().sort(null).size([ e, e ]).padding(1.5);
   var g = d.append("svg").attr("width", e).attr("height", e).attr("class", "bubble");
   var h = g.selectAll(".node").data(f.nodes(a.reports)).enter().append("g").attr("class", "node").attr("transform", function(a) {
    if (!isNaN(a.x && a.y)) {
     return "translate(" + a.x + "," + a.y + ")";
    } else {
     return "translate(0,0)";
    }
   });
   h.append("title").text(function(a) {
    return a.key;
   });
   h.append("circle").attr("r", function() {
    return 10;
   }).style("fill", function(a) {
    return a.fillColor;
   });
   d3.select(this.frameElement).style("height", e + "px");
  }
 };
} ]);

angular.module("mkm.seaCrimeData").run([ "$templateCache", function(a) {
 a.put("views/crime-view.html", '<!-- INTRO --><!-- <div flex="100" flex-gt-md="50">\n' + "  <h1>Seattle Crime Reports</h1>\n" + '  <p>The following examples all use data that can be found at <a href="https://data.seattle.gov/Public-Safety/Seattle-Police-Department-Police-Report-Incident/7ais-f98f" target="_blank">data.seattle.gov</a>. An HTTP requests a <a href="https://data.seattle.gov/resource/7ais-f98f.json" target="_blank">JSON object</a> at page load. JSON data is then processed using D3 and native JavaScript, and finally rendered as Angular directives. All visualastions are SVG elements generated by D3. Mapping is done with Google Maps JavaScript API.</p>\n' + '  <p>Coded by <a href="http://kylemoseby.com" target="_blank">Kyle Moseby</a>.</p>\n' + '  <p><a href="https://github.com/kylemoseby/angular-seattle-crime-data" target="_blank">A GitHub Repo can be found here <span class="icon-github"></span></a></p>\n' + "  <h3>Dependencies</h3>\n" + "  <ul>\n" + '    <li><a href="https://angularjs.org/" target="_blank">AngularJS</a></li>\n' + '    <li><a href="https://D3js.org/" target="_blank">D3</a></li>\n' + '    <li><a href="https://developers.google.com/maps//" target="_blank">Google Maps</a></li>\n' + "  </ul>\n" + "</div>\n" + ' --><!-- // INTRO --><!-- TIMELINE --> <div class="container-fluid"> <seattle-crime-plotted class="row"> <div class="col-sm-5 crime-plot-menu"> <crime-plot-menu></crime-plot-menu> </div> <div class="col-sm-7"> <crime-plot-svg></crime-plot-svg> </div> </seattle-crime-plotted> <!-- // TIMELINE --> <!-- GOOGLE MAP --> <!-- flex-gt-md="40" --> <div flex="100"> <h2>Reports by Latitude and Longitude</h2> <seattle-crime-map layout="row" flex="100" map-promise="$seaCrimeData" map-style="mapStyle"> <map-canvas flex="40"></map-canvas> <map-filters flex="40"></map-filters> </seattle-crime-map> </div> <!-- // GOOGLE MAP --> <!-- BAR CHART --> <div flex="100" flex-gt-md="100"> <h2>Report count by incident type</h2> <div id="crime-reports-block" crime-reports-block crime-reports-data="$seaCrimeData"></div> </div> <!-- // BAR CHART --> </div> <!-- TYPE DETAIL EXAMPLE --> <!-- <div layout="column" class="report-type-detail"> --> <!-- <div flex> --> <!-- <h2>Type Detail</h2> --> <!-- <div ng-include="\'views/template-report-type-detail.html\'"></div> --> <!-- <h2>Incident Detail</h2> --> <!-- <div ng-include="\'views/template-incident-detail.html\'" onload="incidentStreetView()" class="incident-example"></div> --> <!-- </div> --> <!-- </div> --> <!-- // TYPE DETAIL EXAMPLE --> <!-- // REPORT DETAIL EXAMPLE -->');
 a.put("views/progress-bar.html", '<div class="loading-wrapper"> <div class="progress"> <div class="progress-bar" role="progressbar" aria-valuenow="{{valNow}}" aria-valuemin="2" aria-valuemax="{{valMax}}" style="width: {{valNow}}%"> <span class="sr-only">{{valNow}}% Complete</span> </div> </div> </div>');
 a.put("views/template-crime-map-filter.html", '<md-menu> <md-button aria-label="Filter crime data" class="md-icon-button" ng-click="$mdMenu.open($event)"> <span class="glyphicon glyphicon-filter"></span> </md-button> <md-menu-content width="8"> <md-menu-item> <md-button ng-click="filterApply($event)">Apply </md-button></md-menu-item> <md-menu-item> <md-button ng-click="filterReset($event)" ng-disabled="!mapIndexFilter().length > 0" md-prevent-menu-close>Reset </md-button></md-menu-item> <md-menu-item> <md-button ng-click="filterClear($event)" ng-disabled="$indexLength() === mapIndexFilter().length" md-prevent-menu-close>Clear All </md-button></md-menu-item> <md-menu-divider></md-menu-divider> <md-menu-item ng-repeat="(key, val) in filterInd | orderObjectBy : \'count\' : true"> <md-button ng-click="filterPushSplice($event)" ng-class="{\'md-primary\' : val.show}" md-prevent-menu-close> {{val.offenseCategory}} <span class="badge" style="background-color: {{val.fillColor}}">&nbsp;</span> </md-button> </md-menu-item> </md-menu-content> </md-menu>');
 a.put("views/template-crime-plot-menu.html", '<button class="btn" ng-click="toggleAxis()">{{disp.axis}}</button> <button class="btn" ng-click="circSetColorType()" ng-class="{ \'btn-primary\' : disp.color === \'extension\' }">By Code Extension</button> <button class="btn" ng-click="circSetColorDist()" ng-class="{ \'btn-primary\' : disp.color === \'district\' }">By District</button> <md-slider ng-model="disp.circRad" min="5" max="20" step="3" ng-change="setCircleRad()" aria-label="Plot display size"></md-slider> <br> Display size: {{disp.circRad}} <br> <ul class="filter-list"> <li> <h3>Code Extension</h3> </li> <li> <md-checkbox aria-label="Select All" ng-checked="isChecked(\'extension\')" ng-click="toggleAll(\'extension\')"> <span ng-if="isChecked(\'extension\')">Un-</span>Select All </md-checkbox> </li> <li ng-repeat="_c in offCodes | orderBy:\'-values.length\'"> <!-- <li ng-repeat="_c.key in scaleType.domain()"> --> <md-checkbox ng-model="filter.extension[_c.key]" aria-label="offCodeMap[\'$\' + _c.key].offense_type_description" ng-checked="true" ng-change="filterChange()"> <span class="badge" style="background-color: {{scaleType(_c.key)}}" ng-show="disp.color === \'extension\'">&nbsp;</span> {{_c.key}} - {{offCodeMap[\'$\' + _c.key].offense_type_description}} ({{_c.values.length}}) </md-checkbox> </li> </ul> <ul class="filter-list"> <li> <h3>Districts</h3> </li> <li> <md-checkbox aria-label="Select All" ng-checked="isChecked(\'district\')" ng-click="toggleAll(\'district\')"> <!-- md-indeterminate="isIndeterminate()" --> <span ng-if="isChecked(\'district\')">Un-</span>Select All </md-checkbox> </li> <li ng-repeat="_d in districts | orderBy:\'-values.length\'"> <!-- <li ng-repeat="_d.key in scaleDist.domain()"> --> <md-checkbox ng-model="filter.district[_d.key]" aria-label="_d.key" ng-checked="true" ng-change="filterCircle()"> <span class="badge" style="background-color: {{scaleDist(_d.key)}}">&nbsp;</span> {{_d.key}} ({{_d.values.length}}) </md-checkbox> </li> </ul>');
 a.put("views/template-incident-detail.html", '<div layout="row" layout-wrap layout-padding> <!-- TABLE --> <div flex="100"> <button type="button" class="btn btn-primary" ng-click="closeDetail()" aria-lable="Close Detail"> <span class="glyphicon glyphicon-remove"></span> </button> <div class="table-responsive"> <table class="table"> <thead> <tr> <td>Date Reported</td> <td>Address</td> <td>District Sector</td> <td>Census Tract</td> <td>General Offense Number</td> <td>Offense Type</td> <td>Offense Code</td> <td>Description</td> <td>Zone/Beat</td> </tr> </thead> <tbody> <tr> <td>{{incidentDetail.date_reported | date:\'medium\'}}</td> <td>{{incidentDetail.hundred_block_location}}</td> <td>{{incidentDetail.district_sector}}</td> <td>{{incidentDetail.census_tract_2000}}</td> <td>{{incidentDetail.general_offense_number}}</td> <td>{{incidentDetail.offense_type}}</td> <td>{{incidentDetail.offense_code}}</td> <td>{{incidentDetail.summarized_offense_description}}</td> <td>{{incidentDetail.zone_beat}}</td> </tr> </tbody> </table> </div> </div> <!-- // TABLE --> <!-- STREET VIEW --> <div flex="100" flex-gt-sm="50"> <div id="street-view-detail"></div> </div> <!-- // STREET VIEW --> </div>');
 a.put("views/template-map-filters.html", '<div ng-show="indexOffType"> <!-- FILTER TYPE --> <button ng-click="filterToggleType($event)" ng-repeat="(key, val) in indexOffType" class="btn" ng-class="{\n' + "        'btn-default'  : filters.reportFilter.indexOf(val.key) !== -1 && showApply,\n" + "        'btn-primary' : filters.reportFilter.indexOf(val.key) === -1,\n" + "        'btn-link' : filters.reportFilter.indexOf(val.key) !== -1 && !showApply\n" + '     }" aria-label="{{vall.key}}"> <div class="badge" style="background-color: {{filters.reportFilter.indexOf(val.key) !== -1 && !showApply ? \'#555\' : colorScaleOff(val.key)}}"><span class="glyphicon glyphicon-eye-close" ng-show="filters.reportFilter.indexOf(val.key) !== -1"></span>&nbsp;</div> {{val.key}} </button> <!-- // FILTER TYPE --> <!-- FILTER DATE --> <div class="map-filter-date"> <md-datepicker ng-model="filters.startDate" md-min-date="dateRange[0]" md-max-date="filters.endDate" md-placeholder="Start date" ng-click="dateChange($event)"></md-datepicker> <md-datepicker ng-model="filters.endDate" md-min-date="filters.startDate" md-max-date="dateRange[1]" md-placeholder="End date" ng-click="dateChange($event)"></md-datepicker> </div> <!-- // FILTER DATE --> <button class="btn btn-default" ng-click="filterApply($event)" ng-show="showApply" aria-labvel="Apply">Apply</button> <button class="btn btn-default" ng-click="filterAll()" aria-label="Filter All">Filter All</button> <button class="btn btn-default" ng-click="filterNone()" aria-label="Show All">Show All</button> </div>');
 a.put("views/template-report-type-detail.html", '<div layout="row" layout-padding layout-margin layout-wrap> <div flex> <button type="button" class="btn btn-close btn-primary" ng-click="closeDetail()" aria-label="Close Detail"> <span class="glyphicon glyphicon-remove"></span> </button> <h2>{{reportType.key}} <span class="badge" ng-style="{ background: reportType.fillColor}">{{reportType.values.length}}</span></h2> <h3>Reports per zone</h3> <report-zone-beat report-data="dataZoneBeat" report-color="reportType.fillColor"></report-zone-beat> </div> <div flex="100"> <h3>Reports per day</h3> <!-- NEED A WAY TO PASS FILL COLOUR TO DIRECTIVE --> <!-- <report-type-day report-count="reportType.values.length" report-data="dataTypeDay" report-color="reportType.fillColor"></report-type-day> --> </div> </div>');
 a.put("views/template-reports-block.html", '<div class="loading-wrapper"> <div class="progress"> <div class="progress-bar" role="progressbar" aria-valuenow="{{progress.now}}" aria-valuemin="2" aria-valuemax="{{progress.max}}" style="width: {{progress.loaded}}%"> <span class="sr-only">{{progress.now}}% Complete</span> </div> </div> <br> max {{progress.max}}<br> now {{progress.now}} </div>');
 a.put("views/template-reports-summary.html", '<div class="panel panel-default" ng-show="$typeDetail.data !== null"> <!-- Default panel contents --> <div class="panel-heading">Incident Type Summary</div> <div class="panel-body"> <table class="table"> <thead> <tr> <th>Offense Category</th> <th></th> <th>Offense Count</th> <th>% of Total Incidents</th> <th>Child types</th> <th></th> </tr> </thead> <tbody> <td> {{$typeDetail.data.offenseCategory}} </td> <td> <span class="badge" style="background-color: {{$typeDetail.data.fillColor}}">&nbsp;</span> </td> <td> {{$typeDetail.data.count}} </td> <td> {{ ($typeDetail.data.count / $reports.length) * 100 | number:0 }} </td> <td> <ul> <li ng-repeat="(key, value) in $typeDetail.data.children | orderObjectBy : \'count\' : true" class="list-unstyled"> {{value.$type}} {{value.count}} </li> </ul> </td> <td width="33%"> <ul> <li ng-repeat="(key, value) in $typeDetail.data.children | orderObjectBy : \'count\' : true" class="list-unstyled"> <div class="reportTotals" style="background-color: {{$typeDetail.data.fillColor}}; width: {{value.count / 10}}%">&nbsp;</div> </li> </ul> </td> </tbody> </table> <div class="btn-group" role="group"> <button type="button" class="btn btn-default" ng-click="filterTypeDetail($event)"><span class="glyphicon glyphicon-filter"></span></button> <button type="button" class="btn btn-default" ng-click="clearTypeDetail($event)"><span class="glyphicon glyphicon-remove"></span></button> </div> </div> </div>');
 a.put("views/template-reports-viz.html", '<!-- FILTER MENU --> <md-menu class="crime-map-filter"> <!-- FILTER BUTTON  --> <md-button aria-label="Filter crime data" class="md-icon-button" ng-click="$mdMenu.open($event)"> <span class="glyphicon glyphicon-filter"></span> </md-button> <!-- // FILTER BUTTON  --> <md-menu-content width="12"> <md-menu-item> <md-button ng-click="filterData(reportFilter)">Apply</md-button> </md-menu-item> <md-menu-item> <md-button ng-click="filterReset($event)" ng-disabled="reportFilter.length === 0" md-prevent-menu-close>Reset</md-button> </md-menu-item> <md-menu-item> <md-button ng-click="filterAll($event)" ng-disabled="reportFilter === []" md-prevent-menu-close>Clear All</md-button> </md-menu-item> <md-menu-divider></md-menu-divider> <md-menu-item ng-repeat="(key, val) in $index"> <md-button ng-click="filterToggleType($event)" ng-class="{\'md-primary\' : reportFilter.indexOf(val.key) === -1}" md-prevent-menu-close> <span class="badge" style="background-color: {{colorScaleOff(val.key)}}">&nbsp;</span> {{val.key}} ({{val.values.length}}) </md-button> </md-menu-item> </md-menu-content> </md-menu> <!-- // FILTER MENU --> <!-- TIMELINE CANVAS --> <div class="crime-report-timeline"></div> <!-- // TIMELINE CANVAS -->');
 a.put("views/template-summary-list.html", '<ul class="list-unstyled"> <li ng-repeat="(key, val) in $index | orderObjectBy : \'count\' : true"> <div class="reportTotals" style="background-color: {{val.fillColor}}; width: {{val.count / 10}}%"></div> {{val.offenseCategory}} <span class="badge">{{val.count}}</span> <span ng-repeat="child in val.children">{{child.$type}}&nbsp;&nbsp;{{child.count}}&nbsp;&nbsp;</span> </li> </ul>');
 a.put("views/template-zone-beat.html", '<!-- SORT BY --> <md-menu name="reportSortBy"> <md-button aria-label="Sort by" class="md-icon-button" ng-click="$mdMenu.open($event)"> <span class="glyphicon glyphicon-sort"></span> </md-button> <md-menu-content width="4"> <md-menu-item> <md-button ng-click="sortReports(\'report count by district\')"> report count by district </md-button> </md-menu-item> <md-menu-item> <md-button ng-click="sortReports(\'report count by zone\')"> report count by zone </md-button> </md-menu-item> <md-menu-item> <md-button ng-click="sortReports(\'zone id\')"> zone id </md-button> </md-menu-item> <md-menu-item> </md-menu-item> </md-menu-content> </md-menu> <!-- // SORT BY --> <!-- COLOR  --> <md-button ng-click="changeColor()"> Color </md-button> <!-- // COLOR --> <!-- INDEX --> <ul class="list-inline"> <li ng-repeat="report in $typeColorScale.domain()"> <span class="badge" style="background: {{$typeColorScale(report)}}">{{report}}</span> </li> </ul> <!-- // INDEX  --> <md-button ng-click="labelsHide()"> {{labelShow ? \'Hide\' : \'Show\'}} labels </md-button> <div class="report-zone-beat"></div>');
 a.put("views/timeline-report-detail-panel.html", '<ul> <li ng-repeat="key in keys">{{key}}</li> </ul> <button type="button" class="btn btn-primary" ng-click="closeDialog()" aria-lable="Close Detail"> <span class="glyphicon glyphicon-remove"></span> </button> <div class="table-responsive"> <table class="table"> <thead> <tr> <td>Date Reported</td> <td>Address</td> <td>District Sector</td> <td>Census Tract</td> <td>General Offense Number</td> <td>Offense Type</td> <td>Offense Code</td> <td>Description</td> <td>Zone/Beat</td> </tr> </thead> <tbody> <tr> <td>{{report.date_reported | date:\'medium\'}}</td> <td>{{report.hundred_block_location}}</td> <td>{{report.district_sector}}</td> <td>{{report.census_tract_2000}}</td> <td>{{report.general_offense_number}}</td> <td>{{report.offense_type}}</td> <td>{{report.offense_code}}</td> <td>{{report.summarized_offense_description}}</td> <td>{{report.zone_beat}}</td> </tr> </tbody> </table> </div>');
} ]);