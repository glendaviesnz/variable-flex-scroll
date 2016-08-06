(function () {
    'use strict';
    angular.module('connectMaps')
        .directive('customScroll', customScroll);
    /** @ngInject */
    function customScroll($document, $window, $timeout, $parse, lodash) {
        //var resizeWatcher;
        return {
            restrict: 'A',
            replace: false,
            scope: {
                scrollToBottom: '&'
            },
            transclude: true,
            link: { post: customScrollPostLink },
            template: '<div class="scroll-wrapper">' +
                '<div class="scroll-container">' +
                '<div class="scroll-content" ng-transclude></div>' +
                '<div class="scroll-bar scrollbar-hidden"></div></div>'
        };
    }
})();
