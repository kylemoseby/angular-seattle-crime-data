module.exports = function(config) {
  config.set({

    basePath: '../',

    files: [
      // bower
      "bower_components/jquery/dist/jquery.js",
      "bower_components/angular/angular.js",
      "bower_components/angular-route/angular-route.js",
      "bower_components/angular-loader/angular-loader.js",
      "bower_components/angular-mocks/angular-mocks.js",
      "bower_components/bootstrap/dist/js/bootstrap.js",
      "bower_components/angular-animate/angular-animate.js",
      "bower_components/angular-aria/angular-aria.js",
      "bower_components/angular-messages/angular-messages.js",
      "bower_components/angular-material/angular-material.js",
      // bower end
      // "app/scripts/**/*.js",
      "app/scripts/sea-crime/seattle-data-gov.js",
      "app/scripts/sea-crime/crime-reports-blocks.js",
      "app/scripts/sea-crime/crime-reports-timeline.js",
      "app/scripts/sea-crime/crime-reports-map.js",
      "app/scripts/sea-crime/crime-filter.js",
      "app/scripts/sea-crime/crime-reports-summary.js",
      "app/scripts/sea-crime/crime-incident-detail.js",
      "app/scripts/sea-crime/filter-order-object.js",
      "app/scripts/sea-crime/reports-type-by-day.js",
      "app/scripts/sea-crime/reports-type-child.js",
      "app/scripts/sea-crime/report-zone-beat.js",
      "app/scripts/services/mapstyle.js",
      "app/scripts/app.js",
      "app/scripts/directives/test4test.js",
      "test/spec/**/*.js"
    ],

    autoWatch: true,

    frameworks: ['jasmine'],

    browsers: ['Chrome'],

    plugins: [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-jasmine',
      'karma-junit-reporter'
    ],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
