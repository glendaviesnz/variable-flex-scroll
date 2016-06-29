# variable-flex-scroll
A custom scrollbar for variable height flex items - background info can be found at http://caughtexceptions.blogspot.co.nz/2016/06/custom-scrollbar-for-variable-height.html and a working demo at https://plnkr.co/edit/p1ps6Nx0vyldiXVv4xlf?p=preview

This is a proof of concept Angular directive to apply a custom scrollbar to variable height flex items using native OS scrolling. 

Todo: 
* Tidy up and move bulk of functionality to ES6 module and make the directive a wrapper only
* Add tests
* Remove dependency on ng-lodash (only used for debouncing resize and mutation watchers)
