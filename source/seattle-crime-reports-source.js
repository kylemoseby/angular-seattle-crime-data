"use strict";

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

"use strict";

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

"use strict";

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
   var i = h - f - 120;
   var j = d3.select(e);
   j.append("svg").attr("height", h).attr("width", g);
   var k = j.select("svg");
   var l = k.selectAll("g.reports-index-rect");
   var m = d3.scaleBand().range([ f, g - f ]);
   var n = d3.scaleLinear().range([ f, i ]);
   function o(a) {
    return a === "VEH-THEFT-AUTO" ? "VEH" : a;
   }
   c.$promise.promise.then(function(b) {
    var d = b.indexOffType.sort(function(a, b) {
     return d3.descending(a.values.length, b.values.length);
    });
    var j = b.colorScaleOff;
    var p = d.map(function(a) {
     return o(a.key);
    });
    m.domain(p.reverse());
    n.domain([ 0, d3.max(d, function(a) {
     return a.values.length;
    }) ]);
    l.data(d).enter().append("g").attr("id", function(a) {
     return a.key;
    }).attr("class", "reports-index-rect").attr("transform", "translate(" + f + ",80)");
    var q = k.selectAll("g.reports-index-rect").append("rect").attr("transform", function(a) {
     var b = m(o(a.key));
     return "translate(" + b + "," + (i - f) * 2 + ") rotate(180)";
    }).attr("y", function() {
     return i - f;
    }).attr("width", m.bandwidth()).attr("height", function(a) {
     return n(a.values.length);
    }).attr("fill", function(a) {
     return j(a.key);
    });
    var r = k.selectAll("g.reports-index-rect").append("text").attr("transform", function(a) {
     var b = m(o(a.key));
     return "translate(" + (b - m.bandwidth() * .33) + ", " + (i - f + 9) + ") rotate(-33)";
    }).attr("text-anchor", "end").attr("class", "block-label category").text(function(a) {
     return a.key;
    });
    var s = k.selectAll("g.reports-index-rect").append("text").attr("transform", function(a) {
     var b = m(o(a.key));
     return "translate(" + (b - m.bandwidth() * .5) + ", " + (i - n(a.values.length) - f - 5) + ")";
    }).attr("class", "block-label count").attr("text-anchor", "middle").text(function(a) {
     return a.values.length;
    });
    function t() {
     f = e.offsetWidth * .033;
     g = e.offsetWidth;
     h = e.offsetHeight;
     i = h - f - 120;
     k.attr("height", h).attr("width", g);
     m.bandwidth([ f, g - f ]);
     n.range([ f, i ]);
     r.transition().duration(100).ease("sin-in-out").attr("transform", function(a) {
      var b = m(o(a.key));
      return "translate(" + (b - m.bandwidth() * .33) + ", " + (i - f + 7) + ") rotate(-50)";
     });
     s.transition().duration(100).ease("sin-in-out").attr("transform", function(a) {
      var b = m(o(a.key));
      return "translate(" + (b - m.bandwidth() * .5) + ", " + (i - n(a.values.length) - f - 6) + ")";
     });
     q.transition().duration(100).ease("sin-in-out").attr("transform", function(a) {
      var b = m(o(a.key));
      return "translate(" + b + "," + (i - f) * 2 + ") rotate(180)";
     }).attr("y", function() {
      return i - f;
     }).attr("width", m.bandwidth()).attr("height", function(a) {
      return n(a.values.length);
     });
    }
    c.blockID = {
     refreshBlocks: t
    };
    angular.element(a).bind("resize", t);
   });
  }
 };
} ]);

"use strict";

