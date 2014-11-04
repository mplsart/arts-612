/*
MPLS Art Angular App
*/
var mainApp = angular.module('mainApp', ['ngRoute']);

/* Routing */
mainApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/static/partials/main.html'
      }).
      when('/galleries', {
        templateUrl: '/static/partials/galleries.html',
        controller: 'GalleriesListCtrl'
      }).
      when('/calendar', {
        templateUrl: '/static/partials/calendar.html',
        controller: 'EventListCtrl'
      }).
      when('/calendar/:event_id', {
        templateUrl: '/static/partials/event.html',
        controller: 'EventDetailCtrl'
      }).
      when('/galleries/:slug', {
        templateUrl: '/static/partials/gallery_detail.html',
        controller: 'GalleryDetailCtrl'
      }).
      otherwise({
        templateUrl: '/static/partials/main.html'
        //redirectTo: '/'
      });
  }]);

// Set HTML5 mode...
mainApp.config(function($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
});