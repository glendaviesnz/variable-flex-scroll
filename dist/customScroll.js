"use strict";
function customScroll(scope, element, attributes) {
    var raf = window.requestAnimationFrame || window.setImmediate || function (c) { return $timeout(c, 0); };
    var config = $parse(attributes.customScroll)() || {};
    var elementToWatch;
    // a flexible height container is one where the parent container height is not 100vh
    if (config.flexibleHeight && config.flexibleContainerClass) {
        var flexibleContainer = $document[0].getElementsByClassName(config.flexibleContainerClass)[0];
        var flexibleContainerHeight = flexibleContainer.offsetHeight;
    }
    var parentElement = element[0];
    // get computed style of parent so scroll children can take account of padding and margins
    // in sizing
    var computedStyle = window.getComputedStyle(parentElement);
    var scrollWrapper = parentElement.getElementsByClassName("scroll-wrapper")[0];
    var scrollContent = parentElement.getElementsByClassName("scroll-content")[0];
    var scrollContainer = parentElement.getElementsByClassName("scroll-container")[0];
    var scrollBar = parentElement.getElementsByClassName("scroll-bar")[0];
    var containerHeight = (parentElement.clientHeight) - (parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom));
    var containerWidth = parentElement.clientWidth;
    // add extra class to target firefox on mac in order to hide native scrollbars
    // https://bugzilla.mozilla.org/show_bug.cgi?id=926294
    if (isMacMozilla()) {
        scrollContainer.classList.add('mac-mozilla');
    }
    // need to add window resize watcher so scroll boxes can adapt to window size changes
    var resizeWatcher = lodash.debounce(recalculateSizes, 200);
    window.addEventListener('resize', resizeWatcher);
    // add a mutation observer to the scrollContent element in order to fire a recalculation of
    // scrollable content sizes if content is added or removed from scroallable area
    if (config.mutationWatchClass) {
        elementToWatch = element[0].getElementsByClassName(config.mutationWatchClass)[0];
    }
    else {
        elementToWatch = element[0].getElementsByClassName("scroll-container")[0];
    }
    if (elementToWatch) {
        var mutationObserver = new MutationObserver(resizeWatcher);
        mutationObserver.observe(elementToWatch, { attributes: true, childList: true, characterData: false, subtree: true });
    }
    // add a mutation observer to the scrollContent element in order to fire a recalculation of
    // scrollable content sizes if content is added or removed from scroallable area
    // var mutationObserver = new MutationObserver(resizeWatcher);
    // mutationObserver.observe(scrollContent, { attributes: false, childList: true, characterData: false, subtree: true });
    // set the initial fixed size of scrollwrapper and scrollcontent. Directive uses technique at
    // https://blogs.msdn.microsoft.com/kurlak/2013/11/03/hiding-vertical-scrollbars-with-pure-css-in-chrome-ie-6-firefox-opera-and-safari/
    // to hide scrollbar
    setElementHeightAndWidth(scrollWrapper, containerHeight, containerWidth);
    setElementHeightAndWidth(scrollContent, containerHeight, containerWidth);
    // if container is overflowing add dropshadow at bottom of box to indicate to 
    // user that there is scrollable content
    if (getScrollRatio(scrollContainer) !== 1) {
        scrollWrapper.classList.add('scroll-down');
    }
    dragHandler(scrollBar, scrollContainer);
    moveScrollbar();
    scrollContainer.addEventListener('scroll', moveScrollbar);
    scrollContainer.addEventListener('mouseenter', moveScrollbar);
    scope.$on('$destroy', function () {
        scrollContainer.removeEventListener('scroll', moveScrollbar);
        scrollContainer.removeEventListener('mouseenter', moveScrollbar);
        window.removeEventListener('resize', resizeWatcher);
        mutationObserver.disconnect();
    });
    function getScrollRatio(element) {
        return element.clientHeight / element.scrollHeight;
    }
    function setElementHeightAndWidth(element, height, width) {
        element.style.width = width + 'px';
        element.style.height = height + 'px';
    }
    function scrollToBottom() {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
    function scrollToTop(containerHeight, containerWidth) {
        scrollContainer.scrollTop = 0;
        // need to re run the resize after doing scroll to top as changes to scrollHeight
        // don't seem to be picked up on first resize if container has been scrolled before
        // DOM change
        $timeout(function () {
            setElementHeightAndWidth(scrollWrapper, containerHeight, containerWidth);
            setElementHeightAndWidth(scrollContent, containerHeight, containerWidth);
            if (getScrollRatio(scrollContainer) !== 1) {
                scrollWrapper.classList.add('scroll-down');
            }
            else {
                scrollWrapper.classList.remove('scroll-down');
                scrollWrapper.classList.remove('scroll-up');
            }
        }, 300);
    }
    function recalculateSizes() {
        scrollContainer.scrollRatio = scrollContainer.clientHeight / scrollContainer.scrollHeight;
        computedStyle = window.getComputedStyle(parentElement);
        if (parentElement.offsetLeft + parentElement.clientWidth > window.innerWidth) {
            containerWidth = window.innerWidth - parentElement.offsetLeft;
        }
        else {
            containerWidth = parentElement.clientWidth;
        }
        if (config.flexibleHeight) {
            var flexibleHeight = calculateFlexibleHeight();
        }
        containerHeight = (flexibleHeight) ? flexibleHeight : parentElement.clientHeight - (parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom));
        setElementHeightAndWidth(scrollWrapper, containerHeight, containerWidth);
        setElementHeightAndWidth(scrollContent, containerHeight, containerWidth);
        if (getScrollRatio(scrollContainer) !== 1) {
            scrollWrapper.classList.add('scroll-down');
        }
        else {
            scrollWrapper.classList.remove('scroll-down');
            scrollWrapper.classList.remove('scroll-up');
        }
        if (getScrollRatio(scrollContainer) !== 1 && attributes.scrolltobottom) {
            scrollToBottom(containerHeight);
        }
        if (config.scrollToTop) {
            scrollToTop(containerHeight, containerWidth);
        }
    }
    // if parent container is not set to 100vh we need to work out how much we need to expand or contract
    // to make use of available space 
    function calculateFlexibleHeight() {
        flexibleContainerHeight = flexibleContainer.clientHeight;
        var parentDistanceFromBottom = window.innerHeight - (getElemDistance(flexibleContainer) + flexibleContainerHeight);
        var scrollContainerDistanceFromBottom = window.innerHeight - (getElemDistance(scrollContainer) + containerHeight);
        var sizeOfBottomFixedBlock = scrollContainerDistanceFromBottom - parentDistanceFromBottom;
        var maxHeight = window.innerHeight - (getElemDistance(scrollContainer) + sizeOfBottomFixedBlock + 18);
        if (parentDistanceFromBottom < 0) {
            return (containerHeight + parentDistanceFromBottom) - 18;
        }
        else if (scrollContainer.scrollRatio !== 1 && parentDistanceFromBottom > 18) {
            return (maxHeight > scrollContainer.scrollHeight) ? scrollContainer.scrollHeight : maxHeight;
        }
        else {
            return undefined;
        }
    }
    // thanks to https://github.com/buzinas/simple-scrollbar/blob/master/simple-scrollbar.js for some of the
    // basic scroll and drag functionality below.
    // Mouse drag handler - allows user to grab and drag scrollbar to scroll
    function dragHandler(element, context) {
        var lastPageY;
        element.addEventListener('mousedown', function (e) {
            lastPageY = e.pageY;
            element.classList.add('scrollbar-grabbed');
            $document[0].body.classList.add('scrollbar-grabbed');
            $document[0].addEventListener('mousemove', drag);
            $document[0].addEventListener('mouseup', stop);
            return false;
        });
        function drag(e) {
            var delta = e.pageY - lastPageY;
            lastPageY = e.pageY;
            raf(function () {
                context.scrollTop += delta / context.scrollRatio;
            });
        }
        function stop() {
            element.classList.remove('scrollbar-grabbed');
            $document[0].body.classList.remove('scrollbar-grabbed');
            $document[0].removeEventListener('mousemove', drag);
            $document[0].removeEventListener('mouseup', stop);
        }
    }
    function moveScrollbar() {
        var totalHeight = scrollContainer.scrollHeight;
        var ownHeight = scrollContainer.clientHeight;
        scrollContainer.scrollRatio = ownHeight / totalHeight;
        raf(function () {
            // Hide scrollbar if no scrolling is possible
            if (scrollContainer.scrollRatio === 1) {
                scrollBar.classList.add('scrollbar-hidden');
            }
            else {
                if (scrollContainer.scrollTop > 0) {
                    scrollWrapper.classList.add('scroll-up');
                }
                else {
                    scrollWrapper.classList.remove('scroll-up');
                }
                scrollBar.classList.remove('scrollbar-hidden');
                var percentageScrolled = scrollContainer.scrollTop / (totalHeight - ownHeight);
                if (percentageScrolled === 1) {
                    scrollWrapper.classList.remove('scroll-down');
                }
                else {
                    scrollWrapper.classList.add('scroll-down');
                }
                var scrollBarHeight = ownHeight * scrollContainer.scrollRatio;
                var scrollRange = totalHeight - scrollBarHeight;
                var scrollBarPosition = scrollRange * percentageScrolled;
                scrollBar.style.cssText = 'height:' + scrollBarHeight + 'px;top:' + scrollBarPosition + 'px;';
            }
        });
    }
    function getElemDistance(elem) {
        var location = 0;
        if (elem.offsetParent) {
            do {
                location += elem.offsetTop;
                elem = elem.offsetParent;
            } while (elem);
        }
        return location >= 0 ? location : 0;
    }
    function isMacMozilla() {
        return window.navigator.platform.indexOf('Mac') > -1 && window.navigator.userAgent.indexOf('Mozilla') > -1;
    }
}
exports.customScroll = customScroll;