angular.module("mkm.seaCrimeData").directive("mapCanvas", [ "$window", "$http", "$mdPanel", function(a, b, c) {
 function d(b, d) {
  function e(a) {
   return a.indexOf("-") === -1 ? a : a.slice(0, a.indexOf("-"));
  }
  b.filters = {
   reportFilter: [],
   indexDateDisabled: [],
   startDate: new Date(),
   endDate: new Date()
  };
  b.showApply = false;
  b.colorScaleOff = d3.schemeCategory20;
  var f = function(a) {
   var b = c;
   var d = b.newPanelPosition().absolute().center();
   b.open({
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
    position: d,
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
   return {
    init: function() {}
   };
  };
  var g = function() {
   var a = new google.maps.InfoWindow();
   return {
    mapInit: function(c, d) {
     var g = d.feature.f;
     a.setContent('<ul class="list-unstyled">' + '<li><span class="glyphicon glyphicon-pushpin" style="color: ' + b.colorScaleOff(e(g.offense_type)) + '"></span>' + g.offense_type + " " + g.date_reported + "</li>" + "<li>Block: " + g.hundred_block_location + "</li>" + "<li>Description: " + g.summarized_offense_description + "</li>" + '<li><md-button id="map-info-btn">More info</md-button></li>' + "</ul>");
     var h = new google.maps.Marker({
      position: d.latLng.toJSON(),
      map: c,
      title: g.offense_type,
      icon: "images/spacer.gif"
     });
     a.open(c, h);
     google.maps.event.addListener(a, "domready", function() {
      var a = d3.select("#map-info-btn");
      a.on("click", function() {
       h.setMap(null);
       f(g);
      });
     });
    }
   };
  };
  var h = function() {
   var c = new google.maps.Map(d.children()[d.children().length - 1], {
    scrollwheel: false,
    streetViewControl: false,
    mapTypeControl: false,
    panControl: false,
    maxZoom: 17
   });
   function f(a) {
    g().mapInit(c, a);
   }
   c.data.addListener("click", f);
   if (!!b.mapStyle) {
    c.setOptions(b.mapStyle);
   }
   return {
    addCrimeData: function(d) {
     var f = [];
     var g = new google.maps.LatLngBounds();
     function h(a) {
      var c = new Date(a);
      return c >= b.filters.startDate && c <= b.filters.endDate ? true : false;
     }
     function i(a) {
      return b.filters.reportFilter.indexOf(e(a)) > -1 ? false : true;
     }
     for (var j = d.length - 1; j >= 0; j--) {
      var k = d[j];
      var l = Number(k.longitude);
      var m = Number(k.latitude);
      if (!isNaN(l) && !isNaN(m)) {
       if (h(k.date_reported)) {
        if (i(k.offense_type)) {
         g.extend(new google.maps.LatLng(m, l));
         f.push({
          type: "Feature",
          geometry: {
           type: "Point",
           coordinates: [ l, m ]
          },
          properties: k
         });
        }
       }
      }
     }
     c.data.addGeoJson({
      type: "FeatureCollection",
      features: f
     });
     var n = d3.nest().key(function(a) {
      try {
       return e(a.properties.offense_type);
      } catch (b) {
       console.log(b);
       console.log(a);
      }
     }).entries(f);
     b.filters.indexDateDisabled = n.map(function(a) {
      return a.key;
     });
     c.fitBounds(g);
     angular.element(a).bind("resize", function() {
      c.fitBounds(g);
     });
     return this;
    },
    applyFilters: function() {
     c.data.setStyle(function(a) {
      return {
       icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 4,
        fillColor: typeof b.colorScaleOff === "function" ? b.colorScaleOff(e(a.f.offense_type)) : "transparent",
        fillOpacity: 1,
        strokeWeight: 0
       }
      };
     });
     return this;
    },
    removeCrimeData: function() {
     c.data.forEach(function(a) {
      c.data.remove(a);
     });
     return this;
    }
   };
  }();
  b.mapRefresh = function() {
   h.removeCrimeData();
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
   h.removeCrimeData();
   h.addCrimeData(b.crimeReports, b.filters);
   h.applyFilters();
   b.showApply = false;
  };
  if (b.$promise !== undefined) {
   b.$promise.promise.then(function(a) {
    b.dateRange = d3.extent(a.incidents, function(a) {
     return new Date(a.date_reported);
    });
    b.filters.startDate = b.dateRange[0];
    b.filters.endDate = b.dateRange[1];
    b.indexOffType = a.indexOffType;
    b.colorScaleOff = a.colorScaleOff;
    b.crimeReports = a.incidents;
    h.addCrimeData(a.incidents).applyFilters();
   });
  } else if (b.report !== undefined) {
   var i = b.report;
   b.filters.startDate = new Date(i.date_reported);
   b.filters.endDate = new Date(i.date_reported);
   var j = Number(i.longitude);
   var k = Number(i.latitude);
   if (!isNaN(j) && !isNaN(k)) {
    var l = new google.maps.LatLngBounds();
    l.extend(new google.maps.LatLng(k, j));
    h.addCrimeData([ i ]).applyFilters();
    angular.element(a).bind("resize", function() {
     console.log("fix this");
    });
   }
  }
 }
 return {
  templateUrl: "views/template-map-canvas.html",
  scope: {
   $promise: "=mapPromise",
   mapStyle: "=mapStyle",
   report: "=crimeReport"
  },
  link: d
 };
} ]);

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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
   b.$typeColorScale = d3.scale.category20().domain(b.reports.map(function(a) {
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

"use strict";

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

"use strict";

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
} ]);