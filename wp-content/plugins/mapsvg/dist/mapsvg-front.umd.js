(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('Handlebars'), require('Bloodhound'), require('CodeMirror')) :
    typeof define === 'function' && define.amd ? define(['exports', 'Handlebars', 'Bloodhound', 'CodeMirror'], factory) :
    (global = global || self, factory(global.mapsvg = {}, global.Handlebars, global.Bloodhound, global.CodeMirror));
}(this, (function (exports, Handlebars, Bloodhound, CodeMirror) { 'use strict';

    Handlebars = Handlebars && Handlebars.hasOwnProperty('default') ? Handlebars['default'] : Handlebars;
    Bloodhound = Bloodhound && Bloodhound.hasOwnProperty('default') ? Bloodhound['default'] : Bloodhound;

    /**
     * Global MapSVG class. It contains all other MapSVG classes and some static methods.
     * @constructor
     * @example
     * var mapsvg = MapSVG.get(0); // get first map instance
     * var mapsvg2 = MapSVG.get(1); // get second map instance
     * var mapsvg3 = MapSVG.getById(123); // get map by ID
     *
     * var mapsvg = new MapSVG.Map("my-container",{
     *   source: "/path/to/map.svg"
     * });
     *
     * var marker = new MapSVG.Marker({
     *   location: location,
     *   mapsvg: mapsvg
     * });
     *
     * if(MapSVG.isPhone){
     *  // do something special for mobile devices
     * }
     *
     *
     */
    var MapSVG = function() {

    };
    const $ = jQuery;

    MapSVG.formBuilder = {};
    MapSVG.mediaUploader = {};

    if(typeof wp !== 'undefined' && typeof wp.media !== 'undefined'){
        MapSVG.mediaUploader = wp.media({
            title: 'Choose images',
            button: {
                text: 'Choose images'
            },
            multiple: true
        });
    }


    /**
     * Keeps loaded HBS templates
     * @type {Array}
     * @private
     * @static
     * @property
     */
    MapSVG.templatesLoaded = {};

    /**
     * Keeps URLs
     * @type {Array}
     * @private
     * @static
     * @property
     */
    if(typeof mapsvg_paths !== "undefined"){
        MapSVG.urls = mapsvg_paths;
    } else {
        MapSVG.urls = {};
    }
    if(typeof ajaxurl !== "undefined"){
        MapSVG.urls.ajaxurl = ajaxurl;
    }

    /**
     * Keeps map instances
     * @type {Array}
     * @private
     * @static
     * @property
     */
    MapSVG.instances = [];

    MapSVG.userAgent = navigator.userAgent.toLowerCase();

    /**
     * Determines if current device is touch-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.touchDevice =
        (('ontouchstart' in window)
            || (navigator.MaxTouchPoints > 0)
            || (navigator.msMaxTouchPoints > 0));
        // (MapSVG.userAgent.indexOf("ipad") > -1) ||
        // (MapSVG.userAgent.indexOf("iphone") > -1) ||
        // (MapSVG.userAgent.indexOf("ipod") > -1) ||
        // (MapSVG.userAgent.indexOf("android") > -1);

    /**
     * Determines if current device is iOS-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.ios =
        (MapSVG.userAgent.indexOf("ipad") > -1) ||
        (MapSVG.userAgent.indexOf("iphone") > -1) ||
        (MapSVG.userAgent.indexOf("ipod") > -1);

    /**
     * Determines if current device is Android-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.android = MapSVG.userAgent.indexOf("android");

    /**
     * Determines if current device is mobile-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.isPhone = window.matchMedia("only screen and (max-width: 812px)").matches;

    /**
     * Keeps browser information
     * @type {object}
     * @static
     * @property
     */
    MapSVG.browser = {};
    MapSVG.browser.ie = MapSVG.userAgent.indexOf("msie") > -1 || MapSVG.userAgent.indexOf("trident") > -1 || MapSVG.userAgent.indexOf("edge") > -1 ? {} : false;
    MapSVG.browser.firefox = MapSVG.userAgent.indexOf("firefox") > -1;

    if (!String.prototype.trim) {
        String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
    }

    /**
     * Converts mouse event object to x/y coordinates
     * @param e
     * @returns {{x: *, y: *}}
     */
    MapSVG.mouseCoords = function(e){
        if(e.clientX){
            return {'x':e.clientX + $(document).scrollLeft(), 'y':e.clientY + $(document).scrollTop()};
        }if(e.pageX){
            return {'x':e.pageX, 'y':e.pageY};
        }else if(MapSVG.touchDevice){
            e = e.originalEvent || e;
            return e.touches && e.touches[0] ?
                {'x':e.touches[0].pageX, 'y':e.touches[0].pageY} :
                {'x':e.changedTouches[0].pageX, 'y':e.changedTouches[0].pageY};
        }
    };

    /**
     * Adds new instance of the map
     * @param {MapSVG.Map} mapsvg
     */
    MapSVG.addInstance = function(mapsvg){
        MapSVG.instances.push(mapsvg);
    };

    MapSVG.get = function(index){
        return MapSVG.instances[index];
    };

    MapSVG.getById = function(id){
        var instance = MapSVG.instances.filter(function(i){ return i.id == id });
        if(instance.length > 0){
            return instance[0];
        }
    };

    MapSVG.getByContainerId = function(id){
        var instance = MapSVG.instances.filter(function(i){ return i.$map.attr('id') == id });
        if(instance.length > 0){
            return instance[0];
        }
    };

    MapSVG.extend = function(sub, base) {
        sub.prototype = Object.create(base.prototype);
        sub.prototype.constructor = sub;
    };

    MapSVG.ucfirst = function(string){
        return string.charAt(0).toUpperCase()+string.slice(1);
    };
    MapSVG.parseBoolean = function (string) {
        switch (String(string).toLowerCase()) {
            case "on":
            case "true":
            case "1":
            case "yes":
            case "y":
                return true;
            case "off":
            case "false":
            case "0":
            case "no":
            case "n":
                return false;
            default:
                return undefined;
        }
    };
    MapSVG.isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    MapSVG.safeURL = function(url){
        if(url.indexOf('http://') == 0 || url.indexOf('https://') == 0)
            url = "//"+url.split("://").pop();
        return url.replace(/^.*\/\/[^\/]+/, '');
    };

    MapSVG.convertToText = function(obj) {
        //create an array that will later be joined into a string.
        var string = [];

        //is object
        //    Both arrays and objects seem to return "object"
        //    when typeof(obj) is applied to them. So instead
        //    I am checking to see if they have the property
        //    join, which normal objects don't have but
        //    arrays do.
        if (obj === null) {
            return null;
        } if (obj === undefined) {
            return '""';
        } else if (typeof(obj) == "object" && (obj.join == undefined)) {
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)){
                    var key = '"'+prop.replace(/\"/g,'\\"')+'"'; //prop.search(/[^a-zA-Z]+/) === -1 ?  prop : ...
                    string.push( key + ': ' + MapSVG.convertToText(obj[prop]));
                }
            }
            return "{" + string.join(",") + "}";

            //is array
        } else if (typeof(obj) == "object" && !(obj.join == undefined)) {
            var prop;
            for(prop in obj) {
                string.push(MapSVG.convertToText(obj[prop]));
            }
            return "[" + string.join(",") + "]";

            //is function
        } else if (typeof(obj) == "function") {
            return obj.toString().replace('function anonymous','function');
            // string.push(obj.toString().replace('function anonymous','function'));

            //all other values can be done with JSON.stringify
        } else {
            return JSON.stringify(obj);
            // var s = JSON.stringify(obj);
            // string.push(s);
        }
    };

    // Create Element.remove() function if not exists
    if (!('remove' in Element.prototype)) {
        Element.prototype.remove = function() {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        };
    }

    Math.hypot = Math.hypot || function() {
        var y = 0;
        var length = arguments.length;

        for (var i = 0; i < length; i++) {
            if (arguments[i] === Infinity || arguments[i] === -Infinity) {
                return Infinity;
            }
            y += arguments[i] * arguments[i];
        }
        return Math.sqrt(y);
    };
    SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
        return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
    };

    Map.prototype.toArray = function(){
        return Array.from(this, ([name, value]) => value );
    };



    MapSVG.ResizeSensor = class ResizeSensor {
        constructor(element, callback) {
            var _this = this;
            _this.element = element;
            _this.callback = callback;
            var style = getComputedStyle(element);
            var zIndex = parseInt(style.zIndex);
            if (isNaN(zIndex)) {
                zIndex = 0;
            }
            zIndex--;
            _this.expand = document.createElement('div');
            _this.expand.style.position = "absolute";
            _this.expand.style.left = "0px";
            _this.expand.style.top = "0px";
            _this.expand.style.right = "0px";
            _this.expand.style.bottom = "0px";
            _this.expand.style.overflow = "hidden";
            _this.expand.style.zIndex = zIndex.toString();
            _this.expand.style.visibility = "hidden";
            var expandChild = document.createElement('div');
            expandChild.style.position = "absolute";
            expandChild.style.left = "0px";
            expandChild.style.top = "0px";
            expandChild.style.width = "10000000px";
            expandChild.style.height = "10000000px";
            _this.expand.appendChild(expandChild);
            _this.shrink = document.createElement('div');
            _this.shrink.style.position = "absolute";
            _this.shrink.style.left = "0px";
            _this.shrink.style.top = "0px";
            _this.shrink.style.right = "0px";
            _this.shrink.style.bottom = "0px";
            _this.shrink.style.overflow = "hidden";
            _this.shrink.style.zIndex = zIndex.toString();
            _this.shrink.style.visibility = "hidden";
            var shrinkChild = document.createElement('div');
            shrinkChild.style.position = "absolute";
            shrinkChild.style.left = "0px";
            shrinkChild.style.top = "0px";
            shrinkChild.style.width = "200%";
            shrinkChild.style.height = "200%";
            _this.shrink.appendChild(shrinkChild);
            _this.element.appendChild(_this.expand);
            _this.element.appendChild(_this.shrink);
            var size = element.getBoundingClientRect();
            _this.currentWidth = size.width;
            _this.currentHeight = size.height;
            _this.setScroll();
            _this.expand.addEventListener('scroll', function () {
                _this.onScroll();
            });
            _this.shrink.addEventListener('scroll', function () {
                _this.onScroll();
            });
        }
        ;
        onScroll() {
            var _this = this;
            var size = _this.element.getBoundingClientRect();
            var newWidth = size.width;
            var newHeight = size.height;
            if (newWidth != _this.currentWidth || newHeight != _this.currentHeight) {
                _this.currentWidth = newWidth;
                _this.currentHeight = newHeight;
                _this.callback();
            }
            this.setScroll();
        }
        ;
        setScroll() {
            this.expand.scrollLeft = 10000000;
            this.expand.scrollTop = 10000000;
            this.shrink.scrollLeft = 10000000;
            this.shrink.scrollTop = 10000000;
        }
        ;
        destroy() {
            this.expand.remove();
            this.shrink.remove();
        }
        ;
    };

    window.MapSVG = MapSVG;

    let defRegionTemplate = '<!-- Region fields are available in this template -->\n' +
        '<h5>{{#if title}} {{title}} {{else}} {{id}} {{/if}}</h5>\n' +
        '<p>Status: {{status_text}}</p>\n\n' +
        '<!-- Show all linked Database Objects: -->\n' +
        '{{#each objects}}\n\n' +
        '  <!-- DB Object are available inside of this block -->\n\n' +
        '  <h5>{{title}}</h5>\n' +
        '  <!-- When you need to render a field as HTML, use 3 curly braces instead of 2:-->\n' +
        '  <p>{{{description}}}</p>\n' +
        '  <p><em>{{location.address.formatted}}</em></p>\n\n' +
        '  <!-- Show all images: -->\n' +
        '  {{#each images}}\n' +
        '    <!-- Image fields "thumbnail", "medium", "full" -->\n' +
        '    <!-- are available in this block                -->\n' +
        '    <img src="{{thumbnail}}" />\n' +
        '  {{/each}}\n\n' +
        '{{/each}}';
    let defDBTemplate = '<!-- DB Object fields are available in this template. -->\n' +
        '<h5>{{title}}</h5>\n' +
        '<!-- When you need to render a fields as HTML, use 3 curly braces instead of 2:-->\n' +
        '<p>{{{description}}}</p>\n' +
        '<p><em>{{location.address.formatted}}</em></p>\n\n' +
        '<!-- Show all images: -->\n' +
        '{{#each images}}\n' +
        '  <!-- Image fields "thumbnail", "medium", "full" -->\n' +
        '  <!-- are available in this block                -->\n' +
        '  <img src="{{thumbnail}}" />\n' +
        '{{/each}}\n\n' +
        '<!-- Show all linked Regions, comma-separated: -->\n' +
        '<p> Regions: \n' +
        '  {{#each regions}}\n' +
        '    <!-- Region fields are available in this block -->\n' +
        '    {{#if title}}\n' +
        '      {{title}}\n' +
        '    {{else}}\n' +
        '      {{id}}\n' +
        '    {{/if}}{{#unless @last}}, {{/unless}}\n' +
        '  {{/each}}\n' +
        '</p>';
    let dirItemItemTemplate = '<!-- If Directory Source = Database: DB Object fields are available in this template -->\n' +
        '<!-- If Directory Source = Regions: Region fields are available in this template -->\n' +
        '{{title}}';
    let DefaultOptions = {
        source: '',
        markerLastID: 0,
        regionLastID: 0,
        dataLastID: 1,
        disableAll: false,
        width: null,
        height: null,
        lockAspectRatio: false,
        padding: { top: 0, left: 0, right: 0, bottom: 0 },
        maxWidth: null,
        maxHeight: null,
        minWidth: null,
        minHeight: null,
        loadingText: 'Loading map...',
        colorsIgnore: false,
        colors: { baseDefault: "#000000",
            background: "#eeeeee",
            selected: 40,
            hover: 20,
            directory: '#fafafa',
            detailsView: '',
            status: {},
            clusters: "",
            clustersBorders: "",
            clustersText: "",
            clustersHover: "",
            clustersHoverBorders: "",
            clustersHoverText: "",
            markers: {
                base: { opacity: 100, saturation: 100 },
                hovered: { opacity: 100, saturation: 100 },
                unhovered: { opacity: 40, saturation: 100 },
                active: { opacity: 100, saturation: 100 },
                inactive: { opacity: 40, saturation: 100 },
            }
        },
        regions: {},
        clustering: { on: false },
        viewBox: [],
        cursor: 'default',
        manualRegions: false,
        onClick: null,
        mouseOver: null,
        mouseOut: null,
        menuOnClick: null,
        beforeLoad: null,
        afterLoad: null,
        zoom: { on: true, limit: [0, 10], delta: 2, buttons: { on: true, location: 'right' }, mousewheel: true, fingers: true },
        scroll: { on: true, limit: false, background: false, spacebar: false },
        responsive: true,
        tooltips: { on: false, position: 'bottom-right', template: '', maxWidth: '', minWidth: 100 },
        popovers: { on: false, position: 'top', template: '', centerOn: true, width: 300, maxWidth: 50, maxHeight: 50 },
        multiSelect: false,
        regionStatuses: {
            '1': { "label": "Enabled", "value": '1', "color": "", "disabled": false },
            '0': { "label": "Disabled", "value": '0', "color": "", "disabled": true }
        },
        events: {
            'afterLoad': 'function(){\n' +
                '  // var mapsvg = this;\n' +
                '  // var regions = mapsvg.regions;\n' +
                '  // var dbObjects = mapsvg.database.getLoaded();\n' +
                '}',
            'beforeLoad': 'function(){\n' +
                '  // var mapsvg = this;\n' +
                '  // var settings = mapsvg.options;\n' +
                '  // console.log(settings);\n' +
                '}',
            'databaseLoaded': 'function (){\n' +
                '  // var mapsvg = this;\n' +
                '  // var dbObjects = mapsvg.database.getLoaded();\n' +
                '}',
            'click.region': 'function (e, mapsvg){\n' +
                '  // var region = this;\n' +
                '  // console.log(region);\n' +
                '}',
            'mouseover.region': 'function (e, mapsvg){\n' +
                '  // var region = this;\n' +
                '  // console.log(region);\n' +
                '}',
            'mouseout.region': 'function (e, mapsvg){\n' +
                '  // var region = this;\n' +
                '  // console.log(region);\n' +
                '}',
            'click.marker': 'function (e, mapsvg){\n' +
                '  // var marker = this;\n' +
                '  // console.log(marker);\n' +
                '}',
            'mouseover.marker': 'function (e, mapsvg){\n' +
                '  // var marker = this;\n' +
                '  // console.log(marker);\n' +
                '}',
            'mouseout.marker': 'function (e, mapsvg){\n' +
                '  // var marker = this;\n' +
                '  // console.log(marker);\n' +
                '}',
            'click.directoryItem': 'function (e, regionOrObject, mapsvg){\n' +
                '  // var itemjQueryObject = this;\n' +
                '}',
            'mouseover.directoryItem': 'function (e, regionOrObject, mapsvg){\n' +
                '  // var itemjQueryObject = this;\n' +
                '}',
            'mouseout.directoryItem': 'function (e, regionOrObject, mapsvg){\n' +
                '  // var itemjQueryObject = this;\n' +
                '}',
            'shown.popover': 'function (mapsvg){\n' +
                '  // var popoverjQueryObject = this;\n' +
                '}',
            'closed.popover': 'function (mapsvg){\n' +
                '  // var popoverjQueryObject = this;\n' +
                '}',
            'closed.detailsView': 'function (mapsvg){\n' +
                '  // var detailsjQueryObject = this;\n' +
                '}',
            'shown.detailsView': 'function (mapsvg){\n' +
                '  // var detailsjQueryObject = this;\n' +
                '}'
        },
        css: "#mapsvg-map-%id% .mapsvg-tooltip {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-popover {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-details-container {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-directory-item {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-region-label {\n" +
            "  /* background-color: rgba(255,255,255,.6); */\n" +
            "  font-size: 11px;\n" +
            "  padding: 3px 5px;\n" +
            "  border-radius: 4px;\n" +
            "}\n" +
            "#mapsvg-map-%id% .mapsvg-marker-label {\n" +
            "  padding: 3px 5px;\n" +
            "  /*\n" +
            "  border-radius: 4px;\n" +
            "  background-color: white;\n" +
            "  margin-top: -4px;\n" +
            "  */\n}\n" +
            "#mapsvg-map-%id% .mapsvg-filters-wrap {\n\n}\n" +
            "\n\n\n\n\n\n",
        templates: {
            popoverRegion: defRegionTemplate,
            popoverMarker: defDBTemplate,
            tooltipRegion: '<!-- Region fields are available in this template -->\n{{id}} - {{title}}',
            tooltipMarker: '<!-- DB Object fields are available in this template -->\n{{title}}',
            directoryItem: dirItemItemTemplate,
            directoryCategoryItem: '<!-- Available fields: "label", "value", "counter" -->\n<span class="mapsvg-category-label">{{label}}</span>\n<span class="mapsvg-category-counter">{{counter}}</span>\n<span class="mapsvg-chevron"></span>',
            detailsView: defDBTemplate,
            detailsViewRegion: defRegionTemplate,
            labelMarker: '<!-- DB Object fields are available in this template -->\n{{title}}',
            labelRegion: '<!-- Region fields are available in this template -->\n{{title}}',
            labelLocation: 'You are here!',
        },
        gauge: { on: false, labels: { low: "low", high: "high" }, colors: { lowRGB: null, highRGB: null, low: "#550000", high: "#ee0000" }, min: 0, max: 0 },
        filters: {
            on: false,
            source: 'database',
            location: 'leftSidebar',
            modalLocation: 'map',
            width: '100%',
            hide: false,
            buttonText: 'Filters',
            clearButtonText: 'Clear all',
            clearButton: false,
            padding: ''
        },
        menu: {
            on: false,
            hideOnMobile: true,
            location: 'leftSidebar',
            locationMobile: 'leftSidebar',
            search: false,
            containerId: '',
            searchPlaceholder: "Search...",
            searchFallback: false,
            source: 'database',
            showFirst: 'map',
            showMapOnClick: true,
            minHeight: '400',
            sortBy: 'id',
            sortDirection: 'desc',
            categories: {
                on: false,
                groupBy: '',
                hideEmpty: true,
                collapse: true,
                collapseOther: true
            },
            clickActions: {
                region: 'default',
                marker: 'default',
                directoryItem: {
                    triggerClick: true,
                    showPopover: false,
                    showDetails: true
                }
            },
            detailsViewLocation: 'overDirectory',
            noResultsText: 'No results found',
            filterout: { field: '', cond: '=', val: '' }
        },
        database: {
            pagination: {
                on: true,
                perpage: 30,
                next: "Next",
                prev: "Prev.",
                showIn: 'directory'
            },
            loadOnStart: true,
            table: ''
        },
        actions: {
            map: {
                afterLoad: {
                    selectRegion: false
                }
            },
            region: {
                click: {
                    addIdToUrl: false,
                    showDetails: true,
                    showDetailsFor: 'region',
                    filterDirectory: false,
                    loadObjects: false,
                    showPopover: false,
                    showPopoverFor: 'region',
                    goToLink: false,
                    linkField: 'Region.link'
                },
                touch: {
                    showPopover: false
                }
            },
            marker: {
                click: {
                    showDetails: true,
                    showPopover: false,
                    goToLink: false,
                    linkField: 'Object.link'
                },
                touch: {
                    showPopover: false
                }
            },
            directoryItem: {
                click: {
                    showDetails: true,
                    showPopover: false,
                    goToLink: false,
                    selectRegion: true,
                    fireRegionOnClick: true,
                    linkField: 'Object.link'
                },
                hover: {
                    centerOnMarker: false
                }
            }
        },
        detailsView: {
            location: 'map',
            containerId: '',
            width: '100%',
            mobileFullscreen: true
        },
        mobileView: {
            labelMap: 'Map',
            labelList: 'List',
            labelClose: 'Close'
        },
        googleMaps: {
            on: false,
            apiKey: '',
            loaded: false,
            center: 'auto',
            type: 'roadmap',
            minZoom: 1,
            style: 'default',
            styleJSON: []
        },
        groups: [],
        floors: [],
        layersControl: {
            on: false,
            position: 'top-left',
            label: 'Show on map',
            expanded: true,
            maxHeight: '100%'
        },
        floorsControl: {
            on: false,
            position: 'top-left',
            label: 'Floors',
            expanded: false,
            maxHeight: '100%'
        },
        containers: {
            leftSidebar: { on: false, width: '250px' },
            rightSidebar: { on: false, width: '250px' },
            header: { on: false, height: 'auto' },
            footer: { on: false, height: 'auto' },
        },
        labelsMarkers: { on: false },
        labelsRegions: { on: false },
        svgFileVersion: 1,
        fitMarkers: false,
        fitMarkersOnStart: false,
        controls: {
            location: 'right',
            zoom: true,
            zoomReset: false,
            userLocation: false
        }
    };

    // TinyColor v1.4.1
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License

    //(function(Math) {

        var trimLeft = /^\s+/,
            trimRight = /\s+$/,
            tinyCounter = 0,
            mathRound = Math.round,
            mathMin = Math.min,
            mathMax = Math.max,
            mathRandom = Math.random;

        function tinycolor (color, opts) {

            color = (color) ? color : '';
            opts = opts || { };

            // If input is already a tinycolor, return itself
            if (color instanceof tinycolor) {
                return color;
            }
            // If we are called as a function, call using new instead
            if (!(this instanceof tinycolor)) {
                return new tinycolor(color, opts);
            }

            var rgb = inputToRGB(color);
            this._originalInput = color,
                this._r = rgb.r,
                this._g = rgb.g,
                this._b = rgb.b,
                this._a = rgb.a,
                this._roundA = mathRound(100*this._a) / 100,
                this._format = opts.format || rgb.format;
            this._gradientType = opts.gradientType;

            // Don't let the range of [0,255] come back in [0,1].
            // Potentially lose a little bit of precision here, but will fix issues where
            // .5 gets interpreted as half of the total, instead of half of 1
            // If it was supposed to be 128, this was already taken care of by `inputToRgb`
            if (this._r < 1) { this._r = mathRound(this._r); }
            if (this._g < 1) { this._g = mathRound(this._g); }
            if (this._b < 1) { this._b = mathRound(this._b); }

            this._ok = rgb.ok;
            this._tc_id = tinyCounter++;
        }

        tinycolor.prototype = {
            isDark: function() {
                return this.getBrightness() < 128;
            },
            isLight: function() {
                return !this.isDark();
            },
            isValid: function() {
                return this._ok;
            },
            getOriginalInput: function() {
                return this._originalInput;
            },
            getFormat: function() {
                return this._format;
            },
            getAlpha: function() {
                return this._a;
            },
            getBrightness: function() {
                //http://www.w3.org/TR/AERT#color-contrast
                var rgb = this.toRgb();
                return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            },
            getLuminance: function() {
                //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
                var rgb = this.toRgb();
                var RsRGB, GsRGB, BsRGB, R, G, B;
                RsRGB = rgb.r/255;
                GsRGB = rgb.g/255;
                BsRGB = rgb.b/255;

                if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
                if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
                if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
                return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
            },
            setAlpha: function(value) {
                this._a = boundAlpha(value);
                this._roundA = mathRound(100*this._a) / 100;
                return this;
            },
            toHsv: function() {
                var hsv = rgbToHsv(this._r, this._g, this._b);
                return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
            },
            toHsvString: function() {
                var hsv = rgbToHsv(this._r, this._g, this._b);
                var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
                return (this._a == 1) ?
                    "hsv("  + h + ", " + s + "%, " + v + "%)" :
                    "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
            },
            toHsl: function() {
                var hsl = rgbToHsl(this._r, this._g, this._b);
                return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
            },
            toHslString: function() {
                var hsl = rgbToHsl(this._r, this._g, this._b);
                var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
                return (this._a == 1) ?
                    "hsl("  + h + ", " + s + "%, " + l + "%)" :
                    "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
            },
            toHex: function(allow3Char) {
                return rgbToHex(this._r, this._g, this._b, allow3Char);
            },
            toHexString: function(allow3Char) {
                return '#' + this.toHex(allow3Char);
            },
            toHex8: function(allow4Char) {
                return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
            },
            toHex8String: function(allow4Char) {
                return '#' + this.toHex8(allow4Char);
            },
            toRgb: function() {
                return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
            },
            toRgbString: function() {
                return (this._a == 1) ?
                    "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
                    "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
            },
            toPercentageRgb: function() {
                return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
            },
            toPercentageRgbString: function() {
                return (this._a == 1) ?
                    "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
                    "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
            },
            toName: function() {
                if (this._a === 0) {
                    return "transparent";
                }

                if (this._a < 1) {
                    return false;
                }

                return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
            },
            toFilter: function(secondColor) {
                var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
                var secondHex8String = hex8String;
                var gradientType = this._gradientType ? "GradientType = 1, " : "";

                if (secondColor) {
                    var s = tinycolor(secondColor);
                    secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
                }

                return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
            },
            toString: function(format) {
                var formatSet = !!format;
                format = format || this._format;

                var formattedString = false;
                var hasAlpha = this._a < 1 && this._a >= 0;
                var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

                if (needsAlphaFormat) {
                    // Special case for "transparent", all other non-alpha formats
                    // will return rgba when there is transparency.
                    if (format === "name" && this._a === 0) {
                        return this.toName();
                    }
                    return this.toRgbString();
                }
                if (format === "rgb") {
                    formattedString = this.toRgbString();
                }
                if (format === "prgb") {
                    formattedString = this.toPercentageRgbString();
                }
                if (format === "hex" || format === "hex6") {
                    formattedString = this.toHexString();
                }
                if (format === "hex3") {
                    formattedString = this.toHexString(true);
                }
                if (format === "hex4") {
                    formattedString = this.toHex8String(true);
                }
                if (format === "hex8") {
                    formattedString = this.toHex8String();
                }
                if (format === "name") {
                    formattedString = this.toName();
                }
                if (format === "hsl") {
                    formattedString = this.toHslString();
                }
                if (format === "hsv") {
                    formattedString = this.toHsvString();
                }

                return formattedString || this.toHexString();
            },
            clone: function() {
                return tinycolor(this.toString());
            },

            _applyModification: function(fn, args) {
                var color = fn.apply(null, [this].concat([].slice.call(args)));
                this._r = color._r;
                this._g = color._g;
                this._b = color._b;
                this.setAlpha(color._a);
                return this;
            },
            lighten: function() {
                return this._applyModification(lighten, arguments);
            },
            brighten: function() {
                return this._applyModification(brighten, arguments);
            },
            darken: function() {
                return this._applyModification(darken, arguments);
            },
            desaturate: function() {
                return this._applyModification(desaturate, arguments);
            },
            saturate: function() {
                return this._applyModification(saturate, arguments);
            },
            greyscale: function() {
                return this._applyModification(greyscale, arguments);
            },
            spin: function() {
                return this._applyModification(spin, arguments);
            },

            _applyCombination: function(fn, args) {
                return fn.apply(null, [this].concat([].slice.call(args)));
            },
            analogous: function() {
                return this._applyCombination(analogous, arguments);
            },
            complement: function() {
                return this._applyCombination(complement, arguments);
            },
            monochromatic: function() {
                return this._applyCombination(monochromatic, arguments);
            },
            splitcomplement: function() {
                return this._applyCombination(splitcomplement, arguments);
            },
            triad: function() {
                return this._applyCombination(triad, arguments);
            },
            tetrad: function() {
                return this._applyCombination(tetrad, arguments);
            }
        };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
        tinycolor.fromRatio = function(color, opts) {
            if (typeof color == "object") {
                var newColor = {};
                for (var i in color) {
                    if (color.hasOwnProperty(i)) {
                        if (i === "a") {
                            newColor[i] = color[i];
                        }
                        else {
                            newColor[i] = convertToPercentage(color[i]);
                        }
                    }
                }
                color = newColor;
            }

            return tinycolor(color, opts);
        };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
        function inputToRGB(color) {

            var rgb = { r: 0, g: 0, b: 0 };
            var a = 1;
            var s = null;
            var v = null;
            var l = null;
            var ok = false;
            var format = false;

            if (typeof color == "string") {
                color = stringInputToObject(color);
            }

            if (typeof color == "object") {
                if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
                    rgb = rgbToRgb(color.r, color.g, color.b);
                    ok = true;
                    format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
                }
                else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
                    s = convertToPercentage(color.s);
                    v = convertToPercentage(color.v);
                    rgb = hsvToRgb(color.h, s, v);
                    ok = true;
                    format = "hsv";
                }
                else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
                    s = convertToPercentage(color.s);
                    l = convertToPercentage(color.l);
                    rgb = hslToRgb(color.h, s, l);
                    ok = true;
                    format = "hsl";
                }

                if (color.hasOwnProperty("a")) {
                    a = color.a;
                }
            }

            a = boundAlpha(a);

            return {
                ok: ok,
                format: color.format || format,
                r: mathMin(255, mathMax(rgb.r, 0)),
                g: mathMin(255, mathMax(rgb.g, 0)),
                b: mathMin(255, mathMax(rgb.b, 0)),
                a: a
            };
        }


    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
        function rgbToRgb(r, g, b){
            return {
                r: bound01(r, 255) * 255,
                g: bound01(g, 255) * 255,
                b: bound01(b, 255) * 255
            };
        }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
        function rgbToHsl(r, g, b) {

            r = bound01(r, 255);
            g = bound01(g, 255);
            b = bound01(b, 255);

            var max = mathMax(r, g, b), min = mathMin(r, g, b);
            var h, s, l = (max + min) / 2;

            if(max == min) {
                h = s = 0; // achromatic
            }
            else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch(max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }

                h /= 6;
            }

            return { h: h, s: s, l: l };
        }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
        function hslToRgb(h, s, l) {
            var r, g, b;

            h = bound01(h, 360);
            s = bound01(s, 100);
            l = bound01(l, 100);

            function hue2rgb(p, q, t) {
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            if(s === 0) {
                r = g = b = l; // achromatic
            }
            else {
                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return { r: r * 255, g: g * 255, b: b * 255 };
        }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
        function rgbToHsv(r, g, b) {

            r = bound01(r, 255);
            g = bound01(g, 255);
            b = bound01(b, 255);

            var max = mathMax(r, g, b), min = mathMin(r, g, b);
            var h, s, v = max;

            var d = max - min;
            s = max === 0 ? 0 : d / max;

            if(max == min) {
                h = 0; // achromatic
            }
            else {
                switch(max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return { h: h, s: s, v: v };
        }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
        function hsvToRgb(h, s, v) {

            h = bound01(h, 360) * 6;
            s = bound01(s, 100);
            v = bound01(v, 100);

            var i = Math.floor(h),
                f = h - i,
                p = v * (1 - s),
                q = v * (1 - f * s),
                t = v * (1 - (1 - f) * s),
                mod = i % 6,
                r = [v, q, p, p, t, v][mod],
                g = [t, v, v, q, p, p][mod],
                b = [p, p, t, v, v, q][mod];

            return { r: r * 255, g: g * 255, b: b * 255 };
        }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
        function rgbToHex(r, g, b, allow3Char) {

            var hex = [
                pad2(mathRound(r).toString(16)),
                pad2(mathRound(g).toString(16)),
                pad2(mathRound(b).toString(16))
            ];

            // Return a 3 character hex if possible
            if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
                return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
            }

            return hex.join("");
        }

    // `rgbaToHex`
    // Converts an RGBA color plus alpha transparency to hex
    // Assumes r, g, b are contained in the set [0, 255] and
    // a in [0, 1]. Returns a 4 or 8 character rgba hex
        function rgbaToHex(r, g, b, a, allow4Char) {

            var hex = [
                pad2(mathRound(r).toString(16)),
                pad2(mathRound(g).toString(16)),
                pad2(mathRound(b).toString(16)),
                pad2(convertDecimalToHex(a))
            ];

            // Return a 4 character hex if possible
            if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
                return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
            }

            return hex.join("");
        }

    // `rgbaToArgbHex`
    // Converts an RGBA color to an ARGB Hex8 string
    // Rarely used, but required for "toFilter()"
        function rgbaToArgbHex(r, g, b, a) {

            var hex = [
                pad2(convertDecimalToHex(a)),
                pad2(mathRound(r).toString(16)),
                pad2(mathRound(g).toString(16)),
                pad2(mathRound(b).toString(16))
            ];

            return hex.join("");
        }

    // `equals`
    // Can be called with any tinycolor input
        tinycolor.equals = function (color1, color2) {
            if (!color1 || !color2) { return false; }
            return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
        };

        tinycolor.random = function() {
            return tinycolor.fromRatio({
                r: mathRandom(),
                g: mathRandom(),
                b: mathRandom()
            });
        };


    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

        function desaturate(color, amount) {
            amount = (amount === 0) ? 0 : (amount || 10);
            var hsl = tinycolor(color).toHsl();
            hsl.s -= amount / 100;
            hsl.s = clamp01(hsl.s);
            return tinycolor(hsl);
        }

        function saturate(color, amount) {
            amount = (amount === 0) ? 0 : (amount || 10);
            var hsl = tinycolor(color).toHsl();
            hsl.s += amount / 100;
            hsl.s = clamp01(hsl.s);
            return tinycolor(hsl);
        }

        function greyscale(color) {
            return tinycolor(color).desaturate(100);
        }

        function lighten (color, amount) {
            amount = (amount === 0) ? 0 : (amount || 10);
            var hsl = tinycolor(color).toHsl();
            hsl.l += amount / 100;
            hsl.l = clamp01(hsl.l);
            return tinycolor(hsl);
        }

        function brighten(color, amount) {
            amount = (amount === 0) ? 0 : (amount || 10);
            var rgb = tinycolor(color).toRgb();
            rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
            rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
            rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
            return tinycolor(rgb);
        }

        function darken (color, amount) {
            amount = (amount === 0) ? 0 : (amount || 10);
            var hsl = tinycolor(color).toHsl();
            hsl.l -= amount / 100;
            hsl.l = clamp01(hsl.l);
            return tinycolor(hsl);
        }

    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    // Values outside of this range will be wrapped into this range.
        function spin(color, amount) {
            var hsl = tinycolor(color).toHsl();
            var hue = (hsl.h + amount) % 360;
            hsl.h = hue < 0 ? 360 + hue : hue;
            return tinycolor(hsl);
        }

    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

        function complement(color) {
            var hsl = tinycolor(color).toHsl();
            hsl.h = (hsl.h + 180) % 360;
            return tinycolor(hsl);
        }

        function triad(color) {
            var hsl = tinycolor(color).toHsl();
            var h = hsl.h;
            return [
                tinycolor(color),
                tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
                tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
            ];
        }

        function tetrad(color) {
            var hsl = tinycolor(color).toHsl();
            var h = hsl.h;
            return [
                tinycolor(color),
                tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
                tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
                tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
            ];
        }

        function splitcomplement(color) {
            var hsl = tinycolor(color).toHsl();
            var h = hsl.h;
            return [
                tinycolor(color),
                tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
                tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
            ];
        }

        function analogous(color, results, slices) {
            results = results || 6;
            slices = slices || 30;

            var hsl = tinycolor(color).toHsl();
            var part = 360 / slices;
            var ret = [tinycolor(color)];

            for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
                hsl.h = (hsl.h + part) % 360;
                ret.push(tinycolor(hsl));
            }
            return ret;
        }

        function monochromatic(color, results) {
            results = results || 6;
            var hsv = tinycolor(color).toHsv();
            var h = hsv.h, s = hsv.s, v = hsv.v;
            var ret = [];
            var modification = 1 / results;

            while (results--) {
                ret.push(tinycolor({ h: h, s: s, v: v}));
                v = (v + modification) % 1;
            }

            return ret;
        }

    // Utility Functions
    // ---------------------

        tinycolor.mix = function(color1, color2, amount) {
            amount = (amount === 0) ? 0 : (amount || 50);

            var rgb1 = tinycolor(color1).toRgb();
            var rgb2 = tinycolor(color2).toRgb();

            var p = amount / 100;

            var rgba = {
                r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
                g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
                b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
                a: ((rgb2.a - rgb1.a) * p) + rgb1.a
            };

            return tinycolor(rgba);
        };


    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

    // `contrast`
    // Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
        tinycolor.readability = function(color1, color2) {
            var c1 = tinycolor(color1);
            var c2 = tinycolor(color2);
            return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
        };

    // `isReadable`
    // Ensure that foreground and background color combinations meet WCAG2 guidelines.
    // The third argument is an optional Object.
    //      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
    //      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
    // If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

    // *Example*
    //    tinycolor.isReadable("#000", "#111") => false
    //    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
        tinycolor.isReadable = function(color1, color2, wcag2) {
            var readability = tinycolor.readability(color1, color2);
            var wcag2Parms, out;

            out = false;

            wcag2Parms = validateWCAG2Parms(wcag2);
            switch (wcag2Parms.level + wcag2Parms.size) {
                case "AAsmall":
                case "AAAlarge":
                    out = readability >= 4.5;
                    break;
                case "AAlarge":
                    out = readability >= 3;
                    break;
                case "AAAsmall":
                    out = readability >= 7;
                    break;
            }
            return out;

        };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // Optionally returns Black or White if the most readable color is unreadable.
    // *Example*
    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
        tinycolor.mostReadable = function(baseColor, colorList, args) {
            var bestColor = null;
            var bestScore = 0;
            var readability;
            var includeFallbackColors, level, size ;
            args = args || {};
            includeFallbackColors = args.includeFallbackColors ;
            level = args.level;
            size = args.size;

            for (var i= 0; i < colorList.length ; i++) {
                readability = tinycolor.readability(baseColor, colorList[i]);
                if (readability > bestScore) {
                    bestScore = readability;
                    bestColor = tinycolor(colorList[i]);
                }
            }

            if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
                return bestColor;
            }
            else {
                args.includeFallbackColors=false;
                return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
            }
        };


    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
        var names = tinycolor.names = {
            aliceblue: "f0f8ff",
            antiquewhite: "faebd7",
            aqua: "0ff",
            aquamarine: "7fffd4",
            azure: "f0ffff",
            beige: "f5f5dc",
            bisque: "ffe4c4",
            black: "000",
            blanchedalmond: "ffebcd",
            blue: "00f",
            blueviolet: "8a2be2",
            brown: "a52a2a",
            burlywood: "deb887",
            burntsienna: "ea7e5d",
            cadetblue: "5f9ea0",
            chartreuse: "7fff00",
            chocolate: "d2691e",
            coral: "ff7f50",
            cornflowerblue: "6495ed",
            cornsilk: "fff8dc",
            crimson: "dc143c",
            cyan: "0ff",
            darkblue: "00008b",
            darkcyan: "008b8b",
            darkgoldenrod: "b8860b",
            darkgray: "a9a9a9",
            darkgreen: "006400",
            darkgrey: "a9a9a9",
            darkkhaki: "bdb76b",
            darkmagenta: "8b008b",
            darkolivegreen: "556b2f",
            darkorange: "ff8c00",
            darkorchid: "9932cc",
            darkred: "8b0000",
            darksalmon: "e9967a",
            darkseagreen: "8fbc8f",
            darkslateblue: "483d8b",
            darkslategray: "2f4f4f",
            darkslategrey: "2f4f4f",
            darkturquoise: "00ced1",
            darkviolet: "9400d3",
            deeppink: "ff1493",
            deepskyblue: "00bfff",
            dimgray: "696969",
            dimgrey: "696969",
            dodgerblue: "1e90ff",
            firebrick: "b22222",
            floralwhite: "fffaf0",
            forestgreen: "228b22",
            fuchsia: "f0f",
            gainsboro: "dcdcdc",
            ghostwhite: "f8f8ff",
            gold: "ffd700",
            goldenrod: "daa520",
            gray: "808080",
            green: "008000",
            greenyellow: "adff2f",
            grey: "808080",
            honeydew: "f0fff0",
            hotpink: "ff69b4",
            indianred: "cd5c5c",
            indigo: "4b0082",
            ivory: "fffff0",
            khaki: "f0e68c",
            lavender: "e6e6fa",
            lavenderblush: "fff0f5",
            lawngreen: "7cfc00",
            lemonchiffon: "fffacd",
            lightblue: "add8e6",
            lightcoral: "f08080",
            lightcyan: "e0ffff",
            lightgoldenrodyellow: "fafad2",
            lightgray: "d3d3d3",
            lightgreen: "90ee90",
            lightgrey: "d3d3d3",
            lightpink: "ffb6c1",
            lightsalmon: "ffa07a",
            lightseagreen: "20b2aa",
            lightskyblue: "87cefa",
            lightslategray: "789",
            lightslategrey: "789",
            lightsteelblue: "b0c4de",
            lightyellow: "ffffe0",
            lime: "0f0",
            limegreen: "32cd32",
            linen: "faf0e6",
            magenta: "f0f",
            maroon: "800000",
            mediumaquamarine: "66cdaa",
            mediumblue: "0000cd",
            mediumorchid: "ba55d3",
            mediumpurple: "9370db",
            mediumseagreen: "3cb371",
            mediumslateblue: "7b68ee",
            mediumspringgreen: "00fa9a",
            mediumturquoise: "48d1cc",
            mediumvioletred: "c71585",
            midnightblue: "191970",
            mintcream: "f5fffa",
            mistyrose: "ffe4e1",
            moccasin: "ffe4b5",
            navajowhite: "ffdead",
            navy: "000080",
            oldlace: "fdf5e6",
            olive: "808000",
            olivedrab: "6b8e23",
            orange: "ffa500",
            orangered: "ff4500",
            orchid: "da70d6",
            palegoldenrod: "eee8aa",
            palegreen: "98fb98",
            paleturquoise: "afeeee",
            palevioletred: "db7093",
            papayawhip: "ffefd5",
            peachpuff: "ffdab9",
            peru: "cd853f",
            pink: "ffc0cb",
            plum: "dda0dd",
            powderblue: "b0e0e6",
            purple: "800080",
            rebeccapurple: "663399",
            red: "f00",
            rosybrown: "bc8f8f",
            royalblue: "4169e1",
            saddlebrown: "8b4513",
            salmon: "fa8072",
            sandybrown: "f4a460",
            seagreen: "2e8b57",
            seashell: "fff5ee",
            sienna: "a0522d",
            silver: "c0c0c0",
            skyblue: "87ceeb",
            slateblue: "6a5acd",
            slategray: "708090",
            slategrey: "708090",
            snow: "fffafa",
            springgreen: "00ff7f",
            steelblue: "4682b4",
            tan: "d2b48c",
            teal: "008080",
            thistle: "d8bfd8",
            tomato: "ff6347",
            turquoise: "40e0d0",
            violet: "ee82ee",
            wheat: "f5deb3",
            white: "fff",
            whitesmoke: "f5f5f5",
            yellow: "ff0",
            yellowgreen: "9acd32"
        };

    // Make it easy to access colors via `hexNames[hex]`
        var hexNames = tinycolor.hexNames = flip(names);


    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
        function flip(o) {
            var flipped = { };
            for (var i in o) {
                if (o.hasOwnProperty(i)) {
                    flipped[o[i]] = i;
                }
            }
            return flipped;
        }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
        function boundAlpha(a) {
            a = parseFloat(a);

            if (isNaN(a) || a < 0 || a > 1) {
                a = 1;
            }

            return a;
        }

    // Take input from [0, n] and return it as [0, 1]
        function bound01(n, max) {
            if (isOnePointZero(n)) { n = "100%"; }

            var processPercent = isPercentage(n);
            n = mathMin(max, mathMax(0, parseFloat(n)));

            // Automatically convert percentage into number
            if (processPercent) {
                n = parseInt(n * max, 10) / 100;
            }

            // Handle floating point rounding errors
            if ((Math.abs(n - max) < 0.000001)) {
                return 1;
            }

            // Convert into [0, 1] range if it isn't already
            return (n % max) / parseFloat(max);
        }

    // Force a number between 0 and 1
        function clamp01(val) {
            return mathMin(1, mathMax(0, val));
        }

    // Parse a base-16 hex value into a base-10 integer
        function parseIntFromHex(val) {
            return parseInt(val, 16);
        }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
        function isOnePointZero(n) {
            return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
        }

    // Check to see if string passed in is a percentage
        function isPercentage(n) {
            return typeof n === "string" && n.indexOf('%') != -1;
        }

    // Force a hex value to have 2 characters
        function pad2(c) {
            return c.length == 1 ? '0' + c : '' + c;
        }

    // Replace a decimal with it's percentage value
        function convertToPercentage(n) {
            if (n <= 1) {
                n = (n * 100) + "%";
            }

            return n;
        }

    // Converts a decimal to a hex value
        function convertDecimalToHex(d) {
            return Math.round(parseFloat(d) * 255).toString(16);
        }
    // Converts a hex value to a decimal
        function convertHexToDecimal(h) {
            return (parseIntFromHex(h) / 255);
        }

        var matchers = (function() {

            // <http://www.w3.org/TR/css3-values/#integers>
            var CSS_INTEGER = "[-\\+]?\\d+%?";

            // <http://www.w3.org/TR/css3-values/#number-value>
            var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

            // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
            var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

            // Actual matching.
            // Parentheses and commas are optional, but not required.
            // Whitespace can take the place of commas or opening paren
            var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
            var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

            return {
                CSS_UNIT: new RegExp(CSS_UNIT),
                rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
                rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
                hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
                hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
                hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
                hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
                hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
                hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
                hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
                hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
            };
        })();

    // `isValidCSSUnit`
    // Take in a single string / number and check to see if it looks like a CSS unit
    // (see `matchers` above for definition).
        function isValidCSSUnit(color) {
            return !!matchers.CSS_UNIT.exec(color);
        }

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
        function stringInputToObject(color) {

            color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
            var named = false;
            if (names[color]) {
                color = names[color];
                named = true;
            }
            else if (color == 'transparent') {
                return { r: 0, g: 0, b: 0, a: 0, format: "name" };
            }

            // Try to match string input using regular expressions.
            // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
            // Just return an object and let the conversion functions handle that.
            // This way the result will be the same whether the tinycolor is initialized with string or object.
            var match;
            if ((match = matchers.rgb.exec(color))) {
                return { r: match[1], g: match[2], b: match[3] };
            }
            if ((match = matchers.rgba.exec(color))) {
                return { r: match[1], g: match[2], b: match[3], a: match[4] };
            }
            if ((match = matchers.hsl.exec(color))) {
                return { h: match[1], s: match[2], l: match[3] };
            }
            if ((match = matchers.hsla.exec(color))) {
                return { h: match[1], s: match[2], l: match[3], a: match[4] };
            }
            if ((match = matchers.hsv.exec(color))) {
                return { h: match[1], s: match[2], v: match[3] };
            }
            if ((match = matchers.hsva.exec(color))) {
                return { h: match[1], s: match[2], v: match[3], a: match[4] };
            }
            if ((match = matchers.hex8.exec(color))) {
                return {
                    r: parseIntFromHex(match[1]),
                    g: parseIntFromHex(match[2]),
                    b: parseIntFromHex(match[3]),
                    a: convertHexToDecimal(match[4]),
                    format: named ? "name" : "hex8"
                };
            }
            if ((match = matchers.hex6.exec(color))) {
                return {
                    r: parseIntFromHex(match[1]),
                    g: parseIntFromHex(match[2]),
                    b: parseIntFromHex(match[3]),
                    format: named ? "name" : "hex"
                };
            }
            if ((match = matchers.hex4.exec(color))) {
                return {
                    r: parseIntFromHex(match[1] + '' + match[1]),
                    g: parseIntFromHex(match[2] + '' + match[2]),
                    b: parseIntFromHex(match[3] + '' + match[3]),
                    a: convertHexToDecimal(match[4] + '' + match[4]),
                    format: named ? "name" : "hex8"
                };
            }
            if ((match = matchers.hex3.exec(color))) {
                return {
                    r: parseIntFromHex(match[1] + '' + match[1]),
                    g: parseIntFromHex(match[2] + '' + match[2]),
                    b: parseIntFromHex(match[3] + '' + match[3]),
                    format: named ? "name" : "hex"
                };
            }

            return false;
        }

        function validateWCAG2Parms(parms) {
            // return valid WCAG2 parms for isReadable.
            // If input parms are invalid, return {"level":"AA", "size":"small"}
            var level, size;
            parms = parms || {"level":"AA", "size":"small"};
            level = (parms.level || "AA").toUpperCase();
            size = (parms.size || "small").toLowerCase();
            if (level !== "AA" && level !== "AAA") {
                level = "AA";
            }
            if (size !== "small" && size !== "large") {
                size = "small";
            }
            return {"level":level, "size":size};
        }

    const $$1 = jQuery;
    class Server {
        constructor() {
            this.apiUrl = '/wp-json/mapsvg/v1/';
        }
        getUrl(path) {
            return this.apiUrl + path;
        }
        get(path, data) {
            return $$1.get(this.apiUrl + path, data);
        }
        post(path, data) {
            return $$1.post(this.apiUrl + path, data);
        }
        put(path, data) {
            return $$1.ajax({
                url: this.apiUrl + path,
                type: 'PUT',
                data: data
            });
        }
        delete(path, data) {
            return $$1.ajax({
                url: this.apiUrl + path,
                type: 'DELETE',
                data: data
            });
        }
    }

    class Events {
        constructor(context) {
            this.events = {};
            this.context = context;
        }
        on(event, callback) {
            if (!this.events[event])
                this.events[event] = [];
            this.events[event].push(callback);
            return this;
        }
        off(event, callback) {
            var _this = this;
            if (this.events[event] && this.events[event].length) {
                this.events[event].forEach(function (_callback, index) {
                    if (typeof callback === 'undefined') {
                        _this.events[event].splice(index, 1);
                    }
                    else if (_callback === callback) {
                        _this.events[event].splice(index, 1);
                    }
                });
            }
            return this;
        }
        trigger(event, thisArg, args) {
            if (this.events[event] && this.events[event].length)
                this.events[event].forEach((callback) => {
                    try {
                        callback && callback.apply(thisArg || this.context, args || [this.context]);
                    }
                    catch (err) {
                        console.error(err);
                    }
                });
            return this;
        }
        ;
    }

    class ArrayIndexed extends Array {
        constructor(indexKey, items) {
            if (items) {
                super(...items);
            }
            else {
                super();
            }
            this.key = indexKey;
            this.dict = {};
            if (this.length > 0) {
                var i = 0;
                var _this = this;
                this.forEach(function (item) {
                    _this.dict[item[_this.key]] = i;
                    i++;
                });
            }
        }
        push(item) {
            var length = super.push(item);
            this.dict[item[this.key]] = length - 1;
            return length;
        }
        pop() {
            var item = this[this.length - 1];
            var id = item[this.key];
            var length = super.pop();
            delete this.dict[id];
            return super.pop();
        }
        get(id) {
            return this.findById(id);
        }
        findById(id) {
            return this[this.dict[id]];
        }
        deleteById(id) {
            var index = this.dict[id];
            this.splice(index, 1);
            delete this.dict[id];
        }
        delete(id) {
            this.deleteById(id);
        }
        clear() {
            this.length = 0;
        }
        reindex() {
            var _this = this;
            this.dict = {};
            this.forEach(function (item, index) {
                _this.dict[item[_this.key]] = index;
            });
        }
    }

    class SchemaField {
        constructor(field) {
            let booleans = ['visible', 'searchable', 'readonly', 'protected'];
            for (var key in field) {
                this[key] = field[key];
            }
            booleans.forEach((paramName) => {
                if (typeof this[paramName] !== 'undefined') {
                    this[paramName] = MapSVG.parseBoolean(this[paramName]);
                }
                else {
                    this[paramName] = false;
                }
            });
            if (typeof this.options !== 'undefined') {
                if (!(this.options instanceof ArrayIndexed)) {
                    this.options = new ArrayIndexed('value', this.options);
                }
            }
        }
    }

    class Schema {
        constructor(options) {
            this.fields = new ArrayIndexed('name');
            this.build(options);
            this.lastChangeTime = Date.now();
            this.events = new Events(this);
        }
        ;
        build(options) {
            let allowedParams = ['id', 'title', 'type', 'name', 'fields'];
            allowedParams.forEach((paramName) => {
                var setter = 'set' + MapSVG.ucfirst(paramName);
                if (typeof options[paramName] !== 'undefined' && typeof this[setter] == 'function') {
                    this[setter](options[paramName]);
                }
            });
        }
        update(options) {
            this.build(options);
        }
        setId(id) {
            this.id = id;
        }
        setTitle(title) {
            this.title = title;
        }
        setName(name) {
            this.name = name;
        }
        loaded() {
            return this.fields.length !== 0;
        }
        setFields(fields) {
            if (fields) {
                this.fields.clear();
                fields.forEach((fieldParams) => {
                    this.fields.push(new SchemaField(fieldParams));
                });
            }
        }
        ;
        getFields() {
            return this.fields;
        }
        getFieldsAsArray() {
            return this.fields;
        }
        getFieldNames() {
            return this.fields.map((f) => f.name);
        }
        getField(field) {
            return this.fields.findById(field);
        }
        getFieldByType(type) {
            var f = null;
            this.fields.forEach(function (field) {
                if (field.type === type)
                    f = field;
            });
            return f;
        }
        getColumns(filters) {
            filters = filters || {};
            var columns = this.fields;
            var needfilters = Object.keys(filters).length !== 0;
            var results = [];
            if (needfilters) {
                var filterpass;
                columns.forEach(function (obj) {
                    filterpass = true;
                    for (var param in filters) {
                        filterpass = (obj[param] == filters[param]);
                    }
                    filterpass && results.push(obj);
                });
            }
            else {
                results = columns;
            }
            return results;
        }
        ;
        getData() {
            let data = {
                id: this.id,
                title: this.title,
                name: this.name,
                fields: this.fields,
                type: this.type
            };
            return data;
        }
    }

    class Query {
        constructor(options) {
            this.filters = {};
            this.filterout = {};
            this.page = 1;
            if (options) {
                for (var i in options) {
                    if (typeof options[i] !== "undefined") {
                        this[i] = options[i];
                    }
                }
            }
        }
        setFields(fields) {
            var _this = this;
            for (var key in fields) {
                if (key == 'filters') {
                    _this.setFilters(fields[key]);
                }
                else {
                    _this[key] = fields[key];
                }
            }
        }
        ;
        update(query) {
            for (var i in query) {
                if (typeof query[i] !== 'undefined') {
                    if (i === 'filters') {
                        this.setFilters(query[i]);
                    }
                    else {
                        this[i] = query[i];
                    }
                }
            }
        }
        get() {
            return {
                search: this.search,
                searchField: this.searchField,
                searchFallback: this.searchFallback,
                filters: this.filters,
                filterout: this.filterout,
                page: this.page,
                sort: this.sort,
                perpage: this.perpage,
                lastpage: this.lastpage
            };
        }
        ;
        clearFilters() {
            this.filters = {};
        }
        setFilters(fields) {
            var _this = this;
            for (var key in fields) {
                if (fields[key] === null || fields[key] === "" || fields[key] === undefined) {
                    if (_this.filters[key]) {
                        delete _this.filters[key];
                    }
                }
                else {
                    _this.filters[key] = fields[key];
                }
            }
        }
        ;
        setSearch(search) {
            this.search = search;
        }
        ;
        setFilterOut(fields) {
            var _this = this;
            for (var key in fields) {
                _this.filterout[key] = fields[key];
            }
        }
        ;
        resetFilters(fields) {
            this.filters = {};
        }
        ;
        setFilterField(field, value) {
            this.filters[field] = value;
        }
        ;
        hasFilters() {
            return Object.keys(this.filters).length > 0;
        }
        removeFilter(fieldName) {
            this.filters[fieldName] = null;
            delete this.filters[fieldName];
        }
    }

    class LocationAddress {
        constructor(fields) {
            for (var i in fields) {
                this[i] = fields[i];
            }
        }
        get state() {
            return this.country_short === 'US' ? this.administrative_area_level_1 : null;
        }
        get state_short() {
            return this.country_short === 'US' ? this.administrative_area_level_1_short : null;
        }
        get county() {
            return this.country_short === 'US' ? this.administrative_area_level_2 : null;
        }
        get zip() {
            return this.postal_code;
        }
    }

    class ScreenPoint {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
    class SVGPoint {
        constructor(x, y) {
            var _x, _y;
            if (typeof x === 'object') {
                if (x.x && x.y) {
                    _x = parseFloat(x.x + '');
                    _y = parseFloat(x.y + '');
                }
                else {
                    console.error("MapSVG: incorrect format of {x, y} object for SVGPoint.");
                    _x = 0;
                    _y = 0;
                }
            }
            else {
                _x = parseFloat(x + '');
                _y = parseFloat(y + '');
            }
            this.x = _x;
            this.y = _y;
        }
    }
    class GeoPoint {
        constructor(lat, lng) {
            var _lat, _lng;
            if (typeof lat === 'object') {
                if (lat.lat && lat.lng) {
                    _lat = parseFloat(lat.lat + '');
                    _lng = parseFloat(lat.lng + '');
                }
                else {
                    console.error("MapSVG: incorrect format of {lat, lng} object for GeoPoint.");
                    _lat = 0;
                    _lng = 0;
                }
            }
            else {
                _lat = parseFloat(lat + '');
                _lng = parseFloat(lng + '');
            }
            this.lat = _lat;
            this.lng = _lng;
        }
    }
    class Location {
        constructor(options) {
            this.build(options);
        }
        build(options) {
            if (options.img) {
                this.setImage(options.img);
            }
            if (options.address) {
                this.address = new LocationAddress(options.address);
            }
            if (typeof options.geoPoint !== undefined) {
                this.geoPoint = options.geoPoint;
            }
            if (typeof options.svgPoint !== undefined) {
                this.svgPoint = options.svgPoint;
            }
        }
        update(options) {
            this.build(options);
        }
        setImage(imgUrl) {
            if (typeof imgUrl !== 'string') {
                return;
            }
            var src = imgUrl.split('/').pop();
            if (imgUrl.indexOf('uploads') !== -1) {
                src = 'uploads/' + src;
            }
            this.img = src;
            this.imagePath = this.getImageUrl();
        }
        getImageUrl() {
            if ((this.img && this.img.indexOf('uploads/') === 0)) {
                return MapSVG.urls.uploads + 'markers/' + (this.img.replace('uploads/', ''));
            }
            else {
                return MapSVG.urls.root + 'markers/' + (this.img || '_pin_default.png');
            }
        }
        setSvgPoint(svgPoint) {
            this.svgPoint = svgPoint;
        }
        setGeoPoint(geoPoint) {
            this.geoPoint = geoPoint;
        }
        getMarkerImageUrl() {
            if ((this.img && this.img.indexOf('uploads/') === 0)) {
                return MapSVG.urls.uploads + 'markers/' + (this.img.replace('uploads/', ''));
            }
            else {
                return MapSVG.urls.root + 'markers/' + (this.img || '_pin_default.png');
            }
        }
        getData() {
            let data = {
                img: this.img,
                imagePath: this.imagePath,
                address: this.address
            };
            if (this.geoPoint) {
                data.geoPoint = { lat: this.geoPoint.lat, lng: this.geoPoint.lng };
            }
            if (this.svgPoint) {
                data.svgPoint = { x: this.svgPoint.x, y: this.svgPoint.y };
            }
            return data;
        }
    }

    class CustomObject {
        constructor(params, schema) {
            this.initialLoad = true;
            this.schema = schema;
            this.fields = schema.getFieldNames();
            this.dirtyFields = [];
            this.regions = [];
            this._regions = {};
            if (params.id !== undefined) {
                this.id = params.id;
            }
            this.initialLoad = true;
            this.build(params);
            this.initialLoad = false;
            if (this.id) {
                this.clearDirtyFields();
            }
        }
        build(params) {
            for (let fieldName in params) {
                let field = this.schema.getField(fieldName);
                if (field) {
                    if (!this.initialLoad) {
                        this.dirtyFields.push(fieldName);
                    }
                    switch (field.type) {
                        case 'region':
                            if (params[fieldName].hasOwnProperty('length')) {
                                this.regions = params[fieldName];
                                this._regions[this.schema.name] = this.regions;
                            }
                            else {
                                this._regions = params[fieldName];
                                this.regions = typeof this._regions[this.schema.name] != null ? this._regions[this.schema.name] : [];
                            }
                            break;
                        case 'location':
                            if (params[fieldName] != null && params[fieldName] != '' && Object.keys(params[fieldName]).length !== 0) {
                                let data = {
                                    img: params[fieldName].img,
                                    address: new LocationAddress(params[fieldName].address)
                                };
                                if (params[fieldName].geoPoint && params[fieldName].geoPoint.lat && params[fieldName].geoPoint.lng) {
                                    data.geoPoint = new GeoPoint(params[fieldName].geoPoint);
                                }
                                else if (params[fieldName].svgPoint && params[fieldName].svgPoint.x && params[fieldName].svgPoint.y) {
                                    data.svgPoint = new SVGPoint(params[fieldName].svgPoint);
                                }
                                if (this.location != null) {
                                    this.location.update(data);
                                }
                                else {
                                    this.location = new Location(data);
                                }
                            }
                            else {
                                params[fieldName] = null;
                            }
                            break;
                        case 'post':
                            if (params.post_id && params.post) {
                                this.post = params.post;
                                this.post_id = params.post.id;
                            }
                            break;
                        case 'select':
                            this[fieldName] = params[fieldName];
                            if (!field.multiselect) {
                                this[fieldName + '_text'] = field.options.get(params[fieldName]);
                            }
                            break;
                        case 'radio':
                            this[fieldName] = params[fieldName];
                            this[fieldName + '_text'] = field.options.get(params[fieldName]);
                            break;
                        default:
                            this[fieldName] = params[fieldName];
                            break;
                    }
                }
            }
        }
        update(params) {
            this.build(params);
        }
        getDirtyFields() {
            let data = {};
            this.dirtyFields.forEach((field) => { data[field] = this[field]; });
            data.id = this.id;
            if (data.location != null) {
                data.location = data.location.getData();
            }
            if (this.schema.getFieldByType('region')) {
                data.regions = this._regions;
            }
            return data;
        }
        clearDirtyFields() {
            this.dirtyFields = [];
        }
        getData(regionsTableName) {
            var data = {};
            let fields = this.schema.getFields();
            fields.forEach((field) => {
                switch (field.type) {
                    case 'region':
                        data.regions = this._regions[regionsTableName];
                        break;
                    case 'select':
                        data[field.name] = this[field.name];
                        if (!field.multiselect) {
                            data[field.name + '_text'] = this[field.name + '_text'];
                        }
                        break;
                    case 'radio':
                        data[field.name] = this[field.name];
                        data[field.name + '_text'] = this[field.name + '_text'];
                        break;
                    default:
                        data[field.name] = this[field.name];
                        break;
                }
            });
            return data;
        }
        getRegions(regionsTableName) {
            return this._regions[regionsTableName];
        }
    }

    const $$2 = jQuery;
    class Repository {
        constructor(objectName, path) {
            this.server = new Server();
            this.query = new Query();
            this.events = new Events(this);
            this.className = '';
            this.objectNameSingle = objectName;
            this.objectNameMany = objectName + 's';
            this.path = path + '/';
            this.objects = new ArrayIndexed('id');
            this.completeChunks = 0;
        }
        setSchema(schema) {
            this.schema = schema;
        }
        getSchema() {
            return this.schema;
        }
        loadDataFromResponse(response) {
            let data;
            data = this.decodeData(response);
            this.objects.clear();
            if (data[this.objectNameMany] && data[this.objectNameMany].length) {
                this.hasMoreRecords = this.query.perpage && (data[this.objectNameMany].length > this.query.perpage);
                if (this.hasMoreRecords) {
                    data[this.objectNameMany].pop();
                }
                data[this.objectNameMany].forEach(obj => { this.objects.push(obj); });
            }
            else {
                this.hasMoreRecords = false;
            }
            this.loaded = true;
            this.events.trigger('loaded');
        }
        ;
        reload() {
            return this.find();
        }
        ;
        create(object) {
            let defer = jQuery.Deferred();
            defer.promise();
            let data = {};
            data[this.objectNameSingle] = this.encodeData(object);
            this.server.post(this.path, data).done((response) => {
                let data = this.decodeData(response);
                let object = data[this.objectNameSingle];
                this.objects.push(object);
                defer.resolve(object);
                this.events.trigger('created', this, [object]);
            }).fail(() => {
                defer.reject();
            });
            return defer;
        }
        findById(id, nocache = false) {
            let defer = jQuery.Deferred();
            defer.promise();
            let object;
            if (!nocache) {
                object = this.objects.findById(id.toString());
            }
            if (!nocache && object) {
                defer.resolve(object);
            }
            else {
                this.server.get(this.path + id).done((response) => {
                    let data = this.decodeData(response);
                    defer.resolve(data[this.objectNameSingle]);
                }).fail(() => { defer.reject(); });
            }
            return defer;
        }
        find(query) {
            let defer = jQuery.Deferred();
            defer.promise();
            if (typeof query !== "undefined") {
                this.query.update(query);
            }
            this.server.get(this.path, this.query).done((response) => {
                this.loadDataFromResponse(response);
                defer.resolve(this.getLoaded());
            }).fail(() => { defer.reject(); });
            return defer;
        }
        getLoaded() {
            return this.objects;
        }
        getLoadedObject(id) {
            return this.objects.findById(id.toString());
        }
        getLoadedAsArray() {
            return this.objects;
        }
        update(object) {
            let defer = jQuery.Deferred();
            defer.promise();
            let data = {};
            let objectUpdatedFields = object instanceof CustomObject ? object.getDirtyFields() : object;
            data[this.objectNameSingle] = this.encodeData(objectUpdatedFields);
            this.server.put(this.path + objectUpdatedFields.id, data).done((response) => {
                object.clearDirtyFields();
                defer.resolve(object);
                this.events.trigger('updated', this, object);
            }).fail(() => { defer.reject(); });
            return defer;
        }
        delete(id) {
            let defer = jQuery.Deferred();
            defer.promise();
            this.server.delete(this.path + id).done((response) => {
                this.objects.delete(id.toString());
                this.events.trigger('deleted');
                defer.resolve();
            }).fail(() => { defer.reject(); });
            return defer;
        }
        clear() {
            let defer = jQuery.Deferred();
            defer.promise();
            this.server.delete(this.path).done((response) => {
                this.objects.clear();
                this.events.trigger('loaded');
                this.events.trigger('cleared');
                defer.resolve();
            }).fail(() => { defer.reject(); });
            return defer;
        }
        onFirstPage() {
            return this.query.page === 1;
        }
        onLastPage() {
            return this.hasMoreRecords === false;
        }
        encodeData(params) {
            return params;
        }
        decodeData(dataJSON) {
            let data;
            if (typeof dataJSON === 'string') {
                data = JSON.parse(dataJSON);
            }
            else {
                data = dataJSON;
            }
            if ((data.object || data.region || data.regions || data.objects) && data.schema) {
                this.setSchema(new Schema(data.schema));
            }
            let dataFormatted = {};
            for (let key in data) {
                switch (key) {
                    case 'object':
                    case 'region':
                        dataFormatted[key] = new CustomObject(data[key], this.schema);
                        break;
                    case 'objects':
                    case 'regions':
                        dataFormatted[key] = data[key].map((obj) => new CustomObject(obj, this.schema));
                        break;
                    case 'schema':
                        dataFormatted[key] = this.schema || new Schema(data[key]);
                        break;
                    case 'schemas':
                        dataFormatted[key] = data[key].map((obj) => new Schema(obj));
                        break;
                }
            }
            return dataFormatted;
        }
        import(data, convertLatlngToAddress, mapsvg) {
            var _this = this;
            var locationField = _this.schema.getFieldByType('location');
            var language = 'en';
            if (locationField && locationField.language) {
                language = locationField.language;
            }
            data = this.formatCSV(data, mapsvg);
            return this.importByChunks(data, language, convertLatlngToAddress).done(function () {
                _this.find();
            });
        }
        importByChunks(data, language, convertLatlngToAddress) {
            var _this = this;
            var i, j, temparray, chunk = 50;
            var chunks = [];
            for (i = 0, j = data.length; i < j; i += chunk) {
                temparray = data.slice(i, i + chunk);
                chunks.push(temparray);
            }
            if (chunks.length > 0) {
                var delay = 0;
                var delayPlus = chunks[0][0] && chunks[0][0].location ? 1000 : 0;
                var defer = $$2.Deferred();
                defer.promise();
                _this.completeChunks = 0;
                chunks.forEach(function (chunk) {
                    delay += delayPlus;
                    setTimeout(function () {
                        var data = {
                            language: language,
                            convertLatlngToAddress: convertLatlngToAddress
                        };
                        data[_this.objectNameMany] = JSON.stringify(chunk);
                        _this.server.post(_this.path + 'import', data).done(function (_data) {
                            _this.completeChunk(chunks, defer);
                        });
                    }, delay);
                });
            }
            return defer;
        }
        completeChunk(chunks, defer) {
            var _this = this;
            _this.completeChunks++;
            if (_this.completeChunks === chunks.length) {
                defer.resolve();
            }
        }
        ;
        formatCSV(data, mapsvg) {
            var _this = this;
            data.forEach(function (object, index) {
                var newObject = {};
                for (var key in object) {
                    var field = _this.schema.getField(key);
                    if (field !== undefined) {
                        switch (field.type) {
                            case "region":
                                newObject[key] = object[key].split(',')
                                    .map(function (regionId) {
                                    return regionId.trim();
                                }).filter(function (rId) {
                                    return mapsvg.getRegion(rId) !== undefined;
                                }).map(function (rId) {
                                    return { id: rId, title: mapsvg.getRegion(rId).title };
                                });
                                break;
                            case "location":
                                var latLngRegex = /^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/g;
                                if (object[key].match(latLngRegex)) {
                                    var coords = object[key].split(',').map(function (n) { return parseFloat(n); });
                                    if (coords.length == 2 && (coords[0] > -90 && coords[0] < 90) && (coords[1] > -180 && coords[1] < 180)) {
                                        newObject[key] = { geoPoint: { lat: coords[0], lng: coords[1] } };
                                    }
                                    else {
                                        newObject[key] = '';
                                    }
                                }
                                else if (object[key]) {
                                    newObject[key] = { address: object[key] };
                                }
                                if (typeof newObject[key] == 'object') {
                                    newObject[key].img = mapsvg.options.defaultMarkerImage;
                                }
                                break;
                            case "select":
                                var field = _this.schema.getField(key);
                                if (field.multiselect) {
                                    var labels = _this.schema.getField(key).options.map(function (f) {
                                        return f.label;
                                    });
                                    newObject[key] = object[key].split(',')
                                        .map(function (label) {
                                        return label.trim();
                                    }).filter(function (label) {
                                        return labels.indexOf(label) !== -1;
                                    }).map(function (label) {
                                        return _this.schema.getField(key).options.filter(function (option) {
                                            return option.label == label;
                                        })[0];
                                    });
                                }
                                else {
                                    newObject[key] = object[key];
                                }
                                break;
                            case "radio":
                            case "text":
                            case "textarea":
                            case "status":
                            default:
                                newObject[key] = object[key];
                                break;
                        }
                    }
                }
                data[index] = newObject;
            });
            return data;
        }
        ;
    }

    class MapsRepository extends Repository {
        constructor() {
            super('map', 'maps');
            this.path = 'maps/';
        }
        encodeData(params) {
            let data = {};
            data.options = JSON.stringify(params.options);
            data.options = data.options.replace(/select/g, "!mapsvg-encoded-slct");
            data.options = data.options.replace(/table/g, "!mapsvg-encoded-tbl");
            data.options = data.options.replace(/database/g, "!mapsvg-encoded-db");
            data.options = data.options.replace(/varchar/g, "!mapsvg-encoded-vc");
            data.id = params.id;
            data.title = params.title;
            return data;
        }
        decodeData(dataJSON) {
            let data;
            if (typeof dataJSON === 'string') {
                data = JSON.parse(dataJSON);
            }
            else {
                data = dataJSON;
            }
            return data;
        }
    }

    const $$3 = jQuery;
    class ResizeSensor {
        constructor(element, callback) {
            var _this = this;
            _this.element = element;
            _this.callback = callback;
            var style = getComputedStyle(element);
            var zIndex = parseInt(style.zIndex);
            if (isNaN(zIndex)) {
                zIndex = 0;
            }
            zIndex--;
            _this.expand = document.createElement('div');
            _this.expand.style.position = "absolute";
            _this.expand.style.left = "0px";
            _this.expand.style.top = "0px";
            _this.expand.style.right = "0px";
            _this.expand.style.bottom = "0px";
            _this.expand.style.overflow = "hidden";
            _this.expand.style.zIndex = zIndex.toString();
            _this.expand.style.visibility = "hidden";
            var expandChild = document.createElement('div');
            expandChild.style.position = "absolute";
            expandChild.style.left = "0px";
            expandChild.style.top = "0px";
            expandChild.style.width = "10000000px";
            expandChild.style.height = "10000000px";
            _this.expand.appendChild(expandChild);
            _this.shrink = document.createElement('div');
            _this.shrink.style.position = "absolute";
            _this.shrink.style.left = "0px";
            _this.shrink.style.top = "0px";
            _this.shrink.style.right = "0px";
            _this.shrink.style.bottom = "0px";
            _this.shrink.style.overflow = "hidden";
            _this.shrink.style.zIndex = zIndex.toString();
            _this.shrink.style.visibility = "hidden";
            var shrinkChild = document.createElement('div');
            shrinkChild.style.position = "absolute";
            shrinkChild.style.left = "0px";
            shrinkChild.style.top = "0px";
            shrinkChild.style.width = "200%";
            shrinkChild.style.height = "200%";
            _this.shrink.appendChild(shrinkChild);
            _this.element.appendChild(_this.expand);
            _this.element.appendChild(_this.shrink);
            var size = element.getBoundingClientRect();
            _this.currentWidth = size.width;
            _this.currentHeight = size.height;
            _this.setScroll();
            _this.expand.addEventListener('scroll', function () {
                _this.onScroll();
            });
            _this.shrink.addEventListener('scroll', function () {
                _this.onScroll();
            });
        }
        ;
        onScroll() {
            var _this = this;
            var size = _this.element.getBoundingClientRect();
            var newWidth = size.width;
            var newHeight = size.height;
            if (newWidth != _this.currentWidth || newHeight != _this.currentHeight) {
                _this.currentWidth = newWidth;
                _this.currentHeight = newHeight;
                _this.callback();
            }
            this.setScroll();
        }
        ;
        setScroll() {
            this.expand.scrollLeft = 10000000;
            this.expand.scrollTop = 10000000;
            this.shrink.scrollLeft = 10000000;
            this.shrink.scrollTop = 10000000;
        }
        ;
        destroy() {
            this.expand.remove();
            this.shrink.remove();
        }
        ;
    }

    class ViewBox {
        constructor(x, y, width, height) {
            if (typeof x === 'object') {
                if (x.hasOwnProperty('x')
                    && x.hasOwnProperty('y')
                    && x.hasOwnProperty('width')
                    && x.hasOwnProperty('height')) {
                    this.x = typeof x.x === 'string' ? parseFloat(x.x) : x.x;
                    this.y = typeof x.y === 'string' ? parseFloat(x.y) : x.y;
                    this.width = typeof x.width === 'string' ? parseFloat(x.width) : x.width;
                    this.height = typeof x.height === 'string' ? parseFloat(x.height) : x.height;
                }
                else if (typeof x === 'object' && x.length && x.length === 4) {
                    this.x = typeof x[0] === 'string' ? parseFloat(x[0]) : x[0];
                    this.y = typeof x[1] === 'string' ? parseFloat(x[1]) : x[1];
                    this.width = typeof x[2] === 'string' ? parseFloat(x[2]) : x[2];
                    this.height = typeof x[3] === 'string' ? parseFloat(x[3]) : x[3];
                }
            }
            else {
                this.x = typeof x === 'string' ? parseFloat(x) : x;
                this.y = typeof y === 'string' ? parseFloat(y) : y;
                this.width = typeof width === 'string' ? parseFloat(width) : width;
                this.height = typeof height === 'string' ? parseFloat(height) : height;
            }
        }
        toString() {
            return this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height;
        }
        toArray() {
            return [this.x, this.y, this.width, this.height];
        }
    }
    class GeoViewBox {
        constructor(sw, ne) {
            this.sw = sw;
            this.ne = ne;
        }
    }

    let extend = function () {

        // Variables
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Check if a deep merge
        if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object
        var merge = function (obj) {
            for ( var prop in obj ) {
                if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
                    // If deep merge and property is an object, merge properties
                    if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
                        extended[prop] = extend( true, extended[prop], obj[prop] );
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for ( ; i < length; i++ ) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;

    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var jquery = createCommonjsModule(function (module) {
    /*! jQuery v1.12.4 | (c) jQuery Foundation | jquery.org/license | WordPress 2019-05-16 */
    !function(a,b){module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)};}("undefined"!=typeof window?window:commonjsGlobal,function(a,b){var c=[],d=a.document,e=c.slice,f=c.concat,g=c.push,h=c.indexOf,i={},j=i.toString,k=i.hasOwnProperty,l={},m="1.12.4",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return e.call(this)},get:function(a){return null!=a?a<0?this[a+this.length]:this[a]:e.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a){return n.each(this,a)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(e.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(a<0?b:0);return this.pushStack(c>=0&&c<b?[this[c]]:[])},end:function(){return this.prevObject||this.constructor()},push:g,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);h<i;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],"__proto__"!==d&&g!==c&&(j&&c&&(n.isPlainObject(c)||(b=n.isArray(c)))?(b?(b=!1,f=a&&n.isArray(a)?a:[]):f=a&&n.isPlainObject(a)?a:{},g[d]=n.extend(j,f,c)):void 0!==c&&(g[d]=c));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return "function"===n.type(a)},isArray:Array.isArray||function(a){return "array"===n.type(a)},isWindow:function(a){return null!=a&&a==a.window},isNumeric:function(a){var b=a&&a.toString();return !n.isArray(a)&&b-parseFloat(b)+1>=0},isEmptyObject:function(a){var b;for(b in a)return !1;return !0},isPlainObject:function(a){var b;if(!a||"object"!==n.type(a)||a.nodeType||n.isWindow(a))return !1;try{if(a.constructor&&!k.call(a,"constructor")&&!k.call(a.constructor.prototype,"isPrototypeOf"))return !1}catch(c){return !1}if(!l.ownFirst)for(b in a)return k.call(a,b);for(b in a);return void 0===b||k.call(a,b)},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?i[j.call(a)]||"object":typeof a},globalEval:function(b){b&&n.trim(b)&&(a.execScript||function(b){a.eval.call(a,b);})(b);},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b){var c,d=0;if(s(a)){for(c=a.length;d<c;d++)if(!1===b.call(a[d],d,a[d]))break}else for(d in a)if(!1===b.call(a[d],d,a[d]))break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):g.call(c,a)),c},inArray:function(a,b,c){var d;if(b){if(h)return h.call(b,a,c);for(d=b.length,c=c?c<0?Math.max(0,d+c):c:0;c<d;c++)if(c in b&&b[c]===a)return c}return -1},merge:function(a,b){var c=+b.length,d=0,e=a.length;while(d<c)a[e++]=b[d++];if(c!==c)while(void 0!==b[d])a[e++]=b[d++];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;f<g;f++)(d=!b(a[f],f))!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,e,g=0,h=[];if(s(a))for(d=a.length;g<d;g++)null!=(e=b(a[g],g,c))&&h.push(e);else for(g in a)null!=(e=b(a[g],g,c))&&h.push(e);return f.apply([],h)},guid:1,proxy:function(a,b){var c,d,f;if("string"==typeof b&&(f=a[b],b=a,a=f),n.isFunction(a))return c=e.call(arguments,2),d=function(){return a.apply(b||this,c.concat(e.call(arguments)))},d.guid=a.guid=a.guid||n.guid++,d},now:function(){return +new Date},support:l}),"function"==typeof Symbol&&(n.fn[Symbol.iterator]=c[Symbol.iterator]),n.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(a,b){i["[object "+b+"]"]=b.toLowerCase();});function s(a){var b=!!a&&"length"in a&&a.length,c=n.type(a);return "function"!==c&&!n.isWindow(a)&&("array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a)}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=fa(),z=fa(),A=fa(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return c;return -1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+M+"))|)"+L+"*\\]",O=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+N+")*)|.*)\\)|)",P=new RegExp(L+"+","g"),Q=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),R=new RegExp("^"+L+"*,"+L+"*"),S=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),T=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),U=new RegExp(O),V=new RegExp("^"+M+"$"),W={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M+"|[*])"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},X=/^(?:input|select|textarea|button)$/i,Y=/^h\d$/i,Z=/^[^{]+\{\s*\[native \w/,$=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,_=/[+~]/,aa=/'|\\/g,ba=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),ca=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:d<0?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},da=function(){m();};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType;}catch(xa){H={apply:E.length?function(a,b){G.apply(a,I.call(b));}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1;}};}function ea(a,b,d,e){var f,h,j,k,l,o,r,s,w=b&&b.ownerDocument,x=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==x&&9!==x&&11!==x)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==x&&(o=$.exec(a)))if(f=o[1]){if(9===x){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(w&&(j=w.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(o[2])return H.apply(d,b.getElementsByTagName(a)),d;if((f=o[3])&&c.getElementsByClassName&&b.getElementsByClassName)return H.apply(d,b.getElementsByClassName(f)),d}if(c.qsa&&!A[a+" "]&&(!q||!q.test(a))){if(1!==x)w=b,s=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(aa,"\\$&"):b.setAttribute("id",k=u),r=g(a),h=r.length,l=V.test(k)?"#"+k:"[id='"+k+"']";while(h--)r[h]=l+" "+pa(r[h]);s=r.join(","),w=_.test(a)&&na(b.parentNode)||b;}if(s)try{return H.apply(d,w.querySelectorAll(s)),d}catch(y){}finally{k===u&&b.removeAttribute("id");}}}return i(a.replace(Q,"$1"),b,d,e)}function fa(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ga(a){return a[u]=!0,a}function ha(a){var b=n.createElement("div");try{return !!a(b)}catch(xa){return !1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null;}}function ia(a,b){var c=a.split("|"),e=c.length;while(e--)d.attrHandle[c[e]]=b;}function ja(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return -1;return a?1:-1}function ka(a){return function(b){return "input"===b.nodeName.toLowerCase()&&b.type===a}}function la(a){return function(b){var c=b.nodeName.toLowerCase();return ("input"===c||"button"===c)&&b.type===a}}function ma(a){return ga(function(b){return b=+b,ga(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]));})})}function na(a){return a&&void 0!==a.getElementsByTagName&&a}c=ea.support={},f=ea.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return !!b&&"HTML"!==b.nodeName},m=ea.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ha(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ha(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Z.test(n.getElementsByClassName),c.getById=ha(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if(void 0!==b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){var c=void 0!==a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return void 0!==b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){if(void 0!==b.getElementsByClassName&&p)return b.getElementsByClassName(a)},r=[],q=[],(c.qsa=Z.test(n.querySelectorAll))&&(ha(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]");}),ha(function(a){var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:");})),(c.matchesSelector=Z.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ha(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",O);}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Z.test(o.compareDocumentPosition),t=b||Z.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return !0;return !1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d||(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return ja(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?ja(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},ea.matches=function(a,b){return ea(a,null,null,b)},ea.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(T,"='$1']"),c.matchesSelector&&p&&!A[b+" "]&&(!r||!r.test(b))&&(!q||!q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(xa){}return ea(b,n,null,[a]).length>0},ea.contains=function(a,b){return (a.ownerDocument||a)!==n&&m(a),t(a,b)},ea.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ea.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ea.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1);}return k=null,a},e=ea.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a);}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ea.selectors={cacheLength:50,createPseudo:ga,match:W,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ba,ca),a[3]=(a[3]||a[4]||a[5]||"").replace(ba,ca),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ea.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ea.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return W.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&U.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ba,ca).toLowerCase();return "*"===a?function(){return !0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||void 0!==a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ea.attr(d,a);return null==e?"!="===b:!b||(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(P," ")+" ").indexOf(c)>-1:"|="===b&&(e===c||e.slice(0,c.length+1)===c+"-"))}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return !!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return !1;o=p="only"===a&&!o&&"nextSibling";}return !0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),!1===t)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return (t-=e)===d||t%d==0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ea.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ga(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g]);}):function(a){return e(a,0,c)}):e}},pseudos:{not:ga(function(a){var b=[],c=[],d=h(a.replace(Q,"$1"));return d[u]?ga(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f));}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ga(function(a){return function(b){return ea(a,b).length>0}}),contains:ga(function(a){return a=a.replace(ba,ca),function(b){return (b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ga(function(a){return V.test(a||"")||ea.error("unsupported lang: "+a),a=a.replace(ba,ca).toLowerCase(),function(b){var c;do{if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return (c=c.toLowerCase())===a||0===c.indexOf(a+"-")}while((b=b.parentNode)&&1===b.nodeType);return !1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return !1===a.disabled},disabled:function(a){return !0===a.disabled},checked:function(a){var b=a.nodeName.toLowerCase();return "input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,!0===a.selected},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return !1;return !0},parent:function(a){return !d.pseudos.empty(a)},header:function(a){return Y.test(a.nodeName)},input:function(a){return X.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return "input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return "input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:ma(function(){return [0]}),last:ma(function(a,b){return [b-1]}),eq:ma(function(a,b,c){return [c<0?c+b:c]}),even:ma(function(a,b){for(var c=0;c<b;c+=2)a.push(c);return a}),odd:ma(function(a,b){for(var c=1;c<b;c+=2)a.push(c);return a}),lt:ma(function(a,b,c){for(var d=c<0?c+b:c;--d>=0;)a.push(d);return a}),gt:ma(function(a,b,c){for(var d=c<0?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in {radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ka(b);for(b in {submit:!0,reset:!0})d.pseudos[b]=la(b);function oa(){}oa.prototype=d.filters=d.pseudos,d.setFilters=new oa,g=ea.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){c&&!(e=R.exec(h))||(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=S.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(Q," ")}),h=h.slice(c.length));for(g in d.filter)!(e=W[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ea.error(a):z(a,i).slice(0)};function pa(a){for(var b=0,c=a.length,d="";b<c;b++)d+=a[b].value;return d}function qa(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j,k=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return !0}else while(b=b[d])if(1===b.nodeType||e){if(j=b[u]||(b[u]={}),i=j[b.uniqueID]||(j[b.uniqueID]={}),(h=i[d])&&h[0]===w&&h[1]===f)return k[2]=h[2];if(i[d]=k,k[2]=a(b,c,g))return !0}}}function ra(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return !1;return !0}:a[0]}function sa(a,b,c){for(var d=0,e=b.length;d<e;d++)ea(a,b[d],c);return c}function ta(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;h<i;h++)(f=a[h])&&(c&&!c(f,d,e)||(g.push(f),j&&b.push(h)));return g}function ua(a,b,c,d,e,f){return d&&!d[u]&&(d=ua(d)),e&&!e[u]&&(e=ua(e,f)),ga(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||sa(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:ta(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=ta(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l));}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i);}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l));}}else r=ta(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r);})}function va(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=qa(function(a){return a===b},h,!0),l=qa(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];i<f;i++)if(c=d.relative[a[i].type])m=[qa(ra(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;e<f;e++)if(d.relative[a[e].type])break;return ua(i>1&&ra(m),i>1&&pa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(Q,"$1"),c,i<e&&va(a.slice(i,e)),e<f&&va(a=a.slice(e)),e<f&&pa(a))}m.push(c);}return ra(m)}function wa(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y);}c&&((l=!q&&l)&&r--,f&&t.push(l));}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=F.call(i));u=ta(u);}H.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&ea.uniqueSort(i);}return k&&(w=y,j=v),t};return c?ga(f):f}return h=ea.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=va(b[c]),f[u]?d.push(f):e.push(f);f=A(a,wa(e,d)),f.selector=a;}return f},i=ea.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(!(b=(d.find.ID(k.matches[0].replace(ba,ca),b)||[])[0]))return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length);}i=W.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ba,ca),_.test(j[0].type)&&na(b.parentNode)||b))){if(j.splice(i,1),!(a=f.length&&pa(j)))return H.apply(e,f),e;break}}}return (n||h(a,o))(f,b,!p,e,!b||_.test(a)&&na(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ha(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ha(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ia("type|href|height|width",function(a,b,c){if(!c)return a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ha(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ia("value",function(a,b,c){if(!c&&"input"===a.nodeName.toLowerCase())return a.defaultValue}),ha(function(a){return null==a.getAttribute("disabled")})||ia(K,function(a,b,c){var d;if(!c)return !0===a[b]?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ea}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.uniqueSort=n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a);}return d},v=function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c},w=n.expr.match.needsContext,x=/^<([\w-]+)\s*\/?>(?:<\/\1>|)$/,y=/^.[^:#\[\.,]*$/;function z(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return !!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(y.test(b))return n.filter(b,a,c);b=n.filter(b,a);}return n.grep(a,function(a){return n.inArray(a,b)>-1!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=[],d=this,e=d.length;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;b<e;b++)if(n.contains(d[b],this))return !0}));for(b=0;b<e;b++)n.find(a,d[b],c);return c=this.pushStack(e>1?n.unique(c):c),c.selector=this.selector?this.selector+" "+a:a,c},filter:function(a){return this.pushStack(z(this,a||[],!1))},not:function(a){return this.pushStack(z(this,a||[],!0))},is:function(a){return !!z(this,"string"==typeof a&&w.test(a)?n(a):a||[],!1).length}});var A,B=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/;(n.fn.init=function(a,b,c){var e,f;if(!a)return this;if(c=c||A,"string"==typeof a){if(!(e="<"===a.charAt(0)&&">"===a.charAt(a.length-1)&&a.length>=3?[null,a,null]:B.exec(a))||!e[1]&&b)return !b||b.jquery?(b||c).find(a):this.constructor(b).find(a);if(e[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:d,!0)),x.test(e[1])&&n.isPlainObject(b))for(e in b)n.isFunction(this[e])?this[e](b[e]):this.attr(e,b[e]);return this}if((f=d.getElementById(e[2]))&&f.parentNode){if(f.id!==e[2])return A.find(a);this.length=1,this[0]=f;}return this.context=d,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?void 0!==c.ready?c.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))}).prototype=n.fn,A=n(d);var C=/^(?:parents|prev(?:Until|All))/,D={children:!0,contents:!0,next:!0,prev:!0};n.fn.extend({has:function(a){var b,c=n(a,this),d=c.length;return this.filter(function(){for(b=0;b<d;b++)if(n.contains(this,c[b]))return !0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=w.test(a)||"string"!=typeof a?n(a,b||this.context):0;d<e;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.uniqueSort(f):f)},index:function(a){return a?"string"==typeof a?n.inArray(this[0],n(a)):n.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.uniqueSort(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function E(a,b){do{a=a[b];}while(a&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return u(a,"parentNode")},parentsUntil:function(a,b,c){return u(a,"parentNode",c)},next:function(a){return E(a,"nextSibling")},prev:function(a){return E(a,"previousSibling")},nextAll:function(a){return u(a,"nextSibling")},prevAll:function(a){return u(a,"previousSibling")},nextUntil:function(a,b,c){return u(a,"nextSibling",c)},prevUntil:function(a,b,c){return u(a,"previousSibling",c)},siblings:function(a){return v((a.parentNode||{}).firstChild,a)},children:function(a){return v(a.firstChild)},contents:function(a){return n.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return "Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(D[a]||(e=n.uniqueSort(e)),C.test(a)&&(e=e.reverse())),this.pushStack(e)};});var F=/\S+/g;function G(a){var b={};return n.each(a.match(F)||[],function(a,c){b[c]=!0;}),b}n.Callbacks=function(a){a="string"==typeof a?G(a):n.extend({},a);var b,c,d,e,f=[],g=[],h=-1,i=function(){for(e=a.once,d=b=!0;g.length;h=-1){c=g.shift();while(++h<f.length)!1===f[h].apply(c[0],c[1])&&a.stopOnFalse&&(h=f.length,c=!1);}a.memory||(c=!1),b=!1,e&&(f=c?[]:"");},j={add:function(){return f&&(c&&!b&&(h=f.length-1,g.push(c)),function b(c){n.each(c,function(c,d){n.isFunction(d)?a.unique&&j.has(d)||f.push(d):d&&d.length&&"string"!==n.type(d)&&b(d);});}(arguments),c&&!b&&i()),this},remove:function(){return n.each(arguments,function(a,b){var c;while((c=n.inArray(b,f,c))>-1)f.splice(c,1),c<=h&&h--;}),this},has:function(a){return a?n.inArray(a,f)>-1:f.length>0},empty:function(){return f&&(f=[]),this},disable:function(){return e=g=[],f=c="",this},disabled:function(){return !f},lock:function(){return e=!0,c||j.disable(),this},locked:function(){return !!e},fireWith:function(a,c){return e||(c=c||[],c=[a,c.slice?c.slice():c],g.push(c),b||i()),this},fire:function(){return j.fireWith(this,arguments),this},fired:function(){return !!d}};return j},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().progress(c.notify).done(c.resolve).fail(c.reject):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments);});}),a=null;}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h;},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith;}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=e.call(arguments),d=c.length,f=1!==d||a&&n.isFunction(a.promise)?d:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?e.call(arguments):d,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c);}},i,j,k;if(d>1)for(i=new Array(d),j=new Array(d),k=new Array(d);b<d;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().progress(h(b,j,i)).done(h(b,k,c)).fail(g.reject):--f;return f||g.resolveWith(k,c),g.promise()}});var H;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0);},ready:function(a){(!0===a?--n.readyWait:n.isReady)||(n.isReady=!0,!0!==a&&--n.readyWait>0||(H.resolveWith(d,[n]),n.fn.triggerHandler&&(n(d).triggerHandler("ready"),n(d).off("ready"))));}});function I(){d.addEventListener?(d.removeEventListener("DOMContentLoaded",J),a.removeEventListener("load",J)):(d.detachEvent("onreadystatechange",J),a.detachEvent("onload",J));}function J(){(d.addEventListener||"load"===a.event.type||"complete"===d.readyState)&&(I(),n.ready());}n.ready.promise=function(b){if(!H)if(H=n.Deferred(),"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll)a.setTimeout(n.ready);else if(d.addEventListener)d.addEventListener("DOMContentLoaded",J),a.addEventListener("load",J);else{d.attachEvent("onreadystatechange",J),a.attachEvent("onload",J);var c=!1;try{c=null==a.frameElement&&d.documentElement;}catch(e){}c&&c.doScroll&&function b(){if(!n.isReady){try{c.doScroll("left");}catch(e){return a.setTimeout(b,50)}I(),n.ready();}}();}return H.promise(b)},n.ready.promise();var K;for(K in n(l))break;l.ownFirst="0"===K,l.inlineBlockNeedsLayout=!1,n(function(){var a,b,c,e;(c=d.getElementsByTagName("body")[0])&&c.style&&(b=d.createElement("div"),e=d.createElement("div"),e.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(e).appendChild(b),void 0!==b.style.zoom&&(b.style.cssText="display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1",l.inlineBlockNeedsLayout=a=3===b.offsetWidth,a&&(c.style.zoom=1)),c.removeChild(e));}),function(){var a=d.createElement("div");l.deleteExpando=!0;try{delete a.test;}catch(b){l.deleteExpando=!1;}a=null;}();var L=function(a){var b=n.noData[(a.nodeName+" ").toLowerCase()],c=+a.nodeType||1;return (1===c||9===c)&&(!b||!0!==b&&a.getAttribute("classid")===b)},M=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,N=/([A-Z])/g;function O(a,b,c){if(void 0===c&&1===a.nodeType){var d="data-"+b.replace(N,"-$1").toLowerCase();if("string"==typeof(c=a.getAttribute(d))){try{c="true"===c||"false"!==c&&("null"===c?null:+c+""===c?+c:M.test(c)?n.parseJSON(c):c);}catch(e){}n.data(a,b,c);}else c=void 0;}return c}function P(a){var b
    ;for(b in a)if(("data"!==b||!n.isEmptyObject(a[b]))&&"toJSON"!==b)return !1;return !0}function Q(a,b,d,e){if(L(a)){var f,g,h=n.expando,i=a.nodeType,j=i?n.cache:a,k=i?a[h]:a[h]&&h;if(k&&j[k]&&(e||j[k].data)||void 0!==d||"string"!=typeof b)return k||(k=i?a[h]=c.pop()||n.guid++:h),j[k]||(j[k]=i?{}:{toJSON:n.noop}),"object"!=typeof b&&"function"!=typeof b||(e?j[k]=n.extend(j[k],b):j[k].data=n.extend(j[k].data,b)),g=j[k],e||(g.data||(g.data={}),g=g.data),void 0!==d&&(g[n.camelCase(b)]=d),"string"==typeof b?null==(f=g[b])&&(f=g[n.camelCase(b)]):f=g,f}}function R(a,b,c){if(L(a)){var d,e,f=a.nodeType,g=f?n.cache:a,h=f?a[n.expando]:n.expando;if(g[h]){if(b&&(d=c?g[h]:g[h].data)){n.isArray(b)?b=b.concat(n.map(b,n.camelCase)):b in d?b=[b]:(b=n.camelCase(b),b=b in d?[b]:b.split(" ")),e=b.length;while(e--)delete d[b[e]];if(c?!P(d):!n.isEmptyObject(d))return}(c||(delete g[h].data,P(g[h])))&&(f?n.cleanData([a],!0):l.deleteExpando||g!=g.window?delete g[h]:g[h]=void 0);}}}n.extend({cache:{},noData:{"applet ":!0,"embed ":!0,"object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(a){return !!(a=a.nodeType?n.cache[a[n.expando]]:a[n.expando])&&!P(a)},data:function(a,b,c){return Q(a,b,c)},removeData:function(a,b){return R(a,b)},_data:function(a,b,c){return Q(a,b,c,!0)},_removeData:function(a,b){return R(a,b,!0)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=n.data(f),1===f.nodeType&&!n._data(f,"parsedAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),O(f,d,e[d])));n._data(f,"parsedAttrs",!0);}return e}return "object"==typeof a?this.each(function(){n.data(this,a);}):arguments.length>1?this.each(function(){n.data(this,a,b);}):f?O(f,a,n.data(f,a)):void 0},removeData:function(a){return this.each(function(){n.removeData(this,a);})}}),n.extend({queue:function(a,b,c){var d;if(a)return b=(b||"fx")+"queue",d=n._data(a,b),c&&(!d||n.isArray(c)?d=n._data(a,b,n.makeArray(c)):d.push(c)),d||[]},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b);};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire();},_queueHooks:function(a,b){var c=b+"queueHooks";return n._data(a,c)||n._data(a,c,{empty:n.Callbacks("once memory").add(function(){n._removeData(a,b+"queue"),n._removeData(a,c);})})}}),n.fn.extend({queue:function(a,b){var c=2;return "string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a);})},dequeue:function(a){return this.each(function(){n.dequeue(this,a);})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f]);};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)(c=n._data(f[g],a+"queueHooks"))&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}}),function(){var a;l.shrinkWrapBlocks=function(){if(null!=a)return a;a=!1;var b,c,e;return (c=d.getElementsByTagName("body")[0])&&c.style?(b=d.createElement("div"),e=d.createElement("div"),e.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(e).appendChild(b),void 0!==b.style.zoom&&(b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1",b.appendChild(d.createElement("div")).style.width="5px",a=3!==b.offsetWidth),c.removeChild(e),a):void 0};}();var S=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=new RegExp("^(?:([+-])=|)("+S+")([a-z%]*)$","i"),U=["Top","Right","Bottom","Left"],V=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)};function W(a,b,c,d){var e,f=1,g=20,h=d?function(){return d.cur()}:function(){return n.css(a,b,"")},i=h(),j=c&&c[3]||(n.cssNumber[b]?"":"px"),k=(n.cssNumber[b]||"px"!==j&&+i)&&T.exec(n.css(a,b));if(k&&k[3]!==j){j=j||k[3],c=c||[],k=+i||1;do{f=f||".5",k/=f,n.style(a,b,k+j);}while(f!==(f=h()/i)&&1!==f&&--g)}return c&&(k=+k||+i||0,e=c[1]?k+(c[1]+1)*c[2]:+c[2],d&&(d.unit=j,d.start=k,d.end=e)),e}var X=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)X(a,b,h,c[h],!0,f,g);}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;h<i;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},Y=/^(?:checkbox|radio)$/i,Z=/<([\w:-]+)/,$=/^$|\/(?:java|ecma)script/i,_=/^\s+/,aa="abbr|article|aside|audio|bdi|canvas|data|datalist|details|dialog|figcaption|figure|footer|header|hgroup|main|mark|meter|nav|output|picture|progress|section|summary|template|time|video";function ba(a){var b=aa.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}!function(){var a=d.createElement("div"),b=d.createDocumentFragment(),c=d.createElement("input");a.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",l.leadingWhitespace=3===a.firstChild.nodeType,l.tbody=!a.getElementsByTagName("tbody").length,l.htmlSerialize=!!a.getElementsByTagName("link").length,l.html5Clone="<:nav></:nav>"!==d.createElement("nav").cloneNode(!0).outerHTML,c.type="checkbox",c.checked=!0,b.appendChild(c),l.appendChecked=c.checked,a.innerHTML="<textarea>x</textarea>",l.noCloneChecked=!!a.cloneNode(!0).lastChild.defaultValue,b.appendChild(a),c=d.createElement("input"),c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),a.appendChild(c),l.checkClone=a.cloneNode(!0).cloneNode(!0).lastChild.checked,l.noCloneEvent=!!a.addEventListener,a[n.expando]=1,l.attributes=!a.getAttribute(n.expando);}();var ca={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:l.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]};ca.optgroup=ca.option,ca.tbody=ca.tfoot=ca.colgroup=ca.caption=ca.thead,ca.th=ca.td;function da(a,b){var c,d,e=0,f=void 0!==a.getElementsByTagName?a.getElementsByTagName(b||"*"):void 0!==a.querySelectorAll?a.querySelectorAll(b||"*"):void 0;if(!f)for(f=[],c=a.childNodes||a;null!=(d=c[e]);e++)!b||n.nodeName(d,b)?f.push(d):n.merge(f,da(d,b));return void 0===b||b&&n.nodeName(a,b)?n.merge([a],f):f}function ea(a,b){for(var c,d=0;null!=(c=a[d]);d++)n._data(c,"globalEval",!b||n._data(b[d],"globalEval"));}var fa=/<|&#?\w+;/,ga=/<tbody/i;function ha(a){Y.test(a.type)&&(a.defaultChecked=a.checked);}function ia(a,b,c,d,e){for(var f,g,h,i,j,k,m,o=a.length,p=ba(b),q=[],r=0;r<o;r++)if((g=a[r])||0===g)if("object"===n.type(g))n.merge(q,g.nodeType?[g]:g);else if(fa.test(g)){i=i||p.appendChild(b.createElement("div")),j=(Z.exec(g)||["",""])[1].toLowerCase(),m=ca[j]||ca._default,i.innerHTML=m[1]+n.htmlPrefilter(g)+m[2],f=m[0];while(f--)i=i.lastChild;if(!l.leadingWhitespace&&_.test(g)&&q.push(b.createTextNode(_.exec(g)[0])),!l.tbody){g="table"!==j||ga.test(g)?"<table>"!==m[1]||ga.test(g)?0:i:i.firstChild,f=g&&g.childNodes.length;while(f--)n.nodeName(k=g.childNodes[f],"tbody")&&!k.childNodes.length&&g.removeChild(k);}n.merge(q,i.childNodes),i.textContent="";while(i.firstChild)i.removeChild(i.firstChild);i=p.lastChild;}else q.push(b.createTextNode(g));i&&p.removeChild(i),l.appendChecked||n.grep(da(q,"input"),ha),r=0;while(g=q[r++])if(d&&n.inArray(g,d)>-1)e&&e.push(g);else if(h=n.contains(g.ownerDocument,g),i=da(p.appendChild(g),"script"),h&&ea(i),c){f=0;while(g=i[f++])$.test(g.type||"")&&c.push(g);}return i=null,p}!function(){var b,c,e=d.createElement("div");for(b in {submit:!0,change:!0,focusin:!0})c="on"+b,(l[b]=c in a)||(e.setAttribute(c,"t"),l[b]=!1===e.attributes[c].expando);e=null;}();var ja=/^(?:input|select|textarea)$/i,ka=/^key/,la=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,ma=/^(?:focusinfocus|focusoutblur)$/,na=/^([^.]*)(?:\.(.+)|)/;function oa(){return !0}function pa(){return !1}function qa(){try{return d.activeElement}catch(a){}}function ra(a,b,c,d,e,f){var g,h;if("object"==typeof b){"string"!=typeof c&&(d=d||c,c=void 0);for(h in b)ra(a,h,c,d,b[h],f);return a}if(null==d&&null==e?(e=c,d=c=void 0):null==e&&("string"==typeof c?(e=d,d=void 0):(e=d,d=c,c=void 0)),!1===e)e=pa;else if(!e)return a;return 1===f&&(g=e,e=function(a){return n().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=n.guid++)),a.each(function(){n.event.add(this,b,e,d,c);})}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=n._data(a);if(r){c.handler&&(i=c,c=i.handler,e=i.selector),c.guid||(c.guid=n.guid++),(g=r.events)||(g=r.events={}),(k=r.handle)||(k=r.handle=function(a){return void 0===n||a&&n.event.triggered===a.type?void 0:n.event.dispatch.apply(k.elem,arguments)},k.elem=a),b=(b||"").match(F)||[""],h=b.length;while(h--)f=na.exec(b[h])||[],o=q=f[1],p=(f[2]||"").split(".").sort(),o&&(j=n.event.special[o]||{},o=(e?j.delegateType:j.bindType)||o,j=n.event.special[o]||{},l=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},i),(m=g[o])||(m=g[o]=[],m.delegateCount=0,j.setup&&!1!==j.setup.call(a,d,p,k)||(a.addEventListener?a.addEventListener(o,k,!1):a.attachEvent&&a.attachEvent("on"+o,k))),j.add&&(j.add.call(a,l),l.handler.guid||(l.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,l):m.push(l),n.event.global[o]=!0);a=null;}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=n.hasData(a)&&n._data(a);if(r&&(k=r.events)){b=(b||"").match(F)||[""],j=b.length;while(j--)if(h=na.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=k[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),i=f=m.length;while(f--)g=m[f],!e&&q!==g.origType||c&&c.guid!==g.guid||h&&!h.test(g.namespace)||d&&d!==g.selector&&("**"!==d||!g.selector)||(m.splice(f,1),g.selector&&m.delegateCount--,l.remove&&l.remove.call(a,g));i&&!m.length&&(l.teardown&&!1!==l.teardown.call(a,p,r.handle)||n.removeEvent(a,o,r.handle),delete k[o]);}else for(o in k)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(k)&&(delete r.handle,n._removeData(a,"events"));}},trigger:function(b,c,e,f){var g,h,i,j,l,m,o,p=[e||d],q=k.call(b,"type")?b.type:b,r=k.call(b,"namespace")?b.namespace.split("."):[];if(i=m=e=e||d,3!==e.nodeType&&8!==e.nodeType&&!ma.test(q+n.event.triggered)&&(q.indexOf(".")>-1&&(r=q.split("."),q=r.shift(),r.sort()),h=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=f?2:3,b.namespace=r.join("."),b.rnamespace=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=e),c=null==c?[b]:n.makeArray(c,[b]),l=n.event.special[q]||{},f||!l.trigger||!1!==l.trigger.apply(e,c))){if(!f&&!l.noBubble&&!n.isWindow(e)){for(j=l.delegateType||q,ma.test(j+q)||(i=i.parentNode);i;i=i.parentNode)p.push(i),m=i;m===(e.ownerDocument||d)&&p.push(m.defaultView||m.parentWindow||a);}o=0;while((i=p[o++])&&!b.isPropagationStopped())b.type=o>1?j:l.bindType||q,g=(n._data(i,"events")||{})[b.type]&&n._data(i,"handle"),g&&g.apply(i,c),(g=h&&i[h])&&g.apply&&L(i)&&(b.result=g.apply(i,c),!1===b.result&&b.preventDefault());if(b.type=q,!f&&!b.isDefaultPrevented()&&(!l._default||!1===l._default.apply(p.pop(),c))&&L(e)&&h&&e[q]&&!n.isWindow(e)){m=e[h],m&&(e[h]=null),n.event.triggered=q;try{e[q]();}catch(s){}n.event.triggered=void 0,m&&(e[h]=m);}return b.result}},dispatch:function(a){a=n.event.fix(a);var b,c,d,f,g,h=[],i=e.call(arguments),j=(n._data(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||!1!==k.preDispatch.call(this,a)){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())a.rnamespace&&!a.rnamespace.test(g.namespace)||(a.handleObj=g,a.data=g.data,void 0!==(d=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i))&&!1===(a.result=d)&&(a.preventDefault(),a.stopPropagation()));}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&("click"!==a.type||isNaN(a.button)||a.button<1))for(;i!=this;i=i.parentNode||this)if(1===i.nodeType&&(!0!==i.disabled||"click"!==a.type)){for(d=[],c=0;c<h;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>-1:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d});}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},fix:function(a){if(a[n.expando])return a;var b,c,e,f=a.type,g=a,h=this.fixHooks[f];h||(this.fixHooks[f]=h=la.test(f)?this.mouseHooks:ka.test(f)?this.keyHooks:{}),e=h.props?this.props.concat(h.props):this.props,a=new n.Event(g),b=e.length;while(b--)c=e[b],a[c]=g[c];return a.target||(a.target=g.srcElement||d),3===a.target.nodeType&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,h.filter?h.filter(a,g):a},props:"altKey bubbles cancelable ctrlKey currentTarget detail eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,e,f,g=b.button,h=b.fromElement;return null==a.pageX&&null!=b.clientX&&(e=a.target.ownerDocument||d,f=e.documentElement,c=e.body,a.pageX=b.clientX+(f&&f.scrollLeft||c&&c.scrollLeft||0)-(f&&f.clientLeft||c&&c.clientLeft||0),a.pageY=b.clientY+(f&&f.scrollTop||c&&c.scrollTop||0)-(f&&f.clientTop||c&&c.clientTop||0)),!a.relatedTarget&&h&&(a.relatedTarget=h===a.target?b.toElement:h),a.which||void 0===g||(a.which=1&g?1:2&g?3:4&g?2:0),a}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==qa()&&this.focus)try{return this.focus(),!1}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){if(this===qa()&&this.blur)return this.blur(),!1},delegateType:"focusout"},click:{trigger:function(){if(n.nodeName(this,"input")&&"checkbox"===this.type&&this.click)return this.click(),!1},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result);}}},simulate:function(a,b,c){var d=n.extend(new n.Event,c,{type:a,isSimulated:!0});n.event.trigger(d,null,b),d.isDefaultPrevented()&&c.preventDefault();}},n.removeEvent=d.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c);}:function(a,b,c){var d="on"+b;a.detachEvent&&(void 0===a[d]&&(a[d]=null),a.detachEvent(d,c));},n.Event=function(a,b){if(!(this instanceof n.Event))return new n.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&!1===a.returnValue?oa:pa):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),this[n.expando]=!0;},n.Event.prototype={constructor:n.Event,isDefaultPrevented:pa,isPropagationStopped:pa,isImmediatePropagationStopped:pa,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=oa,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1);},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=oa,a&&!this.isSimulated&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0);},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=oa,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation();}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return e&&(e===d||n.contains(d,e))||(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}};}),l.submit||(n.event.special.submit={setup:function(){if(n.nodeName(this,"form"))return !1;n.event.add(this,"click._submit keypress._submit",function(a){var b=a.target,c=n.nodeName(b,"input")||n.nodeName(b,"button")?n.prop(b,"form"):void 0;c&&!n._data(c,"submit")&&(n.event.add(c,"submit._submit",function(a){a._submitBubble=!0;}),n._data(c,"submit",!0));});},postDispatch:function(a){a._submitBubble&&(delete a._submitBubble,this.parentNode&&!a.isTrigger&&n.event.simulate("submit",this.parentNode,a));},teardown:function(){if(n.nodeName(this,"form"))return !1;n.event.remove(this,"._submit");}}),l.change||(n.event.special.change={setup:function(){if(ja.test(this.nodeName))return "checkbox"!==this.type&&"radio"!==this.type||(n.event.add(this,"propertychange._change",function(a){"checked"===a.originalEvent.propertyName&&(this._justChanged=!0);}),n.event.add(this,"click._change",function(a){this._justChanged&&!a.isTrigger&&(this._justChanged=!1),n.event.simulate("change",this,a);})),!1;n.event.add(this,"beforeactivate._change",function(a){var b=a.target;ja.test(b.nodeName)&&!n._data(b,"change")&&(n.event.add(b,"change._change",function(a){!this.parentNode||a.isSimulated||a.isTrigger||n.event.simulate("change",this.parentNode,a);}),n._data(b,"change",!0));});},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||"radio"!==b.type&&"checkbox"!==b.type)return a.handleObj.handler.apply(this,arguments)},teardown:function(){return n.event.remove(this,"._change"),!ja.test(this.nodeName)}}),l.focusin||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a));};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=n._data(d,b);e||d.addEventListener(a,c,!0),n._data(d,b,(e||0)+1);},teardown:function(){var d=this.ownerDocument||this,e=n._data(d,b)-1;e?n._data(d,b,e):(d.removeEventListener(a,c,!0),n._removeData(d,b));}};}),n.fn.extend({on:function(a,b,c,d){return ra(this,a,b,c,d)},one:function(a,b,c,d){return ra(this,a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return !1!==b&&"function"!=typeof b||(c=b,b=void 0),!1===c&&(c=pa),this.each(function(){n.event.remove(this,a,c,b);})},trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this);})},triggerHandler:function(a,b){var c=this[0];if(c)return n.event.trigger(a,b,c,!0)}});var sa=/ jQuery\d+="(?:null|\d+)"/g,ta=new RegExp("<(?:"+aa+")[\\s/>]","i"),ua=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,va=/<script|<style|<link/i,wa=/checked\s*(?:[^=]|=\s*.checked.)/i,xa=/^true\/(.*)/,ya=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,za=ba(d),Aa=za.appendChild(d.createElement("div"));function Ba(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function Ca(a){return a.type=(null!==n.find.attr(a,"type"))+"/"+a.type,a}function Da(a){var b=xa.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function Ea(a,b){if(1===b.nodeType&&n.hasData(a)){var c,d,e,f=n._data(a),g=n._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;d<e;d++)n.event.add(b,c,h[c][d]);}g.data&&(g.data=n.extend({},g.data));}}function Fa(a,b){var c,d,e;if(1===b.nodeType){if(c=b.nodeName.toLowerCase(),!l.noCloneEvent&&b[n.expando]){e=n._data(b);for(d in e.events)n.removeEvent(b,d,e.handle);b.removeAttribute(n.expando);}"script"===c&&b.text!==a.text?(Ca(b).text=a.text,Da(b)):"object"===c?(b.parentNode&&(b.outerHTML=a.outerHTML),l.html5Clone&&a.innerHTML&&!n.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):"input"===c&&Y.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):"option"===c?b.defaultSelected=b.selected=a.defaultSelected:"input"!==c&&"textarea"!==c||(b.defaultValue=a.defaultValue);}}function Ga(a,b,c,d){b=f.apply([],b);var e,g,h,i,j,k,m=0,o=a.length,p=o-1,q=b[0],r=n.isFunction(q);if(r||o>1&&"string"==typeof q&&!l.checkClone&&wa.test(q))return a.each(function(e){var f=a.eq(e);r&&(b[0]=q.call(this,e,f.html())),Ga(f,b,c,d);});if(o&&(k=ia(b,a[0].ownerDocument,!1,a,d),e=k.firstChild,1===k.childNodes.length&&(k=e),e||d)){for(i=n.map(da(k,"script"),Ca),h=i.length;m<o;m++)g=k,m!==p&&(g=n.clone(g,!0,!0),h&&n.merge(i,da(g,"script"))),c.call(a[m],g,m);if(h)for(j=i[i.length-1].ownerDocument,n.map(i,Da),m=0;m<h;m++)g=i[m],$.test(g.type||"")&&!n._data(g,"globalEval")&&n.contains(j,g)&&(g.src?n._evalUrl&&n._evalUrl(g.src):n.globalEval((g.text||g.textContent||g.innerHTML||"").replace(ya,"")));k=e=null;}return a}function Ha(a,b,c){for(var d,e=b?n.filter(b,a):a,f=0;null!=(d=e[f]);f++)c||1!==d.nodeType||n.cleanData(da(d)),d.parentNode&&(c&&n.contains(d.ownerDocument,d)&&ea(da(d,"script")),d.parentNode.removeChild(d));return a}n.extend({htmlPrefilter:function(a){return a.replace(ua,"<$1></$2>")},clone:function(a,b,c){var d,e,f,g,h,i=n.contains(a.ownerDocument,a);if(l.html5Clone||n.isXMLDoc(a)||!ta.test("<"+a.nodeName+">")?f=a.cloneNode(!0):(Aa.innerHTML=a.outerHTML,Aa.removeChild(f=Aa.firstChild)),!(l.noCloneEvent&&l.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(d=da(f),h=da(a),g=0;null!=(e=h[g]);++g)d[g]&&Fa(e,d[g]);if(b)if(c)for(h=h||da(a),d=d||da(f),g=0;null!=(e=h[g]);g++)Ea(e,d[g]);else Ea(a,f);return d=da(f,"script"),d.length>0&&ea(d,!i&&da(a,"script")),d=h=e=null,f},cleanData:function(a,b){for(var d,e,f,g,h=0,i=n.expando,j=n.cache,k=l.attributes,m=n.event.special;null!=(d=a[h]);h++)if((b||L(d))&&(f=d[i],g=f&&j[f])){if(g.events)for(e in g.events)m[e]?n.event.remove(d,e):n.removeEvent(d,e,g.handle);j[f]&&(delete j[f],k||void 0===d.removeAttribute?d[i]=void 0:d.removeAttribute(i),c.push(f));}}}),n.fn.extend({domManip:Ga,detach:function(a){return Ha(this,a,!0)},remove:function(a){return Ha(this,a)},text:function(a){return X(this,function(a){return void 0===a?n.text(this):this.empty().append((this[0]&&this[0].ownerDocument||d).createTextNode(a))},null,a,arguments.length)},append:function(){return Ga(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){Ba(this,a).appendChild(a);}})},prepend:function(){return Ga(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Ba(this,a);b.insertBefore(a,b.firstChild);}})},before:function(){return Ga(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this);})},after:function(){return Ga(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling);})},empty:function(){for(var a,b=0;null!=(a=this[b]);b++){1===a.nodeType&&n.cleanData(da(a,!1));while(a.firstChild)a.removeChild(a.firstChild);a.options&&n.nodeName(a,"select")&&(a.options.length=0);}return this},clone:function(a,b){return a=null!=a&&a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return X(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a)return 1===b.nodeType?b.innerHTML.replace(sa,""):void 0;if("string"==typeof a&&!va.test(a)&&(l.htmlSerialize||!ta.test(a))&&(l.leadingWhitespace||!_.test(a))&&!ca[(Z.exec(a)||["",""])[1].toLowerCase()]){a=n.htmlPrefilter(a);try{for(;c<d;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(da(b,!1)),b.innerHTML=a);b=0;}catch(e){}}b&&this.empty().append(a);},null,a,arguments.length)},replaceWith:function(){var a=[];return Ga(this,arguments,function(b){var c=this.parentNode;n.inArray(this,a)<0&&(n.cleanData(da(this)),c&&c.replaceChild(b,this));},a)}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=0,e=[],f=n(a),h=f.length-1;d<=h;d++)c=d===h?this:this.clone(!0),n(f[d])[b](c),g.apply(e,c.get());return this.pushStack(e)};});var Ia,Ja={HTML:"block",BODY:"block"};function Ka(a,b){var c=n(b.createElement(a)).appendTo(b.body),d=n.css(c[0],"display");return c.detach(),d}function La(a){var b=d,c=Ja[a];return c||(c=Ka(a,b),"none"!==c&&c||(Ia=(Ia||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=(Ia[0].contentWindow||Ia[0].contentDocument).document,b.write(),b.close(),c=Ka(a,b),Ia.detach()),Ja[a]=c),c}var Ma=/^margin/,Na=new RegExp("^("+S+")(?!px)[a-z%]+$","i"),Oa=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e},Pa=d.documentElement;!function(){var b,c,e,f,g,h,i=d.createElement("div"),j=d.createElement("div");function k(){var k,l,m=d.documentElement;m.appendChild(i),j.style.cssText="-webkit-box-sizing:border-box;box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",b=e=h=!1,c=g=!0,a.getComputedStyle&&(l=a.getComputedStyle(j),b="1%"!==(l||{}).top,h="2px"===(l||{}).marginLeft,e="4px"===(l||{width:"4px"}).width,j.style.marginRight="50%",c="4px"===(l||{marginRight:"4px"}).marginRight,k=j.appendChild(d.createElement("div")),k.style.cssText=j.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",k.style.marginRight=k.style.width="0",j.style.width="1px",g=!parseFloat((a.getComputedStyle(k)||{}).marginRight),j.removeChild(k)),j.style.display="none",f=0===j.getClientRects().length,f&&(j.style.display="",j.innerHTML="<table><tr><td></td><td>t</td></tr></table>",j.childNodes[0].style.borderCollapse="separate",k=j.getElementsByTagName("td"),k[0].style.cssText="margin:0;border:0;padding:0;display:none",(f=0===k[0].offsetHeight)&&(k[0].style.display="",k[1].style.display="none",f=0===k[0].offsetHeight)),m.removeChild(i);}j.style&&(j.style.cssText="float:left;opacity:.5",l.opacity="0.5"===j.style.opacity,l.cssFloat=!!j.style.cssFloat,j.style.backgroundClip="content-box",j.cloneNode(!0).style.backgroundClip="",l.clearCloneStyle="content-box"===j.style.backgroundClip,i=d.createElement("div"),i.style.cssText="border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",j.innerHTML="",i.appendChild(j),l.boxSizing=""===j.style.boxSizing||""===j.style.MozBoxSizing||""===j.style.WebkitBoxSizing,n.extend(l,{reliableHiddenOffsets:function(){return null==b&&k(),f},boxSizingReliable:function(){return null==b&&k(),e},pixelMarginRight:function(){return null==b&&k(),c},pixelPosition:function(){return null==b&&k(),b},reliableMarginRight:function(){return null==b&&k(),g},reliableMarginLeft:function(){return null==b&&k(),h}}));}();var Qa,Ra,Sa=/^(top|right|bottom|left)$/;a.getComputedStyle?(Qa=function(b){var c=b.ownerDocument.defaultView;return c&&c.opener||(c=a),c.getComputedStyle(b)},Ra=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Qa(a),g=c?c.getPropertyValue(b)||c[b]:void 0,""!==g&&void 0!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),c&&!l.pixelMarginRight()&&Na.test(g)&&Ma.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f),void 0===g?g:g+""}):Pa.currentStyle&&(Qa=function(a){return a.currentStyle},Ra=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Qa(a),g=c?c[b]:void 0,null==g&&h&&h[b]&&(g=h[b]),Na.test(g)&&!Sa.test(b)&&(d=h.left,e=a.runtimeStyle,f=e&&e.left,f&&(e.left=a.currentStyle.left),h.left="fontSize"===b?"1em":g,g=h.pixelLeft+"px",h.left=d,f&&(e.left=f)),void 0===g?g:g+""||"auto"});function Ta(a,b){return {get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}var Ua=/alpha\([^)]*\)/i,Va=/opacity\s*=\s*([^)]*)/i,Wa=/^(none|table(?!-c[ea]).+)/,Xa=new RegExp("^("+S+")(.*)$","i"),Ya={position:"absolute",visibility:"hidden",display:"block"},Za={letterSpacing:"0",fontWeight:"400"},$a=["Webkit","O","Moz","ms"],_a=d.createElement("div").style;function ab(a){if(a in _a)return a;var b=a.charAt(0).toUpperCase()+a.slice(1),c=$a.length;while(c--)if((a=$a[c]+b)in _a)return a}function bb(a,b){for(var c,d,e,f=[],g=0,h=a.length;g<h;g++)d=a[g],d.style&&(f[g]=n._data(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&V(d)&&(f[g]=n._data(d,"olddisplay",La(d.nodeName)))):(e=V(d),(c&&"none"!==c||!e)&&n._data(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;g<h;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}function cb(a,b,c){var d=Xa.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function db(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;f<4;f+=2)"margin"===c&&(g+=n.css(a,c+U[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+U[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+U[f]+"Width",!0,e))):(g+=n.css(a,"padding"+U[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+U[f]+"Width",!0,e)));return g}function eb(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=Qa(a),g=l.boxSizing&&"border-box"===n.css(a,"boxSizing",!1,f);if(e<=0||null==e){if(e=Ra(a,b,f),(e<0||null==e)&&(e=a.style[b]),Na.test(e))return e;d=g&&(l.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0;}return e+db(a,b,c||(g?"border":"content"),d,f)+"px"}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Ra(a,"opacity");return ""===c?"1":c}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{float:l.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;if(b=n.cssProps[h]||(n.cssProps[h]=ab(h)||h),g=n.cssHooks[b]||n.cssHooks[h],void 0===c)return g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b];if(f=typeof c,"string"===f&&(e=T.exec(c))&&e[1]&&(c=W(a,b,e),f="number"),null!=c&&c===c&&("number"===f&&(c+=e&&e[3]||(n.cssNumber[h]?"":"px")),l.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),!(g&&"set"in g&&void 0===(c=g.set(a,c,d)))))try{i[b]=c;}catch(j){}}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=ab(h)||h),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(f=g.get(a,!0,c)),void 0===f&&(f=Ra(a,b,d)),"normal"===f&&b in Za&&(f=Za[b]),""===c||c?(e=parseFloat(f),!0===c||isFinite(e)?e||0:f):f}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){if(c)return Wa.test(n.css(a,"display"))&&0===a.offsetWidth?Oa(a,Ya,function(){return eb(a,b,d)}):eb(a,b,d)},set:function(a,c,d){var e=d&&Qa(a);return cb(a,c,d?db(a,b,d,l.boxSizing&&"border-box"===n.css(a,"boxSizing",!1,e),e):0)}};}),l.opacity||(n.cssHooks.opacity={get:function(a,b){return Va.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=n.isNumeric(b)?"alpha(opacity="+100*b+")":"",f=d&&d.filter||c.filter||"";c.zoom=1,(b>=1||""===b)&&""===n.trim(f.replace(Ua,""))&&c.removeAttribute&&(c.removeAttribute("filter"),""===b||d&&!d.filter)||(c.filter=Ua.test(f)?f.replace(Ua,e):f+" "+e);}}),n.cssHooks.marginRight=Ta(l.reliableMarginRight,function(a,b){if(b)return Oa(a,{display:"inline-block"},Ra,[a,"marginRight"])}),n.cssHooks.marginLeft=Ta(l.reliableMarginLeft,function(a,b){if(b)return (parseFloat(Ra(a,"marginLeft"))||(n.contains(a.ownerDocument,a)?a.getBoundingClientRect().left-Oa(a,{marginLeft:0},function(){return a.getBoundingClientRect().left}):0))+"px"}),n.each({
    margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];d<4;d++)e[a+U[d]+b]=f[d]||f[d-2]||f[0];return e}},Ma.test(a)||(n.cssHooks[a+b].set=cb);}),n.fn.extend({css:function(a,b){return X(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=Qa(a),e=b.length;g<e;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return bb(this,!0)},hide:function(){return bb(this)},toggle:function(a){return "boolean"==typeof a?a?this.show():this.hide():this.each(function(){V(this)?n(this).show():n(this).hide();})}});function fb(a,b,c,d,e){return new fb.prototype.init(a,b,c,d,e)}n.Tween=fb,fb.prototype={constructor:fb,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||n.easing._default,this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px");},cur:function(){var a=fb.propHooks[this.prop];return a&&a.get?a.get(this):fb.propHooks._default.get(this)},run:function(a){var b,c=fb.propHooks[this.prop];return this.options.duration?this.pos=b=n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):fb.propHooks._default.set(this),this}},fb.prototype.init.prototype=fb.prototype,fb.propHooks={_default:{get:function(a){var b;return 1!==a.elem.nodeType||null!=a.elem[a.prop]&&null==a.elem.style[a.prop]?a.elem[a.prop]:(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0)},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):1!==a.elem.nodeType||null==a.elem.style[n.cssProps[a.prop]]&&!n.cssHooks[a.prop]?a.elem[a.prop]=a.now:n.style(a.elem,a.prop,a.now+a.unit);}}},fb.propHooks.scrollTop=fb.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now);}},n.easing={linear:function(a){return a},swing:function(a){return .5-Math.cos(a*Math.PI)/2},_default:"swing"},n.fx=fb.prototype.init,n.fx.step={};var gb,hb,ib=/^(?:toggle|show|hide)$/,jb=/queueHooks$/;function kb(){return a.setTimeout(function(){gb=void 0;}),gb=n.now()}function lb(a,b){var c,d={height:a},e=0;for(b=b?1:0;e<4;e+=2-b)c=U[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function mb(a,b,c){for(var d,e=(pb.tweeners[b]||[]).concat(pb.tweeners["*"]),f=0,g=e.length;f<g;f++)if(d=e[f].call(c,b,a))return d}function nb(a,b,c){var d,e,f,g,h,i,j,k,m=this,o={},p=a.style,q=a.nodeType&&V(a),r=n._data(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i();}),h.unqueued++,m.always(function(){m.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire();});})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[p.overflow,p.overflowX,p.overflowY],j=n.css(a,"display"),"inline"===(k="none"===j?n._data(a,"olddisplay")||La(a.nodeName):j)&&"none"===n.css(a,"float")&&(l.inlineBlockNeedsLayout&&"inline"!==La(a.nodeName)?p.zoom=1:p.display="inline-block")),c.overflow&&(p.overflow="hidden",l.shrinkWrapBlocks()||m.always(function(){p.overflow=c.overflow[0],p.overflowX=c.overflow[1],p.overflowY=c.overflow[2];}));for(d in b)if(e=b[d],ib.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(q?"hide":"show")){if("show"!==e||!r||void 0===r[d])continue;q=!0;}o[d]=r&&r[d]||n.style(a,d);}else j=void 0;if(n.isEmptyObject(o))"inline"===("none"===j?La(a.nodeName):j)&&(p.display=j);else{r?"hidden"in r&&(q=r.hidden):r=n._data(a,"fxshow",{}),f&&(r.hidden=!q),q?n(a).show():m.done(function(){n(a).hide();}),m.done(function(){var b;n._removeData(a,"fxshow");for(b in o)n.style(a,b,o[b]);});for(d in o)g=mb(q?r[d]:0,d,m),d in r||(r[d]=g.start,q&&(g.end=g.start,g.start="width"===d||"height"===d?1:0));}}function ob(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),(g=n.cssHooks[d])&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e);}else b[d]=e;}function pb(a,b,c){var d,e,f=0,g=pb.prefilters.length,h=n.Deferred().always(function(){delete i.elem;}),i=function(){if(e)return !1;for(var b=gb||kb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;g<i;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),f<1&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{},easing:n.easing._default},c),originalProperties:b,originalOptions:c,startTime:gb||kb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;c<d;c++)j.tweens[c].run(1);return b?(h.notifyWith(a,[j,1,0]),h.resolveWith(a,[j,b])):h.rejectWith(a,[j,b]),this}}),k=j.props;for(ob(k,j.opts.specialEasing);f<g;f++)if(d=pb.prefilters[f].call(j,a,k,j.opts))return n.isFunction(d.stop)&&(n._queueHooks(j.elem,j.opts.queue).stop=n.proxy(d.stop,d)),d;return n.map(k,mb,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(pb,{tweeners:{"*":[function(a,b){var c=this.createTween(a,b);return W(c.elem,a,T.exec(b),c),c}]},tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.match(F);for(var c,d=0,e=a.length;d<e;d++)c=a[d],pb.tweeners[c]=pb.tweeners[c]||[],pb.tweeners[c].unshift(b);},prefilters:[nb],prefilter:function(a,b){b?pb.prefilters.unshift(a):pb.prefilters.push(a);}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,null!=d.queue&&!0!==d.queue||(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue);},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(V).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=pb(this,n.extend({},a),f);(e||n._data(this,"finish"))&&b.stop(!0);};return g.finish=g,e||!1===f.queue?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c);};return "string"!=typeof a&&(c=b,b=a,a=void 0),b&&!1!==a&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=n._data(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&jb.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));!b&&c||n.dequeue(this,a);})},finish:function(a){return !1!==a&&(a=a||"fx"),this.each(function(){var b,c=n._data(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;b<g;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish;})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(lb(b,!0),a,d,e)};}),n.each({slideDown:lb("show"),slideUp:lb("hide"),slideToggle:lb("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)};}),n.timers=[],n.fx.tick=function(){var a,b=n.timers,c=0;for(gb=n.now();c<b.length;c++)(a=b[c])()||b[c]!==a||b.splice(c--,1);b.length||n.fx.stop(),gb=void 0;},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop();},n.fx.interval=13,n.fx.start=function(){hb||(hb=a.setInterval(n.fx.tick,n.fx.interval));},n.fx.stop=function(){a.clearInterval(hb),hb=null;},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(b,c){return b=n.fx?n.fx.speeds[b]||b:b,c=c||"fx",this.queue(c,function(c,d){var e=a.setTimeout(c,b);d.stop=function(){a.clearTimeout(e);};})},function(){var a,b=d.createElement("input"),c=d.createElement("div"),e=d.createElement("select"),f=e.appendChild(d.createElement("option"));c=d.createElement("div"),c.setAttribute("className","t"),c.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",a=c.getElementsByTagName("a")[0],b.setAttribute("type","checkbox"),c.appendChild(b),a=c.getElementsByTagName("a")[0],a.style.cssText="top:1px",l.getSetAttribute="t"!==c.className,l.style=/top/.test(a.getAttribute("style")),l.hrefNormalized="/a"===a.getAttribute("href"),l.checkOn=!!b.value,l.optSelected=f.selected,l.enctype=!!d.createElement("form").enctype,e.disabled=!0,l.optDisabled=!f.disabled,b=d.createElement("input"),b.setAttribute("value",""),l.input=""===b.getAttribute("value"),b.value="t",b.setAttribute("type","radio"),l.radioValue="t"===b.value;}();var qb=/\r/g,rb=/[\x20\t\r\n\f]+/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),(b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()])&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e));});if(e)return (b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()])&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(qb,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.trim(n.text(a)).replace(rb," ")}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||e<0,g=f?null:[],h=f?e+1:d.length,i=e<0?h:f?e:0;i<h;i++)if(c=d[i],(c.selected||i===e)&&(l.optDisabled?!c.disabled:null===c.getAttribute("disabled"))&&(!c.parentNode.disabled||!n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b);}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)if(d=e[g],n.inArray(n.valHooks.option.get(d),f)>-1)try{d.selected=c=!0;}catch(h){d.scrollHeight;}else d.selected=!1;return c||(a.selectedIndex=-1),e}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){if(n.isArray(b))return a.checked=n.inArray(n(a).val(),b)>-1}},l.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value});});var sb,tb,ub=n.expr.attrHandle,vb=/^(?:checked|selected)$/i,wb=l.getSetAttribute,xb=l.input;n.fn.extend({attr:function(a,b){return X(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a);})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return void 0===a.getAttribute?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),e=n.attrHooks[b]||(n.expr.match.bool.test(b)?tb:sb)),void 0!==c?null===c?void n.removeAttr(a,b):e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:(a.setAttribute(b,c+""),c):e&&"get"in e&&null!==(d=e.get(a,b))?d:(d=n.find.attr(a,b),null==d?void 0:d))},attrHooks:{type:{set:function(a,b){if(!l.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(F);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)?xb&&wb||!vb.test(c)?a[d]=!1:a[n.camelCase("default-"+c)]=a[d]=!1:n.attr(a,c,""),a.removeAttribute(wb?c:d);}}),tb={set:function(a,b,c){return !1===b?n.removeAttr(a,c):xb&&wb||!vb.test(c)?a.setAttribute(!wb&&n.propFix[c]||c,c):a[n.camelCase("default-"+c)]=a[c]=!0,c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=ub[b]||n.find.attr;xb&&wb||!vb.test(b)?ub[b]=function(a,b,d){var e,f;return d||(f=ub[b],ub[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,ub[b]=f),e}:ub[b]=function(a,b,c){if(!c)return a[n.camelCase("default-"+b)]?b.toLowerCase():null};}),xb&&wb||(n.attrHooks.value={set:function(a,b,c){if(!n.nodeName(a,"input"))return sb&&sb.set(a,b,c);a.defaultValue=b;}}),wb||(sb={set:function(a,b,c){var d=a.getAttributeNode(c);if(d||a.setAttributeNode(d=a.ownerDocument.createAttribute(c)),d.value=b+="","value"===c||b===a.getAttribute(c))return b}},ub.id=ub.name=ub.coords=function(a,b,c){var d;if(!c)return (d=a.getAttributeNode(b))&&""!==d.value?d.value:null},n.valHooks.button={get:function(a,b){var c=a.getAttributeNode(b);if(c&&c.specified)return c.value},set:sb.set},n.attrHooks.contenteditable={set:function(a,b,c){sb.set(a,""!==b&&b,c);}},n.each(["width","height"],function(a,b){n.attrHooks[b]={set:function(a,c){if(""===c)return a.setAttribute(b,"auto"),c}};})),l.style||(n.attrHooks.style={get:function(a){return a.style.cssText||void 0},set:function(a,b){return a.style.cssText=b+""}});var yb=/^(?:input|select|textarea|button|object)$/i,zb=/^(?:a|area)$/i;n.fn.extend({prop:function(a,b){return X(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return a=n.propFix[a]||a,this.each(function(){try{this[a]=void 0,delete this[a];}catch(b){}})}}),n.extend({prop:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return 1===f&&n.isXMLDoc(a)||(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=n.find.attr(a,"tabindex");return b?parseInt(b,10):yb.test(a.nodeName)||zb.test(a.nodeName)&&a.href?0:-1}}},propFix:{for:"htmlFor",class:"className"}}),l.hrefNormalized||n.each(["href","src"],function(a,b){n.propHooks[b]={get:function(a){return a.getAttribute(b,4)}};}),l.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null},set:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this;}),l.enctype||(n.propFix.enctype="encoding");var Ab=/[\t\r\n\f]/g;function Bb(a){return n.attr(a,"class")||""}n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,Bb(this)));});if("string"==typeof a&&a){b=a.match(F)||[];while(c=this[i++])if(e=Bb(c),d=1===c.nodeType&&(" "+e+" ").replace(Ab," ")){g=0;while(f=b[g++])d.indexOf(" "+f+" ")<0&&(d+=f+" ");h=n.trim(d),e!==h&&n.attr(c,"class",h);}}return this},removeClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,Bb(this)));});if(!arguments.length)return this.attr("class","");if("string"==typeof a&&a){b=a.match(F)||[];while(c=this[i++])if(e=Bb(c),d=1===c.nodeType&&(" "+e+" ").replace(Ab," ")){g=0;while(f=b[g++])while(d.indexOf(" "+f+" ")>-1)d=d.replace(" "+f+" "," ");h=n.trim(d),e!==h&&n.attr(c,"class",h);}}return this},toggleClass:function(a,b){var c=typeof a;return "boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):n.isFunction(a)?this.each(function(c){n(this).toggleClass(a.call(this,c,Bb(this),b),b);}):this.each(function(){var b,d,e,f;if("string"===c){d=0,e=n(this),f=a.match(F)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b);}else void 0!==a&&"boolean"!==c||(b=Bb(this),b&&n._data(this,"__className__",b),n.attr(this,"class",b||!1===a?"":n._data(this,"__className__")||""));})},hasClass:function(a){var b,c,d=0;b=" "+a+" ";while(c=this[d++])if(1===c.nodeType&&(" "+Bb(c)+" ").replace(Ab," ").indexOf(b)>-1)return !0;return !1}}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)};}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var Cb=a.location,Db=n.now(),Eb=/\?/,Fb=/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;n.parseJSON=function(b){if(a.JSON&&a.JSON.parse)return a.JSON.parse(b+"");var c,d=null,e=n.trim(b+"");return e&&!n.trim(e.replace(Fb,function(a,b,e,f){return c&&b&&(d=0),0===d?a:(c=e||b,d+=!f-!e,"")}))?Function("return "+e)():n.error("Invalid JSON: "+b)},n.parseXML=function(b){var c,d;if(!b||"string"!=typeof b)return null;try{a.DOMParser?(d=new a.DOMParser,c=d.parseFromString(b,"text/xml")):(c=new a.ActiveXObject("Microsoft.XMLDOM"),c.async="false",c.loadXML(b));}catch(e){c=void 0;}return c&&c.documentElement&&!c.getElementsByTagName("parsererror").length||n.error("Invalid XML: "+b),c};var Gb=/#.*$/,Hb=/([?&])_=[^&]*/,Ib=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Jb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Kb=/^(?:GET|HEAD)$/,Lb=/^\/\//,Mb=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,Nb={},Ob={},Pb="*/".concat("*"),Qb=Cb.href,Rb=Mb.exec(Qb.toLowerCase())||[];function Sb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(F)||[];if(n.isFunction(c))while(d=f[e++])"+"===d.charAt(0)?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c);}}function Tb(a,b,c,d){var e={},f=a===Ob;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return "string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Ub(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(d in b)void 0!==b[d]&&((e[d]?a:c||(c={}))[d]=b[d]);return c&&n.extend(!0,a,c),a}function Vb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===e&&(e=a.mimeType||b.getResponseHeader("Content-Type"));if(e)for(g in h)if(h[g]&&h[g].test(e)){i.unshift(g);break}if(i[0]in c)f=i[0];else{for(g in c){if(!i[0]||a.converters[g+" "+i[0]]){f=g;break}d||(d=g);}f=f||d;}if(f)return f!==i[0]&&i.unshift(f),c[f]}function Wb(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(!(g=j[i+" "+f]||j["* "+f]))for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){!0===g?g=j[e]:!0!==j[e]&&(f=h[0],k.unshift(h[1]));break}if(!0!==g)if(g&&a.throws)b=g(b);else try{b=g(b);}catch(l){return {state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return {state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Qb,type:"GET",isLocal:Jb.test(Rb[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Pb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Ub(Ub(a,n.ajaxSettings),b):Ub(n.ajaxSettings,a)},ajaxPrefilter:Sb(Nb),ajaxTransport:Sb(Ob),ajax:function(b,c){"object"==typeof b&&(c=b,b=void 0),c=c||{};var d,e,f,g,h,i,j,k,l=n.ajaxSetup({},c),m=l.context||l,o=l.context&&(m.nodeType||m.jquery)?n(m):n.event,p=n.Deferred(),q=n.Callbacks("once memory"),r=l.statusCode||{},s={},t={},u=0,v="canceled",w={readyState:0,getResponseHeader:function(a){var b;if(2===u){if(!k){k={};while(b=Ib.exec(g))k[b[1].toLowerCase()]=b[2];}b=k[a.toLowerCase()];}return null==b?null:b},getAllResponseHeaders:function(){return 2===u?g:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return u||(a=t[c]=t[c]||a,s[a]=b),this},overrideMimeType:function(a){return u||(l.mimeType=a),this},statusCode:function(a){var b;if(a)if(u<2)for(b in a)r[b]=[r[b],a[b]];else w.always(a[w.status]);return this},abort:function(a){var b=a||v;return j&&j.abort(b),x(0,b),this}};if(p.promise(w).complete=q.add,w.success=w.done,w.error=w.fail,l.url=((b||l.url||Qb)+"").replace(Gb,"").replace(Lb,Rb[1]+"//"),l.type=c.method||c.type||l.method||l.type,l.dataTypes=n.trim(l.dataType||"*").toLowerCase().match(F)||[""],null==l.crossDomain&&(d=Mb.exec(l.url.toLowerCase()),l.crossDomain=!(!d||d[1]===Rb[1]&&d[2]===Rb[2]&&(d[3]||("http:"===d[1]?"80":"443"))===(Rb[3]||("http:"===Rb[1]?"80":"443")))),l.data&&l.processData&&"string"!=typeof l.data&&(l.data=n.param(l.data,l.traditional)),Tb(Nb,l,c,w),2===u)return w;i=n.event&&l.global,i&&0==n.active++&&n.event.trigger("ajaxStart"),l.type=l.type.toUpperCase(),l.hasContent=!Kb.test(l.type),f=l.url,l.hasContent||(l.data&&(f=l.url+=(Eb.test(f)?"&":"?")+l.data,delete l.data),!1===l.cache&&(l.url=Hb.test(f)?f.replace(Hb,"$1_="+Db++):f+(Eb.test(f)?"&":"?")+"_="+Db++)),l.ifModified&&(n.lastModified[f]&&w.setRequestHeader("If-Modified-Since",n.lastModified[f]),n.etag[f]&&w.setRequestHeader("If-None-Match",n.etag[f])),(l.data&&l.hasContent&&!1!==l.contentType||c.contentType)&&w.setRequestHeader("Content-Type",l.contentType),w.setRequestHeader("Accept",l.dataTypes[0]&&l.accepts[l.dataTypes[0]]?l.accepts[l.dataTypes[0]]+("*"!==l.dataTypes[0]?", "+Pb+"; q=0.01":""):l.accepts["*"]);for(e in l.headers)w.setRequestHeader(e,l.headers[e]);if(l.beforeSend&&(!1===l.beforeSend.call(m,w,l)||2===u))return w.abort();v="abort";for(e in {success:1,error:1,complete:1})w[e](l[e]);if(j=Tb(Ob,l,c,w)){if(w.readyState=1,i&&o.trigger("ajaxSend",[w,l]),2===u)return w;l.async&&l.timeout>0&&(h=a.setTimeout(function(){w.abort("timeout");},l.timeout));try{u=1,j.send(s,x);}catch(y){if(!(u<2))throw y;x(-1,y);}}else x(-1,"No Transport");function x(b,c,d,e){var k,s,t,v,x,y=c;2!==u&&(u=2,h&&a.clearTimeout(h),j=void 0,g=e||"",w.readyState=b>0?4:0,k=b>=200&&b<300||304===b,d&&(v=Vb(l,w,d)),v=Wb(l,v,w,k),k?(l.ifModified&&(x=w.getResponseHeader("Last-Modified"),x&&(n.lastModified[f]=x),(x=w.getResponseHeader("etag"))&&(n.etag[f]=x)),204===b||"HEAD"===l.type?y="nocontent":304===b?y="notmodified":(y=v.state,s=v.data,t=v.error,k=!t)):(t=y,!b&&y||(y="error",b<0&&(b=0))),w.status=b,w.statusText=(c||y)+"",k?p.resolveWith(m,[s,y,w]):p.rejectWith(m,[w,y,t]),w.statusCode(r),r=void 0,i&&o.trigger(k?"ajaxSuccess":"ajaxError",[w,l,k?s:t]),q.fireWith(m,[w,y]),i&&(o.trigger("ajaxComplete",[w,l]),--n.active||n.event.trigger("ajaxStop")));}return w},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax(n.extend({url:a,type:b,dataType:e,data:c,success:d},n.isPlainObject(a)&&a))};}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,throws:!0})},n.fn.extend({wrapAll:function(a){if(n.isFunction(a))return this.each(function(b){n(this).wrapAll(a.call(this,b));});if(this[0]){var b=n(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&1===a.firstChild.nodeType)a=a.firstChild;return a}).append(this);}return this},wrapInner:function(a){return n.isFunction(a)?this.each(function(b){n(this).wrapInner(a.call(this,b));}):this.each(function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a);})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a);})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes);}).end()}});function Xb(a){return a.style&&a.style.display||n.css(a,"display")}function Yb(a){if(!n.contains(a.ownerDocument||d,a))return !0;while(a&&1===a.nodeType){if("none"===Xb(a)||"hidden"===a.type)return !0;a=a.parentNode;}return !1}n.expr.filters.hidden=function(a){return l.reliableHiddenOffsets()?a.offsetWidth<=0&&a.offsetHeight<=0&&!a.getClientRects().length:Yb(a)},n.expr.filters.visible=function(a){return !n.expr.filters.hidden(a)};var Zb=/%20/g,$b=/\[\]$/,_b=/\r?\n/g,ac=/^(?:submit|button|image|reset|file)$/i,bc=/^(?:input|select|textarea|keygen)/i;function cc(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||$b.test(a)?d(a,e):cc(a+"["+("object"==typeof e&&null!=e?b:"")+"]",e,c,d);});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)cc(a+"["+e+"]",b[e],c,d);}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b);};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value);});else for(c in a)cc(c,a[c],b,e);return d.join("&").replace(Zb,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&bc.test(this.nodeName)&&!ac.test(a)&&(this.checked||!Y.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return {name:b.name,value:a.replace(_b,"\r\n")}}):{name:b.name,value:c.replace(_b,"\r\n")}}).get()}}),n.ajaxSettings.xhr=void 0!==a.ActiveXObject?function(){return this.isLocal?hc():d.documentMode>8?gc():/^(get|post|head|put|delete|options)$/i.test(this.type)&&gc()||hc()}:gc;var dc=0,ec={},fc=n.ajaxSettings.xhr();a.attachEvent&&a.attachEvent("onunload",function(){for(var a in ec)ec[a](void 0,!0);}),l.cors=!!fc&&"withCredentials"in fc,(fc=l.ajax=!!fc)&&n.ajaxTransport(function(b){if(!b.crossDomain||l.cors){var c;return {send:function(d,e){var f,g=b.xhr(),h=++dc;if(g.open(b.type,b.url,b.async,b.username,b.password),b.xhrFields)for(f in b.xhrFields)g[f]=b.xhrFields[f];b.mimeType&&g.overrideMimeType&&g.overrideMimeType(b.mimeType),b.crossDomain||d["X-Requested-With"]||(d["X-Requested-With"]="XMLHttpRequest");for(f in d)void 0!==d[f]&&g.setRequestHeader(f,d[f]+"");g.send(b.hasContent&&b.data||null),c=function(a,d){var f,i,j;if(c&&(d||4===g.readyState))if(delete ec[h],c=void 0,g.onreadystatechange=n.noop,d)4!==g.readyState&&g.abort();else{j={},f=g.status,"string"==typeof g.responseText&&(j.text=g.responseText);try{i=g.statusText;}catch(k){i="";}f||!b.isLocal||b.crossDomain?1223===f&&(f=204):f=j.text?200:404;}j&&e(f,i,j,g.getAllResponseHeaders());},b.async?4===g.readyState?a.setTimeout(c):g.onreadystatechange=ec[h]=c:c();},abort:function(){c&&c(void 0,!0);}}}});function gc(){try{return new a.XMLHttpRequest}catch(b){}}function hc(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1);}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c=d.head||n("head")[0]||d.documentElement;return {send:function(e,f){b=d.createElement("script"),b.async=!0,a.scriptCharset&&(b.charset=a.scriptCharset),b.src=a.url,b.onload=b.onreadystatechange=function(a,c){(c||!b.readyState||/loaded|complete/.test(b.readyState))&&(b.onload=b.onreadystatechange=null,b.parentNode&&b.parentNode.removeChild(b),b=null,c||f(200,"success"));},c.insertBefore(b,c.firstChild);},abort:function(){b&&b.onload(void 0,!0);}}}});var ic=[],jc=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=ic.pop()||n.expando+"_"+Db++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=!1!==b.jsonp&&(jc.test(b.url)?"url":"string"==typeof b.data&&0===(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&jc.test(b.data)&&"data");if(h||"jsonp"===b.dataTypes[0])return e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(jc,"$1"+e):!1!==b.jsonp&&(b.url+=(Eb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments;},d.always(function(){void 0===f?n(a).removeProp(e):a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,ic.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0;}),"script"}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||d;var e=x.exec(a),f=!c&&[];return e?[b.createElement(e[1])]:(e=ia([a],b,f),f&&f.length&&n(f).remove(),n.merge([],e.childNodes))};var kc=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&kc)return kc.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>-1&&(d=n.trim(a.slice(h,a.length)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e||"GET",dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a);}).always(c&&function(a,b){g.each(function(){c.apply(this,f||[a.responseText,b,a]);});}),this},n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)};}),n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};function lc(a){return n.isWindow(a)?a:9===a.nodeType&&(a.defaultView||a.parentWindow)}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&n.inArray("auto",[f,i])>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,n.extend({},h))),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m);}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b);});var b,c,d={top:0,left:0},e=this[0],f=e&&e.ownerDocument;if(f)return b=f.documentElement,n.contains(b,e)?(void 0!==e.getBoundingClientRect&&(d=e.getBoundingClientRect()),c=lc(f),{top:d.top+(c.pageYOffset||b.scrollTop)-(b.clientTop||0),left:d.left+(c.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}):d},position:function(){if(this[0]){var a,b,c={top:0,left:0},d=this[0];return "fixed"===n.css(d,"position")?b=d.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(c=a.offset()),c.top+=n.css(a[0],"borderTopWidth",!0),c.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-c.top-n.css(d,"marginTop",!0),left:b.left-c.left-n.css(d,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent;while(a&&!n.nodeName(a,"html")&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Pa})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c=/Y/.test(b);n.fn[a]=function(d){return X(this,function(a,d,e){var f=lc(a);if(void 0===e)return f?b in f?f[b]:f.document.documentElement[d]:a[d];f?f.scrollTo(c?n(f).scrollLeft():e,c?e:n(f).scrollTop()):a[d]=e;},a,d,arguments.length,null)};}),n.each(["top","left"],function(a,b){n.cssHooks[b]=Ta(l.pixelPosition,function(a,c){if(c)return c=Ra(a,b),Na.test(c)?n(a).position()[b]+"px":c});}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(!0===d||!0===e?"margin":"border")
    ;return X(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)};});}),n.fn.extend({bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}}),n.fn.size=function(){return this.length},n.fn.andSelf=n.fn.addBack,"function"==typeof undefined;var mc=a.jQuery,nc=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=nc),b&&a.jQuery===n&&(a.jQuery=mc),n},b||(a.jQuery=a.$=n),n});
    jQuery.noConflict();
    });

    const $$4 = jQuery;
    class MapObject {
        constructor(element, mapsvg) {
            this.id = "";
            this.objects = [];
            this.events = new Events(this);
            this.element = element;
            this.mapsvg = mapsvg;
        }
        ;
        getBBox() {
            return new ViewBox(1, 2, 3, 4);
        }
        ;
        getGeoBounds() {
            var bbox = this.getBBox();
            var pointSW = new SVGPoint(bbox[0], (bbox[1] + bbox[3]));
            var pointNE = new SVGPoint((bbox[0] + bbox[2]), bbox[1]);
            var sw = this.mapsvg.convertSVGToGeo(pointSW);
            var ne = this.mapsvg.convertSVGToGeo(pointNE);
            return { sw: sw, ne: ne };
        }
        ;
        getComputedStyle(prop, elem) {
            elem = elem || this.element;
            var _p1 = elem.getAttribute(prop);
            if (_p1) {
                return _p1;
            }
            var _p2 = elem.getAttribute('style');
            if (_p2) {
                var s = _p2.split(';');
                var z = s.filter(function (e) {
                    e = e.trim();
                    var attr = e.split(':');
                    if (attr[0] == prop)
                        return true;
                });
                if (z.length) {
                    return z[0].split(':').pop().trim();
                }
            }
            var parent = elem.parentElement;
            var elemType = parent ? parent.tagName : null;
            if (elemType && elemType != 'svg')
                return this.getComputedStyle(prop, parent);
            else
                return undefined;
        }
        ;
        getStyle(prop) {
            var _p1 = this.attr(prop);
            if (_p1) {
                return _p1;
            }
            var _p2 = this.attr('style');
            if (_p2) {
                var s = _p2.split(';');
                var z = s.filter(function (e) {
                    var e = e.trim();
                    if (e.indexOf(prop) === 0)
                        return e;
                });
                return z.length ? z[0].split(':').pop().trim() : undefined;
            }
            return "";
        }
        ;
        getCenter() {
            var x = this.element.getBoundingClientRect().left;
            var y = this.element.getBoundingClientRect().top;
            var w = this.element.getBoundingClientRect().width;
            var h = this.element.getBoundingClientRect().height;
            var point = new ScreenPoint(x + w / 2, y + h / 2);
            return point;
        }
        ;
        getCenterSVG() {
            var bbox = this.getBBox();
            var point = new SVGPoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
            return point;
        }
        ;
        getCenterLatLng(yShift) {
            yShift = yShift ? yShift : 0;
            var bbox = this.getBBox();
            var x = bbox[0] + bbox[2] / 2;
            var y = bbox[1] + bbox[3] / 2 - yShift;
            var point = new SVGPoint(x, y);
            return this.mapsvg.convertSVGToGeo(point);
        }
        ;
        attr(v1, v2 = null) {
            var svgDom = this.element;
            if (typeof v1 == "object") {
                for (var key in v1) {
                    var item = v1[key];
                    if (typeof item === "string" || typeof item === "number") {
                        svgDom.setAttribute(key, '' + item);
                    }
                }
            }
            else if (typeof v1 == "string" && (typeof v2 == "string" || typeof v2 == "number")) {
                svgDom.setAttribute(v1, '' + v2);
            }
            else if (v2 == undefined) {
                return svgDom.getAttribute(v1);
            }
        }
        ;
        setId(id) {
            if (id !== undefined) {
                this.id = id;
                this.element.setAttribute('id', id);
            }
        }
        ;
    }

    const $$5 = jQuery;
    class Marker extends MapObject {
        constructor(params) {
            super(null, params.mapsvg);
            this.update = function (data) {
                for (var key in data) {
                    var setter = 'set' + MapSVG.ucfirst(key);
                    if (setter in this)
                        this[setter](data[key]);
                }
            };
            this.src = params.location.getMarkerImageUrl();
            var img = $$5('<img src="' + this.src + '" />').addClass('mapsvg-marker');
            this.element = img[0];
            this.location = params.location;
            this.location.marker = this;
            this.mapsvg = params.mapsvg;
            params.object && this.setObject(params.object);
            if (params.width && params.height) {
                this.width = params.width;
                this.height = params.height;
            }
            this.setId(this.mapsvg.markerId());
            this.svgPoint = this.location.svgPoint || this.mapsvg.convertGeoToSVG(this.location.geoPoint);
            this.setImage(this.src);
        }
        setId(id) {
            MapObject.prototype.setId.call(this, id);
            this.mapsvg.markers.reindex();
        }
        ;
        getBBox() {
            var bbox = { x: this.svgPoint.x, y: this.svgPoint.y, width: this.width / this.mapsvg.scale, height: this.height / this.mapsvg.scale };
            bbox = $$5.extend(true, {}, bbox);
            return new ViewBox(bbox);
        }
        ;
        getOptions() {
            var o = {
                id: this.id,
                src: this.src,
                svgPoint: this.svgPoint,
                geoPoint: this.geoPoint
            };
            $$5.each(o, function (key, val) {
                if (val == undefined) {
                    delete o[key];
                }
            });
            return o;
        }
        ;
        setImage(src) {
            if (!src)
                return false;
            var _this = this;
            src = MapSVG.safeURL(src);
            var img = new Image();
            var marker = this;
            this.src = src;
            if (marker.element.getAttribute('src') !== 'src') {
                marker.element.setAttribute('src', src);
            }
            img.onload = function () {
                marker.width = this.width;
                marker.height = this.height;
                _this.adjustPosition();
            };
            img.src = src;
            if (this.location) {
                this.location.setImage(src);
            }
        }
        ;
        setPoint(svgPoint) {
            this.svgPoint = svgPoint;
            if (this.location) {
                this.location.setSvgPoint(this.svgPoint);
            }
            if (this.mapsvg.mapIsGeo) {
                this.geoPoint = this.mapsvg.convertSVGToGeo(this.svgPoint);
                this.location.setGeoPoint(this.geoPoint);
            }
            this.adjustPosition();
            this.events.trigger('change');
        }
        ;
        adjustPosition() {
            var _this = this;
            var pos = _this.mapsvg.convertSVGToPixel(this.svgPoint);
            if (pos.x > 30000000) {
                this.element.style.left = pos.x - 30000000 + 'px';
                pos.x = 30000000;
                if (this.textLabel) {
                    this.textLabel.style.left = pos.x - 30000000 + 'px';
                }
            }
            else {
                this.element.style.left = '0';
            }
            if (pos.y > 30000000) {
                this.element.style.top = pos.y - 30000000 + 'px';
                pos.y = 30000000;
                if (this.textLabel) {
                    this.textLabel.style.top = pos.y - 30000000 + 'px';
                }
            }
            else {
                this.element.style.top = '0';
            }
            pos.x -= this.width / 2;
            pos.y -= !this.centered ? this.height : this.height / 2;
            pos.x = Math.round(pos.x);
            pos.y = Math.round(pos.y);
            this.element.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
            if (this.textLabel) {
                var x = Math.round(pos.x + this.width / 2 - $$5(this.textLabel).outerWidth() / 2);
                var y = Math.round(pos.y - $$5(this.textLabel).outerHeight());
                this.textLabel.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            }
        }
        ;
        drag(startCoords, scale, endCallback, clickCallback) {
            var _this = this;
            this.svgPointBeforeDrag = new SVGPoint(this.svgPoint.x, this.svgPoint.y);
            $$5('body').on('mousemove.drag.mapsvg', function (e) {
                e.preventDefault();
                $$5(_this.mapsvg.containers.map).addClass('no-transitions');
                var mouseNew = MapSVG.mouseCoords(e);
                var dx = mouseNew.x - startCoords.x;
                var dy = mouseNew.y - startCoords.y;
                var newSvgPoint = new SVGPoint(_this.svgPointBeforeDrag.x + dx / scale, _this.svgPointBeforeDrag.y + dy / scale);
                _this.setPoint(newSvgPoint);
            });
            $$5('body').on('mouseup.drag.mapsvg', function (e) {
                e.preventDefault();
                _this.undrag();
                var mouseNew = MapSVG.mouseCoords(e);
                var dx = mouseNew.x - startCoords.x;
                var dy = mouseNew.y - startCoords.y;
                var newSvgPoint = new SVGPoint(_this.svgPointBeforeDrag.x + dx / scale, _this.svgPointBeforeDrag.y + dy / scale);
                _this.setPoint(newSvgPoint);
                endCallback.call(_this);
                if (_this.svgPointBeforeDrag.x == _this.svgPoint.x && _this.svgPointBeforeDrag.y == _this.svgPoint.y)
                    clickCallback.call(_this);
            });
        }
        ;
        undrag() {
            $$5('body').off('.drag.mapsvg');
            $$5(this.mapsvg.containers.map).removeClass('no-transitions');
        }
        ;
        delete() {
            if (this.textLabel) {
                this.textLabel.remove();
                this.textLabel = null;
            }
            $$5(this.element).empty().remove();
            this.mapsvg.markerDelete(this);
        }
        ;
        setObject(obj) {
            this.object = obj;
            $$5(this.element).attr('data-object-id', this.object.id);
        }
        ;
        hide() {
            $$5(this.element).addClass('mapsvg-marker-hidden');
            if (this.textLabel) {
                $$5(this.textLabel).hide();
            }
        }
        ;
        show() {
            $$5(this.element).removeClass('mapsvg-marker-hidden');
            if (this.textLabel) {
                $$5(this.textLabel).show();
            }
        }
        ;
        highlight() {
            $$5(this.element).addClass('mapsvg-marker-hover');
        }
        ;
        unhighlight() {
            $$5(this.element).removeClass('mapsvg-marker-hover');
        }
        ;
        select() {
            this.selected = true;
            $$5(this.element).addClass('mapsvg-marker-active');
        }
        ;
        deselect() {
            this.selected = false;
            $$5(this.element).removeClass('mapsvg-marker-active');
        }
        ;
    }

    const $$6 = jQuery;
    class MarkerCluster extends MapObject {
        constructor(options, mapsvg) {
            super(null, mapsvg);
            this.svgPoint = options.svgPoint;
            this.cellX = options.cellX;
            this.cellY = options.cellY;
            this.markers = options.markers || [];
            this.cellSize = 50;
            this.width = 30;
            this.elem = $$6('<div class="mapsvg-marker-cluster">' + this.markers.length + '</div>')[0];
            $$6(this.elem).data("cluster", this);
            if (this.markers.length < 2) {
                $$6(this.elem).hide();
            }
            this.adjustPosition();
        }
        addMarker(marker) {
            this.markers.push(marker);
            if (this.markers.length > 1) {
                if (this.markers.length === 2) {
                    $$6(this.elem).show();
                }
                if (this.markers.length === 2) {
                    var x = this.markers.map(function (m) {
                        return m.svgPoint.x;
                    });
                    this.min_x = Math.min.apply(null, x);
                    this.max_x = Math.max.apply(null, x);
                    var y = this.markers.map(function (m) {
                        return m.svgPoint.y;
                    });
                    this.min_y = Math.min.apply(null, y);
                    this.max_y = Math.max.apply(null, y);
                    this.svgPoint.x = this.min_x + ((this.max_x - this.min_x) / 2);
                    this.svgPoint.y = this.min_y + ((this.max_y - this.min_y) / 2);
                }
                if (this.markers.length > 2) {
                    if (marker.svgPoint.x < this.min_x) {
                        this.min_x = marker.svgPoint.x;
                    }
                    else if (marker.svgPoint.x > this.max_x) {
                        this.max_x = marker.svgPoint.x;
                    }
                    if (marker.svgPoint.y < this.min_y) {
                        this.min_y = marker.svgPoint.y;
                    }
                    else if (marker.svgPoint.x > this.max_x) {
                        this.max_y = marker.svgPoint.y;
                    }
                    this.svgPoint.x = this.min_x + ((this.max_x - this.min_x) / 2);
                    this.svgPoint.y = this.min_y + ((this.max_y - this.min_y) / 2);
                }
            }
            else {
                this.svgPoint.x = marker.svgPoint.x;
                this.svgPoint.y = marker.svgPoint.y;
            }
            $$6(this.elem).text(this.markers.length);
            this.adjustPosition();
        }
        canTakeMarker(marker) {
            var _this = this;
            var screenPoint = _this.mapsvg.convertSVGToPixel(marker.svgPoint);
            return (this.cellX === Math.ceil(screenPoint.x / this.cellSize)
                &&
                    this.cellY === Math.ceil(screenPoint.y / this.cellSize));
        }
        destroy() {
            this.markers = null;
            $$6(this.elem).remove();
        }
        adjustPosition() {
            var _this = this;
            var pos = _this.mapsvg.convertSVGToPixel(this.svgPoint);
            if (pos[0] > 30000000) {
                $$6(this.elem)[0].style.left = (pos[0] - 30000000).toString();
                pos[0] = 30000000;
            }
            else {
                $$6(this.elem)[0].style.left = (0).toString();
            }
            if (pos[1] > 30000000) {
                $$6(this.elem)[0].style.top = (pos[1] - 30000000).toString();
                pos[1] = 30000000;
            }
            else {
                $$6(this.elem)[0].style.top = (0).toString();
            }
            pos[0] -= this.width / 2;
            pos[1] -= this.width / 2;
            $$6(this.elem).css({ 'transform': 'translate(' + pos[0] + 'px,' + pos[1] + 'px)' });
        }
        ;
        getBBox() {
            var bbox = {
                x: this.svgPoint.x,
                y: this.svgPoint.y,
                width: this.cellSize / this.mapsvg.getScale(),
                height: this.cellSize / this.mapsvg.getScale()
            };
            bbox = $$6.extend(true, {}, bbox);
            return new ViewBox(bbox.x, bbox.y, bbox.width, bbox.height);
        }
        ;
    }

    const $$7 = jQuery;
    class Region extends MapObject {
        constructor(element, mapsvg) {
            super(element, mapsvg);
            this.id = this.element.getAttribute('id');
            if (this.id && this.mapsvg.options.regionPrefix) {
                this.setId(this.id.replace(this.mapsvg.options.regionPrefix, ''));
            }
            this.id_no_spaces = this.id.replace(/\s/g, '_');
            this.title = this.element.getAttribute('title');
            this.element.setAttribute('class', (this.element.className || '') + ' mapsvg-region');
            this.setStyleInitial();
            var regionOptions = this.mapsvg.options.regions && this.mapsvg.options.regions[this.id] ? this.mapsvg.options.regions[this.id] : null;
            this.disabled = this.getDisabledState();
            this.disabled && this.attr('class', this.attr('class') + ' mapsvg-disabled');
            this.default_attr = {};
            this.selected_attr = {};
            this.hover_attr = {};
            var selected = false;
            if (regionOptions && regionOptions.selected) {
                selected = true;
                delete regionOptions.selected;
            }
            regionOptions && this.update(regionOptions);
            this.setFill();
            if (selected) {
                this.setSelected();
            }
            this.saveState();
        }
        ;
        adjustStroke(scale) {
            $$7(this.element).css({ 'stroke-width': this.style['stroke-width'] / scale });
        }
        setStyleInitial() {
            this.style = { fill: this.getComputedStyle('fill') };
            this.style.stroke = this.getComputedStyle('stroke') || '';
            var w;
            w = this.getComputedStyle('stroke-width');
            w = w ? w.replace('px', '') : '1';
            w = w == "1" ? 1.2 : parseFloat(w);
            this.style['stroke-width'] = w;
        }
        ;
        saveState() {
            this.initialState = JSON.stringify(this.getOptions());
        }
        ;
        getBBox() {
            var _bbox = this.element.getBBox();
            let bbox = new ViewBox(_bbox.x, _bbox.y, _bbox.width, _bbox.height);
            var matrix = this.element.getTransformToElement(this.mapsvg.containers.svg);
            var x2 = bbox.x + bbox.width;
            var y2 = bbox.y + bbox.height;
            var position = this.mapsvg.containers.svg.createSVGPoint();
            position.x = bbox.x;
            position.y = bbox.y;
            position = position.matrixTransform(matrix);
            bbox.x = position.x;
            bbox.y = position.y;
            position.x = x2;
            position.y = y2;
            position = position.matrixTransform(matrix);
            bbox.width = position.x - bbox.x;
            bbox.height = position.y - bbox.y;
            return bbox;
        }
        ;
        changed() {
            return JSON.stringify(this.getOptions()) != this.initialState;
        }
        ;
        edit() {
            this.elemOriginal = $$7(this.element).clone()[0];
        }
        ;
        editCommit() {
            this.elemOriginal = null;
        }
        ;
        editCancel() {
            this.mapsvg.containers.svg.appendChild(this.elemOriginal);
            this.element = this.elemOriginal;
            this.elemOriginal = null;
        }
        ;
        getOptions(forTemplate) {
            let o;
            o = {
                id: this.id,
                id_no_spaces: this.id_no_spaces,
                title: this.title,
                fill: this.mapsvg.options.regions[this.id] && this.mapsvg.options.regions[this.id].fill,
                data: this.data,
                gaugeValue: this.gaugeValue
            };
            if (forTemplate) {
                o.disabled = this.disabled;
                o.dataCounter = (this.data && this.data.length) || 0;
            }
            for (var key in o) {
                if (typeof o[key] === 'undefined') {
                    delete o[key];
                }
            }
            if (this.customAttrs) {
                var that = this;
                this.customAttrs.forEach(function (attr) {
                    o[attr] = that[attr];
                });
            }
            return o;
        }
        ;
        forTemplate() {
            var data = {
                id: this.id,
                title: this.title,
                objects: this.objects,
                data: this.data
            };
            for (var key in this.data) {
                if (key != 'title' && key != 'id')
                    data[key] = this.data[key];
            }
            return data;
        }
        ;
        getData() {
            return this.forTemplate();
        }
        update(options) {
            for (var key in options) {
                var setter = 'set' + MapSVG.ucfirst(key);
                if (setter in this)
                    this[setter](options[key]);
                else {
                    this[key] = options[key];
                    this.customAttrs = this.customAttrs || [];
                    this.customAttrs.push(key);
                }
            }
        }
        ;
        setTitle(title) {
            this.title = title;
        }
        ;
        setStyle(style) {
            $$7.extend(true, this.style, style);
            this.setFill();
        }
        ;
        getChoroplethColor() {
            var o = this.mapsvg.options.gauge;
            var w = (parseFloat(this.data[this.mapsvg.options.regionChoroplethField]) - o.min) / o.maxAdjusted;
            return {
                r: Math.round(o.colors.diffRGB.r * w + o.colors.lowRGB.r),
                g: Math.round(o.colors.diffRGB.g * w + o.colors.lowRGB.g),
                b: Math.round(o.colors.diffRGB.b * w + o.colors.lowRGB.b),
                a: (o.colors.diffRGB.a * w + o.colors.lowRGB.a).toFixed(2)
            };
        }
        ;
        setFill(fill) {
            if (this.mapsvg.options.colorsIgnore) {
                $$7(this.element).css(this.style);
                return;
            }
            if (fill) {
                var regions = {};
                regions[this.id] = { fill: fill };
                $$7.extend(true, this.mapsvg.options, { regions: regions });
            }
            else if (!fill && fill !== undefined && this.mapsvg.options.regions && this.mapsvg.options.regions[this.id] && this.mapsvg.options.regions[this.id].fill) {
                delete this.mapsvg.options.regions[this.id].fill;
            }
            if (this.mapsvg.options.gauge.on && this.data && this.data[this.mapsvg.options.regionChoroplethField]) {
                var rgb = this.getChoroplethColor();
                this.default_attr['fill'] = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + rgb.a + ')';
            }
            else if (this.status !== undefined && this.mapsvg.regions && this.mapsvg.regionsRepository.getSchema().getFieldByType('status') && this.mapsvg.regionsRepository.getSchema().getFieldByType('status').optionsDict && this.mapsvg.regionsRepository.getSchema().getFieldByType('status').optionsDict[this.status] && this.mapsvg.regionsRepository.getSchema().getFieldByType('status').optionsDict[this.status].color) {
                this.default_attr['fill'] = this.mapsvg.regionsRepository.getSchema().getFieldByType('status').optionsDict[this.status].color;
            }
            else if (this.mapsvg.options.regions[this.id] && this.mapsvg.options.regions[this.id].fill) {
                this.default_attr['fill'] = this.mapsvg.options.regions[this.id].fill;
            }
            else if (this.mapsvg.options.colors.base) {
                this.default_attr['fill'] = this.mapsvg.options.colors.base;
            }
            else if (this.style.fill != 'none') {
                this.default_attr['fill'] = this.style.fill ? this.style.fill : this.mapsvg.options.colors.baseDefault;
            }
            else {
                this.default_attr['fill'] = 'none';
            }
            if (MapSVG.isNumber(this.mapsvg.options.colors.selected))
                this.selected_attr['fill'] = tinycolor(this.default_attr.fill).lighten(parseFloat('' + this.mapsvg.options.colors.selected)).toRgbString();
            else
                this.selected_attr['fill'] = this.mapsvg.options.colors.selected;
            if (MapSVG.isNumber(this.mapsvg.options.colors.hover))
                this.hover_attr['fill'] = tinycolor(this.default_attr.fill).lighten(parseFloat('' + this.mapsvg.options.colors.hover)).toRgbString();
            else
                this.hover_attr['fill'] = this.mapsvg.options.colors.hover;
            $$7(this.element).css('fill', this.default_attr['fill']);
            this.fill = this.default_attr['fill'];
            if (this.style.stroke != 'none' && this.mapsvg.options.colors.stroke != undefined) {
                $$7(this.element).css('stroke', this.mapsvg.options.colors.stroke);
            }
            else {
                var s = this.style.stroke == undefined ? '' : this.style.stroke;
                $$7(this.element).css('stroke', s);
            }
            if (this.selected)
                this.setSelected();
        }
        ;
        setDisabled(on, skipSetFill) {
            on = on !== undefined ? MapSVG.parseBoolean(on) : this.getDisabledState();
            var prevDisabled = this.disabled;
            this.disabled = on;
            this.attr('class', this.attr('class').replace('mapsvg-disabled', ''));
            if (on) {
                this.attr('class', this.attr('class') + ' mapsvg-disabled');
            }
            if (this.disabled != prevDisabled)
                this.mapsvg.deselectRegion(this);
            !skipSetFill && this.setFill();
        }
        ;
        setStatus(status) {
            var statusOptions = this.mapsvg.options.regionStatuses && this.mapsvg.options.regionStatuses[status];
            if (statusOptions) {
                this.status = status;
                this.data.status = status;
                this.setDisabled(statusOptions.disabled, true);
            }
            else {
                this.status = undefined;
                this.data.status = undefined;
                this.setDisabled(false, true);
            }
            this.setFill();
        }
        ;
        setSelected() {
            this.mapsvg.selectRegion(this);
        }
        ;
        setGaugeValue(val) {
            if ($$7.isNumeric(val)) {
                if (typeof val === 'string') {
                    val = parseFloat(val);
                }
                this.gaugeValue = val;
            }
            else {
                this.gaugeValue = undefined;
            }
        }
        ;
        getDisabledState(asDefault) {
            var opts = this.mapsvg.options.regions[this.id];
            if (!asDefault && opts && opts.disabled !== undefined) {
                return opts.disabled;
            }
            else {
                return this.mapsvg.options.disableAll || this.style.fill === 'none' || this.id == 'labels' || this.id == 'Labels';
            }
        }
        ;
        highlight() {
            $$7(this.element).css({ 'fill': this.hover_attr.fill });
            $$7(this.element).addClass('mapsvg-region-hover');
        }
        ;
        unhighlight() {
            $$7(this.element).css({ 'fill': this.default_attr.fill });
            $$7(this.element).removeClass('mapsvg-region-hover');
        }
        ;
        select() {
            $$7(this.element).css({ 'fill': this.selected_attr.fill });
            this.selected = true;
            $$7(this.element).addClass('mapsvg-region-active');
        }
        ;
        deselect() {
            $$7(this.element).css({ 'fill': this.default_attr.fill });
            this.selected = false;
            $$7(this.element).removeClass('mapsvg-region-active');
        }
        ;
        setData(data) {
            this.data = data;
        }
        ;
    }

    class SchemaRepository extends Repository {
        constructor() {
            let objectName = 'schema';
            super(objectName, +objectName + 's');
            this.className = 'Schema';
            this.objectNameSingle = objectName;
            this.objectNameMany = objectName + 's';
            this.path = objectName + 's/';
            this.events = new Events(this);
        }
        create(schema) {
            let defer = jQuery.Deferred();
            defer.promise();
            let data = {};
            data[this.objectNameSingle] = this.encodeData(schema);
            this.server.post(this.path, data).done((response) => {
                let data = this.decodeData(response);
                schema.id = data[this.objectNameSingle].id;
                this.objects.push(schema);
                this.events.trigger('created');
                schema.events.trigger('created');
                defer.resolve(schema);
            }).fail(() => { defer.reject(); });
            return defer;
        }
        update(schema) {
            let defer = jQuery.Deferred();
            defer.promise();
            let data = {};
            data[this.objectNameSingle] = this.encodeData(schema);
            this.server.put(this.path + schema.id, data).done((response) => {
                let data = this.decodeData(response);
                this.objects.push(schema);
                defer.resolve(schema);
                this.events.trigger('changed');
                schema.events.trigger('changed');
            }).fail(() => { defer.reject(); });
            return defer;
        }
        encodeData(schema) {
            let _schema = schema.getData();
            let fieldsJsonString = JSON.stringify(_schema);
            fieldsJsonString = fieldsJsonString.replace(/select/g, "!mapsvg-encoded-slct");
            fieldsJsonString = fieldsJsonString.replace(/table/g, "!mapsvg-encoded-tbl");
            fieldsJsonString = fieldsJsonString.replace(/database/g, "!mapsvg-encoded-db");
            fieldsJsonString = fieldsJsonString.replace(/varchar/g, "!mapsvg-encoded-vc");
            return JSON.parse(fieldsJsonString);
        }
    }

    const $$8 = jQuery;
    class Controller {
        constructor(options) {
            this.containers = {
                main: options.container
            };
            this.mapsvg = options.mapsvg;
            this.template = options.template;
            this.scrollable = options.scrollable === undefined ? true : options.scrollable;
            this.withToolbar = options.withToolbar === undefined ? true : options.withToolbar;
            this.autoresize = MapSVG.parseBoolean(options.autoresize);
            this.templates = {
                toolbar: Handlebars.compile(this.getToolbarTemplate()),
                main: this.getMainTemplate()
            };
            this.data = options.data;
            this.width = options.width;
            this.color = options.color;
            this.events = new Events(this);
            if (options.events) {
                for (let eventName in options.events) {
                    if (typeof options.events[eventName] === 'function') {
                        this.events.on(eventName, options.events[eventName]);
                    }
                }
            }
        }
        viewDidLoad() {
            var _this = this;
            _this.updateScroll();
            if (this.autoresize) {
                _this.adjustHeight();
                this.resizeSensor.setScroll();
            }
        }
        _viewDidLoad() {
            this.updateScroll();
        }
        viewDidAppear() { }
        viewDidDisappear() { }
        updateScroll() {
            if (!this.scrollable)
                return;
            var _this = this;
            $$8(this.containers.contentWrap).nanoScroller({ preventPageScrolling: true, iOSNativeScrolling: true });
            setTimeout(function () {
                $$8(_this.containers.contentWrap).nanoScroller({ preventPageScrolling: true, iOSNativeScrolling: true });
            }, 300);
        }
        adjustHeight() {
            var _this = this;
            $$8(_this.containers.main).height($$8(_this.containers.main).find('.mapsvg-auto-height').outerHeight() + (_this.containers.toolbar ? $$8(_this.containers.toolbar).outerHeight() : 0));
        }
        _init() {
            var _this = this;
            _this.render();
            _this.init();
        }
        init() { }
        getToolbarTemplate() {
            return '';
        }
        getMainTemplate() {
            return this.template;
        }
        render() {
            var _this = this;
            this.containers.view = $$8('<div />').attr('id', 'mapsvg-controller-' + this.name).addClass('mapsvg-controller-view')[0];
            this.containers.contentWrap = $$8('<div />').addClass('mapsvg-controller-view-wrap')[0];
            this.containers.contentWrap2 = $$8('<div />')[0];
            this.containers.sizer = $$8('<div />').addClass('mapsvg-auto-height')[0];
            this.containers.contentView = $$8('<div />').addClass('mapsvg-controller-view-content')[0];
            this.containers.sizer.appendChild(this.containers.contentView);
            if (this.scrollable) {
                $$8(this.containers.contentWrap).addClass('nano');
                $$8(this.containers.contentWrap2).addClass('nano-content');
            }
            this.containers.contentWrap.appendChild(this.containers.contentWrap2);
            this.containers.contentWrap2.appendChild(this.containers.sizer);
            if (this.withToolbar && this.templates.toolbar) {
                this.containers.toolbar = $$8('<div />').addClass('mapsvg-controller-view-toolbar')[0];
                this.containers.view.appendChild(this.containers.toolbar);
            }
            this.containers.view.append(this.containers.contentWrap);
            this.containers.main.appendChild(this.containers.view);
            $$8(this.containers.main).data('controller', this);
            if (this.width)
                this.containers.view.style.width = this.width;
            if (this.color)
                this.containers.view.style['background-color'] = this.color;
            _this.viewReadyToFill();
            this.redraw();
            setTimeout(function () {
                _this._viewDidLoad();
                _this.viewDidLoad();
                _this.setEventHandlersCommon();
                _this.setEventHandlers();
            }, 1);
        }
        viewReadyToFill() {
            var _this = this;
            if (_this.autoresize) {
                _this.resizeSensor = new ResizeSensor(this.containers.sizer[0], function () {
                    _this.adjustHeight();
                    _this.updateScroll();
                    _this.events.trigger('resize', _this, [_this.mapsvg]);
                });
            }
        }
        redraw(data) {
            if (data !== undefined) {
                this.data = data;
            }
            try {
                $$8(this.containers.contentView).html(this.templates.main(this.data));
            }
            catch (err) {
                console.error(err);
                $$8(this.containers.contentView).html("");
            }
            if (this.withToolbar && this.templates.toolbar)
                $$8(this.containers.toolbar).html(this.templates.toolbar(this.data));
            this.updateTopShift();
            if (this.noPadding)
                this.containers.contentView.style.padding = '0';
            this.updateScroll();
        }
        updateTopShift() {
            var _this = this;
            if (!this.withToolbar)
                return;
            $$8(_this.containers.contentWrap).css({ 'top': $$8(_this.containers.toolbar).outerHeight(true) + 'px' });
            setTimeout(function () {
                $$8(_this.containers.contentWrap).css({ 'top': $$8(_this.containers.toolbar).outerHeight(true) + 'px' });
            }, 100);
            setTimeout(function () {
                $$8(_this.containers.contentWrap).css({ 'top': $$8(_this.containers.toolbar).outerHeight(true) + 'px' });
            }, 200);
            setTimeout(function () {
                $$8(_this.containers.contentWrap).css({ 'top': $$8(_this.containers.toolbar).outerHeight(true) + 'px' });
                _this.updateScroll();
            }, 500);
        }
        ;
        setEventHandlersCommon() { }
        setEventHandlers() { }
        destroy() {
            delete this.resizeSensor;
            $$8(this.containers.view).empty().remove();
        }
    }

    const $$9 = jQuery;
    class DirectoryController extends Controller {
        constructor(options) {
            super(options);
            this.repository = options.repository;
            this.noPadding = true;
            this.position = options.position;
            this.search = options.search;
        }
        getToolbarTemplate() {
            var t = '<div class="mapsvg-directory-search-wrap">';
            t += '<div class="mapsvg-directory-filter-wrap filter-wrap"></div>';
            t += '</div>';
            t += '</div>';
            return t;
        }
        ;
        viewDidLoad() {
            var _this = this;
            this.menuBtn = $$9('<div class="mapsvg-button-menu"><i class="mapsvg-icon-menu"></i> ' + this.mapsvg.options.mobileView.labelList + '</div>')[0];
            this.mapBtn = $$9('<div class="mapsvg-button-map"><i class="mapsvg-icon-map"></i> ' + this.mapsvg.options.mobileView.labelMap + '</div>')[0];
            if (MapSVG.isPhone && _this.mapsvg.options.menu.hideOnMobile) {
                if (this.mapsvg.options.menu.showFirst == 'map') {
                    this.toggle(false);
                }
                else {
                    this.toggle(true);
                }
            }
            this.mobileButtons = $$9('<div class="mapsvg-mobile-buttons"></div>')[0];
            this.mobileButtons.append(this.menuBtn, this.mapBtn);
            if (this.mapsvg.options.menu.on !== false) {
                this.mapsvg.containers.wrapAll.appendChild(this.mobileButtons);
            }
            this.events.trigger('shown', this.containers.view);
        }
        ;
        setEventHandlers() {
            var _this = this;
            $$9(window).on('resize', function () {
                _this.updateTopShift();
            });
            $$9(this.menuBtn).on('click', function () {
                _this.toggle(true);
            });
            $$9(this.mapBtn).on('click', function () {
                _this.toggle(false);
                _this.mapsvg.redraw();
            });
            $$9(this.containers.view).on('click.menu.mapsvg', '.mapsvg-directory-item', function (e) {
                e.preventDefault();
                var objID = $$9(this).data('object-id');
                var regions;
                var marker;
                var detailsViewObject;
                var eventObject;
                _this.deselectItems();
                _this.selectItems(objID);
                if (MapSVG.isPhone && _this.mapsvg.options.menu.showMapOnClick) {
                    _this.toggle(false);
                }
                if (_this.mapsvg.options.menu.source == 'regions') {
                    regions = [_this.mapsvg.getRegion(objID)];
                    eventObject = regions[0];
                    detailsViewObject = regions[0];
                }
                else {
                    detailsViewObject = _this.repository.getLoadedObject(objID);
                    eventObject = detailsViewObject;
                    var _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                    if (_regions) {
                        regions = _regions.map(function (region) {
                            return _this.mapsvg.getRegion(region.id);
                        }).filter(function (r) {
                            return r !== undefined;
                        });
                    }
                }
                if (detailsViewObject.location && detailsViewObject.location.marker)
                    marker = detailsViewObject.location.marker;
                if (_this.mapsvg.options.actions.directoryItem.click.showDetails) {
                    _this.mapsvg.loadDetailsView(detailsViewObject);
                }
                if (regions && regions.length > 0) {
                    if (_this.mapsvg.options.actions.directoryItem.click.zoom) {
                        _this.mapsvg.zoomTo(regions, _this.mapsvg.options.actions.directoryItem.click.zoomToLevel);
                    }
                    if (regions.length > 1) {
                        _this.mapsvg.setMultiSelect(true);
                    }
                    regions.forEach(function (region) {
                        var center = region.getCenter();
                        e.clientX = center[0];
                        e.clientY = center[1];
                        if (_this.mapsvg.options.actions.directoryItem.click.selectRegion) {
                            _this.mapsvg.selectRegion(region, true);
                        }
                        if (_this.mapsvg.options.actions.directoryItem.click.showRegionPopover) {
                            if (_this.mapsvg.options.actions.directoryItem.click.zoom) {
                                setTimeout(function () {
                                    _this.mapsvg.showPopover(region);
                                }, 500);
                            }
                            else {
                                _this.mapsvg.showPopover(region);
                            }
                        }
                        if (_this.mapsvg.options.actions.directoryItem.click.fireRegionOnClick) {
                            _this.mapsvg.events.trigger('click.region', region, [region]);
                        }
                    });
                    if (regions.length > 1) {
                        _this.mapsvg.setMultiSelect(false, false);
                    }
                }
                if (marker) {
                    if (_this.mapsvg.options.actions.directoryItem.click.zoomToMarker) {
                        _this.mapsvg.zoomTo(marker, _this.mapsvg.options.actions.directoryItem.click.zoomToMarkerLevel);
                    }
                    if (_this.mapsvg.options.actions.directoryItem.click.showMarkerPopover) {
                        if (_this.mapsvg.options.actions.directoryItem.click.zoomToMarker) {
                            setTimeout(function () {
                                _this.mapsvg.showPopover(detailsViewObject);
                            }, 500);
                        }
                        else {
                            _this.mapsvg.showPopover(detailsViewObject);
                        }
                    }
                    if (_this.mapsvg.options.actions.directoryItem.click.fireMarkerOnClick) {
                        _this.mapsvg.events.trigger('click.marker', marker, [e, _this.mapsvg]);
                    }
                    _this.mapsvg.selectMarker(marker);
                }
                _this.events.trigger('click', this, [e, eventObject, _this.mapsvg]);
                var actions = _this.mapsvg.options.actions;
                if (actions.directoryItem.click.goToLink) {
                    var linkParts = actions.directoryItem.click.linkField.split('.');
                    var url;
                    if (linkParts.length > 1) {
                        var obj = linkParts.shift();
                        var attr = '.' + linkParts.join('.');
                        if (obj == 'Region') {
                            if (regions[0] && regions[0].data)
                                url = eval('regions[0].data' + attr);
                        }
                        else {
                            if (detailsViewObject)
                                url = eval('detailsViewObject' + attr);
                        }
                        if (url) {
                            if (actions.directoryItem.click.newTab) {
                                var win = window.open(url, '_blank');
                                win.focus();
                            }
                            else {
                                window.location.href = url;
                            }
                        }
                    }
                }
                if (actions.directoryItem.click.showAnotherMap) {
                    if (_this.mapsvg.editMode) {
                        alert('"Show another map" action is disabled in the preview');
                        return true;
                    }
                    var linkParts2 = actions.directoryItem.click.showAnotherMapField.split('.');
                    if (linkParts2.length > 1) {
                        var obj2 = linkParts2.shift();
                        var attr2 = '.' + linkParts2.join('.');
                        var map_id;
                        if (obj2 == 'Region') {
                            if (regions[0] && regions[0].data)
                                map_id = eval('regions[0].data' + attr2);
                        }
                        else {
                            if (detailsViewObject)
                                map_id = eval('detailsViewObject' + attr2);
                        }
                        if (map_id) {
                            var container = actions.directoryItem.click.showAnotherMapContainerId ? $$9('#' + actions.directoryItem.click.showAnotherMapContainerId)[0] : $$9(_this.mapsvg.containers.map)[0];
                            _this.mapsvg.loadMap(map_id, container);
                        }
                    }
                }
            }).on('mouseover.menu.mapsvg', '.mapsvg-directory-item', function (e) {
                var objID = $$9(this).data('object-id');
                var regions;
                var detailsViewObject;
                var eventObject;
                var marker;
                if (_this.mapsvg.options.menu.source == 'regions') {
                    regions = [_this.mapsvg.getRegion(objID)];
                    eventObject = regions[0];
                    detailsViewObject = regions[0];
                }
                else {
                    detailsViewObject = _this.repository.getLoadedObject(objID);
                    eventObject = detailsViewObject;
                    var _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                    if (_regions) {
                        regions = _regions.map(function (region) {
                            return _this.mapsvg.getRegion(region.id);
                        });
                    }
                    if (detailsViewObject.location) {
                        marker = detailsViewObject.location.marker;
                    }
                }
                if (regions && regions.length) {
                    _this.mapsvg.highlightRegions(regions);
                }
                if (marker) {
                    _this.mapsvg.highlightMarker(marker);
                    if (_this.mapsvg.options.actions.directoryItem.hover.centerOnMarker) {
                        _this.mapsvg.centerOn(marker);
                    }
                }
                _this.events.trigger('mouseover', $$9(this), [e, eventObject, _this.mapsvg]);
            }).on('mouseout.menu.mapsvg', '.mapsvg-directory-item', function (e) {
                var objID = $$9(this).data('object-id');
                var regions;
                var detailsViewObject;
                var eventObject;
                var marker;
                if (_this.mapsvg.options.menu.source == 'regions') {
                    regions = [_this.mapsvg.getRegion(objID)];
                    eventObject = regions[0];
                    detailsViewObject = regions[0];
                }
                else {
                    detailsViewObject = _this.repository.getLoadedObject(objID);
                    eventObject = detailsViewObject;
                    var _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                    if (_regions) {
                        regions = _regions.map(function (region) {
                            return _this.mapsvg.getRegion(region.id);
                        });
                    }
                    if (detailsViewObject.location) {
                        marker = detailsViewObject.location.marker;
                    }
                }
                if (regions && regions.length) {
                    _this.mapsvg.unhighlightRegions();
                }
                if (marker) {
                    _this.mapsvg.unhighlightMarker();
                }
                _this.events.trigger('mouseout', $$9(this), [e, eventObject, _this.mapsvg]);
            });
            $$9(this.containers.contentView).on('click', '.mapsvg-category-item', function () {
                var panel = $$9(this).next('.mapsvg-category-block');
                if (panel[0].style.maxHeight || panel.hasClass('active')) {
                    panel[0].style.maxHeight = null;
                }
                else {
                    panel[0].style.maxHeight = panel[0].scrollHeight + "px";
                }
                if ($$9(this).hasClass('active')) {
                    $$9(this).toggleClass('active', false);
                    $$9(this).next('.mapsvg-category-block').addClass('collapsed').removeClass('active');
                }
                else {
                    if (_this.mapsvg.options.menu.categories.collapseOther) {
                        $$9(this).parent().find('.mapsvg-category-item.active').removeClass('active');
                        $$9(this).parent().find('.mapsvg-category-block.active').removeClass('active').addClass('collapsed');
                    }
                    $$9(this).toggleClass('active', true);
                    $$9(this).next('.mapsvg-category-block').removeClass('collapsed').addClass('active');
                }
                var panels = $$9('.mapsvg-category-block.collapsed');
                panels.each(function (i, panel) {
                    panel.style.maxHeight = null;
                });
            });
        }
        highlightItems(ids) {
            var _this = this;
            if (typeof ids != 'object')
                ids = [ids];
            ids.forEach(function (id) {
                $$9(_this.containers.view).find('#mapsvg-directory-item-' + id).addClass('hover');
            });
        }
        unhighlightItems() {
            $$9(this.containers.view).find('.mapsvg-directory-item').removeClass('hover');
        }
        selectItems(ids) {
            var _this = this;
            if (typeof ids != 'object')
                ids = [ids];
            ids.forEach(function (id) {
                $$9(_this.containers.view).find('#mapsvg-directory-item-' + id).addClass('selected');
            });
            if ($$9('#mapsvg-directory-item-' + ids[0]).length > 0) {
                _this.scrollable && $$9(_this.containers.contentWrap).nanoScroller({ scrollTo: $$9('#mapsvg-directory-item-' + ids[0]) });
            }
        }
        deselectItems() {
            $$9(this.containers.view).find('.mapsvg-directory-item').removeClass('selected');
        }
        removeItems(ids) {
            $$9(this.containers.view).find('#mapsvg-directory-item-' + ids).remove();
        }
        filterOut(items) {
            return items;
        }
        loadItemsToDirectory() {
            var items = [];
            var _this = this;
            if (!_this.repository.loaded)
                return false;
            if (_this.mapsvg.options.menu.categories && _this.mapsvg.options.menu.categories.on && _this.mapsvg.options.menu.categories.groupBy) {
                var categoryField = _this.mapsvg.options.menu.categories.groupBy;
                if (_this.repository.getSchema().getField(categoryField) === undefined || _this.repository.getSchema().getField(categoryField).options === undefined) {
                    return false;
                }
                var categories = _this.repository.getSchema().getField(categoryField).options;
                categories.forEach(function (category) {
                    var dbItems = _this.repository.getLoaded();
                    dbItems = _this.filterOut(dbItems);
                    let itemArr = [];
                    dbItems.forEach((item) => {
                        itemArr.push(item);
                    });
                    var catItems = itemArr.filter(function (object) {
                        if (categoryField === 'regions') {
                            var objectRegionIDs = object[categoryField].map(function (region) {
                                return region.id;
                            });
                            return objectRegionIDs.indexOf(category.id) !== -1;
                        }
                        else {
                            return parseInt(object[categoryField]) === parseInt(category.value);
                        }
                    });
                    category.counter = catItems.length;
                    if (categoryField === 'regions') {
                        category.label = category.title;
                        category.value = category.id;
                    }
                    items.push({ category: category, items: catItems });
                });
                if (_this.mapsvg.options.menu.categories.hideEmpty) {
                    items = items.filter(function (item) {
                        return item.category.counter > 0;
                    });
                }
            }
            else {
                if (_this.mapsvg.options.menu.source === 'regions') {
                    items = _this.repository.getLoaded().map(r => {
                        let data = r.getData();
                        data.objects = _this.mapsvg.getRegion(data.id).objects;
                        return data;
                    });
                }
                else {
                    items = _this.repository.getLoaded().map(r => r.getData(_this.mapsvg.regionsRepository.schema.name));
                }
            }
            try {
                $$9(this.containers.contentView).html(this.templates.main({ 'items': items }));
            }
            catch (err) {
                console.error('MapSVG: Error in the "Directory item" template');
                console.error(err);
            }
            if (items.length === 0) {
                $$9(this.containers.contentView).html('<div class="mapsvg-no-results">' + this.mapsvg.options.menu.noResultsText + '</div>');
            }
            if (_this.mapsvg.options.menu.categories.on) {
                if (_this.mapsvg.options.menu.categories.collapse && items.length > 1) {
                    $$9(this.containers.contentView).find('.mapsvg-category-block').addClass('collapsed');
                }
                else if (_this.mapsvg.options.menu.categories.collapse && items.length === 1) {
                    $$9(this.containers.contentView).find('.mapsvg-category-item').addClass('active');
                    $$9(this.containers.contentView).find('.mapsvg-category-block').addClass('active');
                    var panel = $$9(this.containers.contentView).find('.mapsvg-category-block')[0];
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
                else if (!_this.mapsvg.options.menu.categories.collapse) {
                    $$9(this.containers.contentView).find('.mapsvg-category-item').addClass('active');
                    $$9(this.containers.contentView).find('.mapsvg-category-block').addClass('active');
                    var panels = $$9(this.containers.contentView).find('.mapsvg-category-block');
                    panels.each(function (i, panel) {
                        panel.style.maxHeight = panel.scrollHeight + "px";
                    });
                }
            }
            this.updateTopShift();
            this.updateScroll();
        }
        toggle(on) {
            var _this = this;
            if (on) {
                $$9(this.containers.main).parent().show();
                $$9(_this.mapsvg.containers.mapContainer).hide();
                $$9(this.menuBtn).addClass('active');
                $$9(this.mapBtn).removeClass('active');
            }
            else {
                $$9(this.containers.main).parent().hide();
                $$9(_this.mapsvg.containers.mapContainer).show();
                $$9(this.menuBtn).removeClass('active');
                $$9(this.mapBtn).addClass('active');
            }
            if (!$$9(this.containers.main).parent().is(':visible')) {
                if (MapSVG.isPhone) {
                    $$9(_this.mapsvg.containers.wrap).css('height', 'auto');
                    _this.updateScroll();
                }
            }
            else {
                if (MapSVG.isPhone && $$9(this.containers.main).height() < parseInt(this.mapsvg.options.menu.minHeight)) {
                    $$9(_this.mapsvg.containers.wrap).css('height', parseInt(this.mapsvg.options.menu.minHeight) + 'px');
                    _this.updateScroll();
                }
            }
            this.updateTopShift();
        }
        addPagination(pager) {
            $$9(this.containers.contentView).append('<div class="mapsvg-pagination-container"></div>');
            $$9(this.containers.contentView).find('.mapsvg-pagination-container').html(pager);
        }
    }

    const $$a = jQuery;
    class DetailsController extends Controller {
        constructor(options) {
            super(options);
            this.modal = options.modal;
        }
        getToolbarTemplate() {
            if (this.withToolbar)
                return '<div class="mapsvg-popover-close mapsvg-details-close"></div>';
            else
                return '';
        }
        ;
        viewDidLoad() {
            var _this = this;
            this.events.trigger('shown', _this, [_this.mapsvg]);
            if (this.modal && MapSVG.isPhone && this.mapsvg.options.detailsView.mobileFullscreen && !this.mobileCloseBtn) {
                this.mobileCloseBtn = $$a('<button class="mapsvg-mobile-modal-close mapsvg-btn">' + _this.mapsvg.options.mobileView.labelClose + '</button>')[0];
                this.containers.view.appendChild(this.mobileCloseBtn);
            }
        }
        ;
        setEventHandlers() {
            var _this = this;
            $$a(this.containers.toolbar).on('click', '.mapsvg-popover-close, .mapsvg-mobile-modal-close', function (e) {
                e.stopPropagation();
                _this.destroy();
                _this.events.trigger('closed', _this, [_this.mapsvg]);
            });
        }
    }

    const $$b = jQuery;
    class FormElement {
        constructor(options, formBuilder, external) {
            this.readonly = typeof options.readonly !== 'undefined' ? options.readonly : false;
            this.protected = typeof options.protected !== 'undefined' ? options.protected : false;
            this.auto_increment = typeof options.auto_increment !== 'undefined' ? options.auto_increment : false;
            this.not_null = typeof options.not_null !== 'undefined' ? options.not_null : false;
            this.searchable = typeof options.searchable !== 'undefined' ? options.searchable : false;
            this.visible = typeof options.visible !== 'undefined' ? options.visible : false;
            this.formBuilder = formBuilder;
            this.events = new Events(this);
            this.type = options.type;
            this.value = options.value;
            this.db_type = options.db_type || 'varchar(255)';
            this.label = this.label || (options.label === undefined ? 'Label' : options.label);
            this.name = this.name || options.name || 'label';
            this.help = options.help || '';
            this.placeholder = options.placeholder;
            this.mapIsGeo = external.mapIsGeo;
            this.editMode = external.editMode;
            this.filtersMode = external.filtersMode;
            this.namespace = external.namespace;
            this.external = external;
            var t = this.type;
            if (t === 'marker' && this.mapIsGeo) {
                t = 'marker-geo';
            }
            if (t === 'location' && this.mapIsGeo) {
                t = 'location-geo';
            }
            if (this.filtersMode) {
                this.parameterName = options.parameterName || '';
                this.parameterNameShort = this.parameterName.split('.')[1];
                this.placeholder = options.placeholder || '';
                this.templates = {
                    main: Handlebars.compile($$b('#mapsvg-filters-tmpl-' + t + '-view').html())
                };
            }
            else {
                this.templates = {
                    main: Handlebars.compile($$b('#mapsvg-data-tmpl-' + t + '-view').html())
                };
            }
            this.inputs = {};
        }
        init() {
            this.setDomElements();
            this.setEventHandlers();
        }
        setDomElements() {
            this.domElements = {
                main: $$b(this.templates.main(this.getDataForTemplate()))[0]
            };
            $$b(this.domElements.main).data('formElement', this);
            this.addSelect2();
        }
        setEventHandlers() {
            var _this = this;
            if (this.formBuilder.editMode) {
                $$b(this.domElements.main).on('click', function () {
                    _this.events.trigger('click', _this, [_this]);
                });
            }
        }
        addSelect2() {
            if ($$b().mselect2) {
                $$b(this.domElements.main).find('select').css({ width: '100%', display: 'block' })
                    .mselect2()
                    .on('select2:focus', function () {
                    $$b(this).mselect2('open');
                });
                $$b(this.domElements.main).find('.select2-selection--multiple .select2-search__field').css('width', '100%');
            }
        }
        setEditorEventHandlers() {
            var _this = this;
            $$b(this.domElements.edit).on('click', 'button.mapsvg-remove', function () {
                $$b(_this.domElements.main).empty().remove();
                $$b(_this.domElements.edit).empty().remove();
                _this.events.trigger('delete', _this, [_this]);
            });
            $$b(this.domElements.edit).on('click', '.mapsvg-filter-insert-options', function () {
                var objType = _this.parameterName.split('.')[0];
                var fieldName = _this.parameterName.split('.')[1];
                var field;
                if (objType == 'Object') {
                    field = _this.formBuilder.mapsvg.objectsRepository.getSchema().getField(fieldName);
                }
                else {
                    if (fieldName == 'id') {
                        let options = [];
                        _this.formBuilder.mapsvg.regions.forEach(function (r) {
                            options.push({ label: r.id, value: r.id });
                        });
                        field = {
                            options: options
                        };
                    }
                    else if (fieldName == 'region_title') {
                        let options = [];
                        _this.formBuilder.mapsvg.regions.forEach(function (r) {
                            options.push({ label: r.title, value: r.title });
                        });
                        field = { options: options };
                    }
                    else {
                        field = _this.formBuilder.mapsvg.regionsRepository.getSchema().getField(fieldName);
                    }
                }
                if (field && field.options) {
                    var options;
                    if (fieldName == 'regions') {
                        if (field.options[0].title && field.options[0].title.length)
                            field.options.sort(function (a, b) {
                                if (a.title < b.title)
                                    return -1;
                                if (a.title > b.title)
                                    return 1;
                                return 0;
                            });
                        options = field.options.map(function (o) {
                            return (o.title || o.id) + ':' + o.id;
                        });
                    }
                    else {
                        options = field.options.map(function (o) {
                            return o.label + ':' + o.value;
                        });
                    }
                    $$b(this).closest('.form-group').find('textarea').val(options.join("\n")).trigger('change');
                }
            });
            $$b(this.domElements.edit).on('keyup change paste', 'input, textarea, select', function () {
                var prop = $$b(this).attr('name');
                var array = $$b(this).data('array');
                if (_this.type === 'status' && array) {
                    var param = $$b(this).data('param');
                    var index = $$b(this).closest('tr').index();
                    _this.options[index] = _this.options[index] || { label: '', value: '', color: '', disabled: false };
                    _this.options[index][param] = $$b(this).is(':checkbox') ? $$b(this).prop('checked') : $$b(this).val();
                    _this.redraw();
                }
                else if (_this.type === 'distance' && array) {
                    var param = $$b(this).data('param');
                    var index = $$b(this).closest('tr').index();
                    if (!_this.options[index]) {
                        _this.options[index] = { value: '', default: false };
                    }
                    if (param === 'default') {
                        _this.options.forEach(function (option) {
                            option.default = false;
                        });
                        _this.options[index].default = $$b(this).prop('checked');
                    }
                    else {
                        _this.options[index].value = $$b(this).val();
                    }
                    _this.redraw();
                }
                else if (prop == 'label' || prop == 'name') {
                    return false;
                }
                else {
                    var value;
                    value = ($$b(this).attr('type') == 'checkbox') ? $$b(this).prop('checked') : $$b(this).val();
                    if ($$b(this).attr('type') == 'radio') {
                        var name = $$b(this).attr('name');
                        value = $$b('input[name="' + name + '"]:checked').val();
                    }
                    _this.update(prop, value);
                }
            });
            $$b(this.domElements.edit).on('keyup change paste', 'input[name="label"]', function () {
                if (!_this.nameChanged) {
                    _this.label = $$b(this).val() + '';
                    if (_this.type != 'region' && _this.type != 'location') {
                        var str = $$b(this).val() + '';
                        str = str.toLowerCase().replace(/ /g, '_').replace(/\W/g, '');
                        $$b(_this.domElements.edit).find('input[name="name"]').val(str);
                        _this.name = str + '';
                    }
                    $$b(_this.domElements.main).find('label').first().html(_this.label);
                    if (!_this.filtersMode) {
                        $$b(_this.domElements.main).find('label').first().append('<div class="field-name">' + _this.name + '</div>');
                    }
                }
            });
            $$b(this.domElements.edit).on('keyup change paste', 'input[name="name"]', function () {
                if (this.value) {
                    if (this.value.match(/[^a-zA-Z0-9_]/g)) {
                        this.value = this.value.replace(/[^a-zA-Z0-9_]/g, '');
                        $$b(this).trigger('change');
                    }
                    if (this.value[0].match(/[^a-zA-Z_]/g)) {
                        this.value = this.value[0].replace(/[^a-zA-Z_]/g, '') + this.value.slice(1);
                        $$b(this).trigger('change');
                    }
                }
                if (_this.type != 'region')
                    _this.name = this.value;
                $$b(_this.domElements.main).find('label').html(_this.label + '<div class="field-name">' + _this.name + '</div>');
                _this.nameChanged = true;
            });
        }
        ;
        getEditor() {
            if (!this.filtersMode) {
                this.templates.edit = this.templates.edit || Handlebars.compile($$b('#mapsvg-data-tmpl-' + this.type + '-control').html());
            }
            else {
                this.templates.edit = this.templates.edit || Handlebars.compile($$b('#mapsvg-filters-tmpl-' + this.type + '-control').html());
            }
            this.domElements.edit = $$b('<div>' + this.templates.edit(this.getDataForTemplate()) + '</div>')[0];
            return this.domElements.edit;
        }
        ;
        destroyEditor() {
            $$b(this.domElements.edit).empty().remove();
        }
        ;
        initEditor() {
            $$b(this.domElements.edit).find('input').first().select();
            if ($$b().mselect2) {
                if (this.type !== 'distance') {
                    $$b(this.domElements.edit).find('select').css({ width: '100%', display: 'block' }).mselect2();
                }
            }
            $$b(this.domElements.edit).find('.mapsvg-onoff').bootstrapToggle({
                onstyle: 'default',
                offstyle: 'default'
            });
            this.setEditorEventHandlers();
        }
        ;
        getSchema() {
            let data;
            data = {
                type: this.type,
                db_type: this.db_type,
                label: this.label,
                name: this.name,
                value: this.value,
                searchable: this.searchable,
                help: this.help,
                visible: this.visible === undefined ? true : this.visible,
                readonly: this.readonly,
                placeholder: this.placeholder,
                protected: this.protected,
                auto_increment: this.auto_increment,
                not_null: this.not_null
            };
            if (this.options) {
                data.options = this.getSchemaFieldOptionsList();
            }
            if (this.filtersMode) {
                data.parameterName = this.parameterName;
                data.parameterNameShort = this.parameterName.split('.')[1];
            }
            return data;
        }
        ;
        getSchemaFieldOptionsList() {
            let options = [];
            this.options.forEach((option, index) => {
                if (this.options[index].value !== '') {
                    options.push(this.options[index]);
                }
            });
            return options;
        }
        getDataForTemplate() {
            var data = this.getSchema();
            data._name = data.name;
            if (this.namespace) {
                data.name = this.name.split('[')[0];
                var suffix = this.name.split('[')[1] || '';
                if (suffix)
                    suffix = '[' + suffix;
                data.name = this.namespace + '[' + data.name + ']' + suffix;
            }
            data.external = this.external;
            return data;
        }
        ;
        update(prop, value) {
            var _this = this;
            if (prop == 'options') {
                var options = [];
                value = value.split("\n").forEach(function (row) {
                    row = row.trim().split(':');
                    if (_this.type == 'checkbox' && row.length == 3) {
                        options.push({
                            label: row[0],
                            name: row[1],
                            value: row[2]
                        });
                    }
                    else if ((_this.type == 'radio' || _this.type == 'select' || _this.type == 'checkboxes') && row.length == 2) {
                        options.push({
                            label: row[0],
                            value: row[1]
                        });
                    }
                });
                this.options = options;
            }
            else {
                this[prop] = value;
            }
            if (prop == 'parameterName') {
                $$b(this.domElements.edit).find('.mapsvg-filter-param-name').text(value);
            }
            this.redraw();
        }
        ;
        addParams(params) {
        }
        redraw() {
            var newView = $$b(this.templates.main(this.getDataForTemplate()));
            $$b(this.domElements.main).html(newView.html());
            if ($$b().mselect2) {
                if (this.type !== 'distance') {
                    $$b(this.domElements.main).find('select').css({ width: '100%', display: 'block' })
                        .mselect2()
                        .on('select2:focus', function () {
                        $$b(this).mselect2('open');
                    });
                }
                else {
                    $$b(this.domElements.main).find('select').mselect2().on('select2:focus', function () {
                        $$b(this).mselect2('open');
                    });
                }
            }
            if ($$b().colorpicker) {
                this.domElements.edit && $$b(this.domElements.edit).find('.cpicker').colorpicker().on('changeColor.colorpicker', function (event) {
                    var input = $$b(this).find('input');
                    if (input.val() == '')
                        $$b(this).find('i').css({ 'background-color': '' });
                });
            }
        }
        setOptions(options) {
            if (options) {
                this.options = [];
                this.optionsDict = {};
                options.forEach((value, key) => {
                    this.options.push(value);
                    this.optionsDict[key] = value;
                });
                return this.options;
            }
            else {
                return this.setOptions([
                    { label: 'Option one', name: 'option_one', value: 1 },
                    { label: 'Option two', name: 'option_two', value: 2 }
                ]);
            }
        }
        getData() {
            return { name: this.name, value: this.value };
        }
        updateData() { }
        ;
        destroy() {
            if ($$b().mselect2) {
                var sel = $$b(this.domElements.main).find('.mapsvg-select2');
                if (sel.length) {
                    sel.mselect2('destroy');
                }
            }
        }
        show() {
            $$b(this.domElements.main).show();
        }
        hide() {
            $$b(this.domElements.main).hide();
        }
    }

    const $$c = jQuery;
    class CheckboxFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.db_type = 'tinyint(1)';
            this.checkboxLabel = options.checkboxLabel;
            this.checkboxValue = options.checkboxValue;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.checkbox = $$c(this.domElements.main).find('input')[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$c(this.inputs.checkbox).on('change', (e) => {
                this.value = e.target.checked;
                this.events.trigger('changed', this, [this]);
            });
        }
        getSchema() {
            let schema = super.getSchema();
            if (this.checkboxLabel) {
                schema.checkboxLabel = this.checkboxLabel;
            }
            if (this.checkboxValue) {
                schema.checkboxValue = this.checkboxValue;
            }
            return schema;
        }
    }

    const $$d = jQuery;
    class CheckboxesFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.db_type = 'text';
            this.checkboxLabel = options.checkboxLabel;
            this.setOptions(options.options);
        }
        setDomElements() {
            super.setDomElements();
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$d(this.domElements.main).on('change', 'input', (e) => {
                var a = [];
                $$d(this.domElements.main).find('input:checked').map((i, el) => { a.push(jQuery(el).attr('name')); });
                this.value = a;
                this.events.trigger('changed', this, [this]);
            });
        }
    }

    const $$e = jQuery;
    class DateFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            if (this.formBuilder.admin) {
                this.languages = ['en-GB', 'ar', 'az', 'bg', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr', 'gl', 'he', 'hr', 'hu', 'hy', 'id', 'is', 'it', 'ja', 'ka', 'kh', 'kk', 'kr', 'lt', 'lv', 'mk', 'ms', 'nb', 'nl', 'nl-BE', 'no', 'pl', 'pt-BR', 'pt', 'ro', 'rs', 'rs-latin', 'ru', 'sk', 'sl', 'sq', 'sr', 'sr-latin', 'sv', 'sw', 'th', 'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'];
            }
            this.db_type = 'varchar(50)';
            this.language = options.language;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.date = $$e(this.domElements.main).find('input')[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$e(this.inputs.date).on('change', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
        getSchema() {
            let schema = super.getSchema();
            schema.language = this.language;
            return schema;
        }
        getDataForTemplate() {
            let data = super.getDataForTemplate();
            if (this.formBuilder.admin)
                data.languages = this.languages;
            data.language = this.language;
            return data;
        }
    }

    const $$f = jQuery;
    class DistanceFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.label = this.label || (options.label === undefined ? 'Search radius' : options.label);
            this.distanceControl = options.distanceControl || 'select';
            this.distanceUnits = options.distanceUnits || 'km';
            this.distanceUnitsLabel = options.distanceUnitsLabel || 'km';
            this.fromLabel = options.fromLabel || 'from';
            this.placeholder = options.placeholder;
            this.userLocationButton = options.userLocationButton || false;
            this.type = options.type;
            this.addressField = options.addressField || true;
            this.addressFieldPlaceholder = options.addressFieldPlaceholder || 'Address';
            this.languages = [{ "value": "sq", "label": "Albanian" }, { "value": "ar", "label": "Arabic" }, {
                    "value": "eu",
                    "label": "Basque"
                }, { "value": "be", "label": "Belarusian" }, { "value": "bg", "label": "Bulgarian" }, {
                    "value": "my",
                    "label": "Burmese"
                }, { "value": "bn", "label": "Bengali" }, { "value": "ca", "label": "Catalan" }, {
                    "value": "zh-cn",
                    "label": "Chinese (simplified)"
                }, { "value": "zh-tw", "label": "Chinese (traditional)" }, {
                    "value": "hr",
                    "label": "Croatian"
                }, { "value": "cs", "label": "Czech" }, { "value": "da", "label": "Danish" }, {
                    "value": "nl",
                    "label": "Dutch"
                }, { "value": "en", "label": "English" }, {
                    "value": "en-au",
                    "label": "English (australian)"
                }, { "value": "en-gb", "label": "English (great Britain)" }, {
                    "value": "fa",
                    "label": "Farsi"
                }, { "value": "fi", "label": "Finnish" }, { "value": "fil", "label": "Filipino" }, {
                    "value": "fr",
                    "label": "French"
                }, { "value": "gl", "label": "Galician" }, { "value": "de", "label": "German" }, {
                    "value": "el",
                    "label": "Greek"
                }, { "value": "gu", "label": "Gujarati" }, { "value": "iw", "label": "Hebrew" }, {
                    "value": "hi",
                    "label": "Hindi"
                }, { "value": "hu", "label": "Hungarian" }, { "value": "id", "label": "Indonesian" }, {
                    "value": "it",
                    "label": "Italian"
                }, { "value": "ja", "label": "Japanese" }, { "value": "kn", "label": "Kannada" }, {
                    "value": "kk",
                    "label": "Kazakh"
                }, { "value": "ko", "label": "Korean" }, { "value": "ky", "label": "Kyrgyz" }, {
                    "value": "lt",
                    "label": "Lithuanian"
                }, { "value": "lv", "label": "Latvian" }, { "value": "mk", "label": "Macedonian" }, {
                    "value": "ml",
                    "label": "Malayalam"
                }, { "value": "mr", "label": "Marathi" }, { "value": "no", "label": "Norwegian" }, {
                    "value": "pl",
                    "label": "Polish"
                }, { "value": "pt", "label": "Portuguese" }, {
                    "value": "pt-br",
                    "label": "Portuguese (brazil)"
                }, { "value": "pt-pt", "label": "Portuguese (portugal)" }, {
                    "value": "pa",
                    "label": "Punjabi"
                }, { "value": "ro", "label": "Romanian" }, { "value": "ru", "label": "Russian" }, {
                    "value": "sr",
                    "label": "Serbian"
                }, { "value": "sk", "label": "Slovak" }, { "value": "sl", "label": "Slovenian" }, {
                    "value": "es",
                    "label": "Spanish"
                }, { "value": "sv", "label": "Swedish" }, { "value": "tl", "label": "Tagalog" }, {
                    "value": "ta",
                    "label": "Tamil"
                }, { "value": "te", "label": "Telugu" }, { "value": "th", "label": "Thai" }, {
                    "value": "tr",
                    "label": "Turkish"
                }, { "value": "uk", "label": "Ukrainian" }, { "value": "uz", "label": "Uzbek" }, {
                    "value": "vi",
                    "label": "Vietnamese"
                }];
            this.countries = MapSVG.countries;
            this.country = options.country;
            this.language = options.language;
            this.searchByZip = options.searchByZip;
            this.zipLength = options.zipLength || 5;
            this.userLocationButton = MapSVG.parseBoolean(options.userLocationButton);
            this.options = options.options || [
                { value: '10', default: true },
                { value: '30', default: false },
                { value: '50', default: false },
                { value: '100', default: false }
            ];
            var selected = false;
            if (this.value) {
                this.options.forEach((option) => {
                    if (option.value === this.value.length) {
                        option.selected = true;
                        selected = true;
                    }
                });
            }
            if (!selected) {
                this.options.forEach(function (option) {
                    if (option.default) {
                        option.selected = true;
                    }
                });
            }
            this.value = {
                units: this.distanceUnits,
                latlng: '',
                length: '',
                address: '',
                country: this.country
            };
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.units = $$f(this.domElements.main).find('[name="distanceUnits"]')[0];
            this.inputs.latlng = $$f(this.domElements.main).find('[name="distanceLatLng"]')[0];
            this.inputs.length = $$f(this.domElements.main).find('[name="distanceLength"]')[0];
            this.inputs.address = $$f(this.domElements.main).find('[name="distanceAddress"]')[0];
        }
        getSchema() {
            let schema = super.getSchema();
            schema.distanceControl = this.distanceControl;
            schema.distanceUnits = this.distanceUnits;
            schema.distanceUnitsLabel = this.distanceUnitsLabel;
            schema.fromLabel = this.fromLabel;
            schema.addressField = this.addressField;
            schema.addressFieldPlaceholder = this.addressFieldPlaceholder;
            schema.userLocationButton = this.userLocationButton;
            schema.placeholder = this.placeholder;
            schema.language = this.language;
            schema.country = this.country;
            schema.searchByZip = this.searchByZip;
            schema.zipLength = this.zipLength;
            schema.userLocationButton = MapSVG.parseBoolean(this.userLocationButton);
            if (schema.distanceControl === 'none') {
                schema.distanceDefault = schema.options.filter(function (o) {
                    return o.default;
                })[0].value;
            }
            schema.options.forEach(function (option, index) {
                if (schema.options[index].value === '') {
                    schema.options.splice(index, 1);
                }
                else {
                    schema.options[index].default = MapSVG.parseBoolean(schema.options[index].default);
                }
            });
            return schema;
        }
        getDataForTemplate() {
            let data = super.getDataForTemplate();
            if (this.formBuilder.admin) {
                data.languages = this.languages;
                data.countries = this.countries;
            }
            data.language = this.language;
            data.country = this.country;
            data.searchByZip = this.searchByZip;
            data.zipLength = this.zipLength;
            data.userLocationButton = MapSVG.parseBoolean(this.userLocationButton);
            return data;
        }
        destroy() {
            if ($$f().mselect2) {
                var sel = $$f(this.domElements.main).find('.mapsvg-select2');
                if (sel.length) {
                    sel.mselect2('destroy');
                }
            }
        }
        initEditor() {
            super.initEditor();
            this.mayBeAddDistanceRow();
            if ($$f().mselect2) {
                $$f(this.domElements.edit).find('select').mselect2();
            }
        }
        setEventHandlers() {
            super.setEventHandlers();
            var _this = this;
            $$f(this.domElements.edit).on('keyup change paste', '.mapsvg-edit-distance-row input', function () {
                _this.mayBeAddDistanceRow();
            });
            var locations = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('formatted_address'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: {
                    url: MapSVG.urls.ajaxurl + '?action=mapsvg_geocoding&address=%QUERY%&language=' + this.language + (this.country ? '&country=' + this.country : ''),
                    wildcard: '%QUERY%',
                    transform: function (response) {
                        if (response.error_message) {
                            alert(response.error_message);
                        }
                        return response.results;
                    },
                    rateLimitWait: 600
                }
            });
            var thContainer = $$f(this.domElements.main).find('.typeahead');
            if (this.searchByZip) {
                $$f(this.domElements.main).find('.mapsvg-distance-fields').addClass('search-by-zip');
                thContainer.on('change keyup', function () {
                    if ($$f(this).val().toString().length === _this.zipLength) {
                        locations.search($$f(this).val(), null, function (data) {
                            if (data && data[0]) {
                                var latlng = data[0].geometry.location;
                                _this.inputs.latlng.value = latlng.lat + ',' + latlng.lng;
                                _this.value.latlng = latlng.lat + ',' + latlng.lng;
                                _this.events.trigger('changed');
                            }
                        });
                    }
                });
            }
            else {
                var tH = thContainer.typeahead({ minLength: 3 }, {
                    name: 'mapsvg-addresses',
                    display: 'formatted_address',
                    source: locations,
                    limit: 5
                });
                $$f(this.domElements.main).find('.mapsvg-distance-fields').removeClass('search-by-zip');
            }
            if (_this.userLocationButton) {
                var userLocationButton = $$f(this.domElements.main).find('.user-location-button');
                userLocationButton.on('click', function () {
                    _this.formBuilder.mapsvg.showUserLocation(function (location) {
                        locations.search(location.lat + ',' + location.lng, null, function (data) {
                            if (data && data[0]) {
                                thContainer.val(data[0].formatted_address);
                            }
                            else {
                                thContainer.val(location.lat + ',' + location.lng);
                            }
                        });
                        _this.inputs.latlng.value = location.lat + ',' + location.lng;
                        _this.events.trigger('changed');
                    });
                });
            }
            thContainer.on('change keyup', function () {
                if ($$f(this).val() === '') {
                    _this.inputs.latlng.value = '';
                    _this.events.trigger('changed', this, [this]);
                }
            });
            thContainer.on('typeahead:select', function (ev, item) {
                let address;
                address = {};
                address.formatted = item.formatted_address;
                var latlng = item.geometry.location;
                _this.inputs.latlng.value = latlng.lat + ',' + latlng.lng;
                _this.events.trigger('changed');
                thContainer.blur();
            });
            $$f(this.inputs.latlng).on('change', function () {
                _this.value.latlng = this.value;
                _this.events.trigger('changed');
            });
            $$f(this.inputs.length).on('change', function () {
                _this.value.length = this.value;
                _this.events.trigger('changed');
            });
        }
        addSelect2() {
            if ($$f().mselect2) {
                $$f(this.views.element).find('select').mselect2().on('select2:focus', function () {
                    $$f(this).mselect2('open');
                });
            }
        }
        mayBeAddDistanceRow() {
            var _this = this;
            let editDistanceRow = $$f($$f('#mapsvg-edit-distance-row').html());
            var z = $$f(_this.domElements.edit).find('.mapsvg-edit-distance-row:last-child input');
            if (z && z.last() && z.last().val() && z.last().val().toString().trim().length) {
                var newRow = editDistanceRow.clone();
                newRow.insertAfter($$f(_this.domElements.edit).find('.mapsvg-edit-distance-row:last-child'));
            }
            var rows = $$f(_this.domElements.edit).find('.mapsvg-edit-distance-row');
            var row1 = rows.eq(rows.length - 2);
            var row2 = rows.eq(rows.length - 1);
            if (row1.length && row2.length && !row1.find('input:eq(0)').val().toString().trim() && !row2.find('input:eq(0)').val().toString().trim()) {
                row2.remove();
            }
        }
        ;
    }

    const $$g = jQuery;
    class EmptyFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.readonly = true;
        }
    }

    class IdFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
        }
        getData() {
            return { name: 'id', value: this.value };
        }
    }

    var sortable_min = createCommonjsModule(function (module) {
    /**!
     * Sortable
     * @author	RubaXa   <trash@rubaxa.org>
     * @license MIT
     */

    (function sortableModule(factory) {

        {
            module.exports = factory();
        }
    })(function sortableFactory() {

        if (typeof window == "undefined" || !window.document) {
            return function sortableError() {
                throw new Error("Sortable.js requires a window with a document");
            };
        }

        var dragEl,
            parentEl,
            ghostEl,
            cloneEl,
            rootEl,
            nextEl,

            scrollEl,
            scrollParentEl,
            scrollCustomFn,

            lastEl,
            lastCSS,
            lastParentCSS,

            oldIndex,
            newIndex,

            activeGroup,
            putSortable,

            autoScroll = {},

            tapEvt,
            touchEvt,

            moved,

            /** @const */
            RSPACE = /\s+/g,

            expando = 'Sortable' + (new Date).getTime(),

            win = window,
            document = win.document,
            parseInt = win.parseInt,

            $ = win.jQuery || win.Zepto,
            Polymer = win.Polymer,

            supportDraggable = !!('draggable' in document.createElement('div')),
            supportCssPointerEvents = (function (el) {
                // false when IE11
                if (!!navigator.userAgent.match(/Trident.*rv[ :]?11\./)) {
                    return false;
                }
                el = document.createElement('x');
                el.style.cssText = 'pointer-events:auto';
                return el.style.pointerEvents === 'auto';
            })(),

            _silent = false,

            abs = Math.abs,
            min = Math.min,
            touchDragOverListeners = [],

            _autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {
                // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
                if (rootEl && options.scroll) {
                    var el,
                        rect,
                        sens = options.scrollSensitivity,
                        speed = options.scrollSpeed,

                        x = evt.clientX,
                        y = evt.clientY,

                        winWidth = window.innerWidth,
                        winHeight = window.innerHeight,

                        vx,
                        vy,

                        scrollOffsetX,
                        scrollOffsetY
                        ;

                    // Delect scrollEl
                    if (scrollParentEl !== rootEl) {
                        scrollEl = options.scroll;
                        scrollParentEl = rootEl;
                        scrollCustomFn = options.scrollFn;

                        if (scrollEl === true) {
                            scrollEl = rootEl;

                            do {
                                if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||
                                    (scrollEl.offsetHeight < scrollEl.scrollHeight)
                                ) {
                                    break;
                                }
                                /* jshint boss:true */
                            } while (scrollEl = scrollEl.parentNode);
                        }
                    }

                    if (scrollEl) {
                        el = scrollEl;
                        rect = scrollEl.getBoundingClientRect();
                        vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
                        vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
                    }


                    if (!(vx || vy)) {
                        vx = (winWidth - x <= sens) - (x <= sens);
                        vy = (winHeight - y <= sens) - (y <= sens);

                        /* jshint expr:true */
                        (vx || vy) && (el = win);
                    }


                    if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
                        autoScroll.el = el;
                        autoScroll.vx = vx;
                        autoScroll.vy = vy;

                        clearInterval(autoScroll.pid);

                        if (el) {
                            autoScroll.pid = setInterval(function () {
                                scrollOffsetY = vy ? vy * speed : 0;
                                scrollOffsetX = vx ? vx * speed : 0;

                                if ('function' === typeof(scrollCustomFn)) {
                                    return scrollCustomFn.call(_this, scrollOffsetX, scrollOffsetY, evt);
                                }

                                if (el === win) {
                                    win.scrollTo(win.pageXOffset + scrollOffsetX, win.pageYOffset + scrollOffsetY);
                                } else {
                                    el.scrollTop += scrollOffsetY;
                                    el.scrollLeft += scrollOffsetX;
                                }
                            }, 24);
                        }
                    }
                }
            }, 30),

            _prepareGroup = function (options) {
                function toFn(value, pull) {
                    if (value === void 0 || value === true) {
                        value = group.name;
                    }

                    if (typeof value === 'function') {
                        return value;
                    } else {
                        return function (to, from) {
                            var fromGroup = from.options.group.name;

                            return pull
                                ? value
                                : value && (value.join
                                    ? value.indexOf(fromGroup) > -1
                                    : (fromGroup == value)
                            );
                        };
                    }
                }

                var group = {};
                var originalGroup = options.group;

                if (!originalGroup || typeof originalGroup != 'object') {
                    originalGroup = {name: originalGroup};
                }

                group.name = originalGroup.name;
                group.checkPull = toFn(originalGroup.pull, true);
                group.checkPut = toFn(originalGroup.put);

                options.group = group;
            }
            ;



        /**
         * @class  Sortable
         * @param  {HTMLElement}  el
         * @param  {Object}       [options]
         */
        function Sortable(el, options) {
            if (!(el && el.nodeType && el.nodeType === 1)) {
                throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);
            }

            this.el = el; // root element
            this.options = options = _extend({}, options);


            // Export instance
            el[expando] = this;


            // Default options
            var defaults = {
                group: Math.random(),
                sort: true,
                disabled: false,
                store: null,
                handle: null,
                scroll: true,
                scrollSensitivity: 30,
                scrollSpeed: 10,
                draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                ignore: 'a, img',
                filter: null,
                animation: 0,
                setData: function (dataTransfer, dragEl) {
                    dataTransfer.setData('Text', dragEl.textContent);
                },
                dropBubble: false,
                dragoverBubble: false,
                dataIdAttr: 'data-id',
                delay: 0,
                forceFallback: false,
                fallbackClass: 'sortable-fallback',
                fallbackOnBody: false,
                fallbackTolerance: 0,
                fallbackOffset: {x: 0, y: 0}
            };


            // Set default options
            for (var name in defaults) {
                !(name in options) && (options[name] = defaults[name]);
            }

            _prepareGroup(options);

            // Bind all private methods
            for (var fn in this) {
                if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
                    this[fn] = this[fn].bind(this);
                }
            }

            // Setup drag mode
            this.nativeDraggable = options.forceFallback ? false : supportDraggable;

            // Bind events
            _on(el, 'mousedown', this._onTapStart);
            _on(el, 'touchstart', this._onTapStart);

            if (this.nativeDraggable) {
                _on(el, 'dragover', this);
                _on(el, 'dragenter', this);
            }

            touchDragOverListeners.push(this._onDragOver);

            // Restore sorting
            options.store && this.sort(options.store.get(this));
        }


        Sortable.prototype = /** @lends Sortable.prototype */ {
            constructor: Sortable,

            _onTapStart: function (/** Event|TouchEvent */evt) {
                if(evt.target.tagName == 'i' || evt.target.tagName == 'I'){
                    evt.target.click();
                    return;
                }
                var _this = this,
                    el = this.el,
                    options = this.options,
                    type = evt.type,
                    touch = evt.touches && evt.touches[0],
                    target = (touch || evt).target,
                    originalTarget = evt.target.shadowRoot && evt.path[0] || target,
                    filter = options.filter,
                    startIndex;

                // Don't trigger start event when an element is been dragged, otherwise the evt.oldindex always wrong when set option.group.
                if (dragEl) {
                    return;
                }

                if (type === 'mousedown' && evt.button !== 0 || options.disabled) {
                    return; // only left button or enabled
                }

                if (options.handle && !_closest(originalTarget, options.handle, el)) {
                    return;
                }

                target = _closest(target, options.draggable, el);

                if (!target) {
                    return;
                }

                // Get the index of the dragged element within its parent
                startIndex = _index(target, options.draggable);

                // Check filter
                if (typeof filter === 'function') {
                    if (filter.call(this, evt, target, this)) {
                        _dispatchEvent(_this, originalTarget, 'filter', target, el, startIndex);
                        evt.preventDefault();
                        return; // cancel dnd
                    }
                }
                else if (filter) {
                    filter = filter.split(',').some(function (criteria) {
                        criteria = _closest(originalTarget, criteria.trim(), el);

                        if (criteria) {
                            _dispatchEvent(_this, criteria, 'filter', target, el, startIndex);
                            return true;
                        }
                    });

                    if (filter) {
                        evt.preventDefault();
                        return; // cancel dnd
                    }
                }

                // Prepare `dragstart`
                this._prepareDragStart(evt, touch, target, startIndex);
            },

            _prepareDragStart: function (/** Event */evt, /** Touch */touch, /** HTMLElement */target, /** Number */startIndex) {
                var _this = this,
                    el = _this.el,
                    options = _this.options,
                    ownerDocument = el.ownerDocument,
                    dragStartFn;

                if (target && !dragEl && (target.parentNode === el)) {
                    tapEvt = evt;

                    rootEl = el;
                    dragEl = target;
                    parentEl = dragEl.parentNode;
                    nextEl = dragEl.nextSibling;
                    activeGroup = options.group;
                    oldIndex = startIndex;

                    this._lastX = (touch || evt).clientX;
                    this._lastY = (touch || evt).clientY;

                    dragEl.style['will-change'] = 'transform';

                    dragStartFn = function () {
                        // Delayed drag has been triggered
                        // we can re-enable the events: touchmove/mousemove
                        _this._disableDelayedDrag();

                        // Make the element draggable
                        dragEl.draggable = _this.nativeDraggable;

                        // Chosen item
                        _toggleClass(dragEl, options.chosenClass, true);

                        // Bind the events: dragstart/dragend
                        _this._triggerDragStart(touch);

                        // Drag start event
                        _dispatchEvent(_this, rootEl, 'choose', dragEl, rootEl, oldIndex);
                    };

                    // Disable "draggable"
                    options.ignore.split(',').forEach(function (criteria) {
                        _find(dragEl, criteria.trim(), _disableDraggable);
                    });

                    _on(ownerDocument, 'mouseup', _this._onDrop);
                    _on(ownerDocument, 'touchend', _this._onDrop);
                    _on(ownerDocument, 'touchcancel', _this._onDrop);

                    if (options.delay) {
                        // If the user moves the pointer or let go the click or touch
                        // before the delay has been reached:
                        // disable the delayed drag
                        _on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
                        _on(ownerDocument, 'touchend', _this._disableDelayedDrag);
                        _on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
                        _on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
                        _on(ownerDocument, 'touchmove', _this._disableDelayedDrag);

                        _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
                    } else {
                        dragStartFn();
                    }
                }
            },

            _disableDelayedDrag: function () {
                var ownerDocument = this.el.ownerDocument;

                clearTimeout(this._dragStartTimer);
                _off(ownerDocument, 'mouseup', this._disableDelayedDrag);
                _off(ownerDocument, 'touchend', this._disableDelayedDrag);
                _off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
                _off(ownerDocument, 'mousemove', this._disableDelayedDrag);
                _off(ownerDocument, 'touchmove', this._disableDelayedDrag);
            },

            _triggerDragStart: function (/** Touch */touch) {
                if (touch) {
                    // Touch device support
                    tapEvt = {
                        target: dragEl,
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    };

                    this._onDragStart(tapEvt, 'touch');
                }
                else if (!this.nativeDraggable) {
                    this._onDragStart(tapEvt, true);
                }
                else {
                    _on(dragEl, 'dragend', this);
                    _on(rootEl, 'dragstart', this._onDragStart);
                }

                try {
                    if (document.selection) {
                        // Timeout neccessary for IE9
                        setTimeout(function () {
                            document.selection.empty();
                        });
                    } else {
                        window.getSelection().removeAllRanges();
                    }
                } catch (err) {
                }
            },

            _dragStarted: function () {
                if (rootEl && dragEl) {
                    var options = this.options;

                    // Apply effect
                    _toggleClass(dragEl, options.ghostClass, true);
                    _toggleClass(dragEl, options.dragClass, false);

                    Sortable.active = this;

                    // Drag start event
                    _dispatchEvent(this, rootEl, 'start', dragEl, rootEl, oldIndex);
                }
            },

            _emulateDragOver: function () {
                if (touchEvt) {
                    if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
                        return;
                    }

                    this._lastX = touchEvt.clientX;
                    this._lastY = touchEvt.clientY;

                    if (!supportCssPointerEvents) {
                        _css(ghostEl, 'display', 'none');
                    }

                    var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
                        parent = target,
                        i = touchDragOverListeners.length;

                    if (parent) {
                        do {
                            if (parent[expando]) {
                                while (i--) {
                                    touchDragOverListeners[i]({
                                        clientX: touchEvt.clientX,
                                        clientY: touchEvt.clientY,
                                        target: target,
                                        rootEl: parent
                                    });
                                }

                                break;
                            }

                            target = parent; // store last element
                        }
                            /* jshint boss:true */
                        while (parent = parent.parentNode);
                    }

                    if (!supportCssPointerEvents) {
                        _css(ghostEl, 'display', '');
                    }
                }
            },


            _onTouchMove: function (/**TouchEvent*/evt) {
                if (tapEvt) {
                    var	options = this.options,
                        fallbackTolerance = options.fallbackTolerance,
                        fallbackOffset = options.fallbackOffset,
                        touch = evt.touches ? evt.touches[0] : evt,
                        dx = (touch.clientX - tapEvt.clientX) + fallbackOffset.x,
                        dy = (touch.clientY - tapEvt.clientY) + fallbackOffset.y,
                        translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

                    // only set the status to dragging, when we are actually dragging
                    if (!Sortable.active) {
                        if (fallbackTolerance &&
                            min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance
                        ) {
                            return;
                        }

                        this._dragStarted();
                    }

                    // as well as creating the ghost element on the document body
                    this._appendGhost();

                    moved = true;
                    touchEvt = touch;

                    _css(ghostEl, 'webkitTransform', translate3d);
                    _css(ghostEl, 'mozTransform', translate3d);
                    _css(ghostEl, 'msTransform', translate3d);
                    _css(ghostEl, 'transform', translate3d);

                    evt.preventDefault();
                }
            },

            _appendGhost: function () {
                if (!ghostEl) {
                    var rect = dragEl.getBoundingClientRect(),
                        css = _css(dragEl),
                        options = this.options,
                        ghostRect;

                    ghostEl = dragEl.cloneNode(true);

                    _toggleClass(ghostEl, options.ghostClass, false);
                    _toggleClass(ghostEl, options.fallbackClass, true);
                    _toggleClass(ghostEl, options.dragClass, true);

                    _css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
                    _css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
                    _css(ghostEl, 'width', rect.width);
                    _css(ghostEl, 'height', rect.height);
                    _css(ghostEl, 'opacity', '0.8');
                    _css(ghostEl, 'position', 'fixed');
                    _css(ghostEl, 'zIndex', '100000');
                    _css(ghostEl, 'pointerEvents', 'none');

                    options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);

                    // Fixing dimensions.
                    ghostRect = ghostEl.getBoundingClientRect();
                    _css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
                    _css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
                }
            },

            _onDragStart: function (/**Event*/evt, /**boolean*/useFallback) {
                var dataTransfer = evt.dataTransfer,
                    options = this.options;

                this._offUpEvents();

                if (activeGroup.checkPull(this, this, dragEl, evt) == 'clone') {
                    cloneEl = _clone(dragEl);
                    _css(cloneEl, 'display', 'none');
                    rootEl.insertBefore(cloneEl, dragEl);
                    _dispatchEvent(this, rootEl, 'clone', dragEl);
                }

                _toggleClass(dragEl, options.dragClass, true);

                if (useFallback) {
                    if (useFallback === 'touch') {
                        // Bind touch events
                        _on(document, 'touchmove', this._onTouchMove);
                        _on(document, 'touchend', this._onDrop);
                        _on(document, 'touchcancel', this._onDrop);
                    } else {
                        // Old brwoser
                        _on(document, 'mousemove', this._onTouchMove);
                        _on(document, 'mouseup', this._onDrop);
                    }

                    this._loopId = setInterval(this._emulateDragOver, 50);
                }
                else {
                    if (dataTransfer) {
                        dataTransfer.effectAllowed = 'move';
                        options.setData && options.setData.call(this, dataTransfer, dragEl);
                    }

                    _on(document, 'drop', this);
                    setTimeout(this._dragStarted, 0);
                }
            },

            _onDragOver: function (/**Event*/evt) {
                var el = this.el,
                    target,
                    dragRect,
                    targetRect,
                    revert,
                    options = this.options,
                    group = options.group,
                    activeSortable = Sortable.active,
                    isOwner = (activeGroup === group),
                    canSort = options.sort;

                if (evt.preventDefault !== void 0) {
                    evt.preventDefault();
                    !options.dragoverBubble && evt.stopPropagation();
                }

                moved = true;

                if (activeGroup && !options.disabled &&
                    (isOwner
                            ? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
                            : (
                            putSortable === this ||
                            activeGroup.checkPull(this, activeSortable, dragEl, evt) && group.checkPut(this, activeSortable, dragEl, evt)
                        )
                    ) &&
                    (evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback
                ) {
                    // Smart auto-scrolling
                    _autoScroll(evt, options, this.el);

                    if (_silent) {
                        return;
                    }

                    target = _closest(evt.target, options.draggable, el);
                    dragRect = dragEl.getBoundingClientRect();
                    putSortable = this;

                    if (revert) {
                        _cloneHide(true);
                        parentEl = rootEl; // actualization

                        if (cloneEl || nextEl) {
                            rootEl.insertBefore(dragEl, cloneEl || nextEl);
                        }
                        else if (!canSort) {
                            rootEl.appendChild(dragEl);
                        }

                        return;
                    }


                    if ((el.children.length === 0) || (el.children[0] === ghostEl) ||
                        (el === evt.target) && (target = _ghostIsLast(el, evt))
                    ) {
                        if (target) {
                            if (target.animated) {
                                return;
                            }

                            targetRect = target.getBoundingClientRect();
                        }

                        _cloneHide(isOwner);

                        if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt) !== false) {
                            if (!dragEl.contains(el)) {
                                el.appendChild(dragEl);
                                parentEl = el; // actualization
                            }

                            this._animate(dragRect, dragEl);
                            target && this._animate(targetRect, target);
                        }
                    }
                    else if (target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {
                        if (lastEl !== target) {
                            lastEl = target;
                            lastCSS = _css(target);
                            lastParentCSS = _css(target.parentNode);
                        }

                        targetRect = target.getBoundingClientRect();

                        var width = targetRect.right - targetRect.left,
                            height = targetRect.bottom - targetRect.top,
                            floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display)
                                || (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),
                            isWide = (target.offsetWidth > dragEl.offsetWidth),
                            isLong = (target.offsetHeight > dragEl.offsetHeight),
                            halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
                            nextSibling = target.nextElementSibling,
                            moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt),
                            after
                            ;

                        if (moveVector !== false) {
                            _silent = true;
                            setTimeout(_unsilent, 30);

                            _cloneHide(isOwner);

                            if (moveVector === 1 || moveVector === -1) {
                                after = (moveVector === 1);
                            }
                            else if (floating) {
                                var elTop = dragEl.offsetTop,
                                    tgTop = target.offsetTop;

                                if (elTop === tgTop) {
                                    after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
                                }
                                else if (target.previousElementSibling === dragEl || dragEl.previousElementSibling === target) {
                                    after = (evt.clientY - targetRect.top) / height > 0.5;
                                } else {
                                    after = tgTop > elTop;
                                }
                            } else {
                                after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
                            }

                            if (!dragEl.contains(el)) {
                                if (after && !nextSibling) {
                                    el.appendChild(dragEl);
                                } else {
                                    target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
                                }
                            }

                            parentEl = dragEl.parentNode; // actualization

                            this._animate(dragRect, dragEl);
                            this._animate(targetRect, target);
                        }
                    }
                }
            },

            _animate: function (prevRect, target) {
                var ms = this.options.animation;

                if (ms) {
                    var currentRect = target.getBoundingClientRect();

                    _css(target, 'transition', 'none');
                    _css(target, 'transform', 'translate3d('
                        + (prevRect.left - currentRect.left) + 'px,'
                        + (prevRect.top - currentRect.top) + 'px,0)'
                    );

                    target.offsetWidth; // repaint

                    _css(target, 'transition', 'all ' + ms + 'ms');
                    _css(target, 'transform', 'translate3d(0,0,0)');

                    clearTimeout(target.animated);
                    target.animated = setTimeout(function () {
                        _css(target, 'transition', '');
                        _css(target, 'transform', '');
                        target.animated = false;
                    }, ms);
                }
            },

            _offUpEvents: function () {
                var ownerDocument = this.el.ownerDocument;

                _off(document, 'touchmove', this._onTouchMove);
                _off(ownerDocument, 'mouseup', this._onDrop);
                _off(ownerDocument, 'touchend', this._onDrop);
                _off(ownerDocument, 'touchcancel', this._onDrop);
            },

            _onDrop: function (/**Event*/evt) {
                var el = this.el,
                    options = this.options;

                clearInterval(this._loopId);
                clearInterval(autoScroll.pid);
                clearTimeout(this._dragStartTimer);

                // Unbind events
                _off(document, 'mousemove', this._onTouchMove);

                if (this.nativeDraggable) {
                    _off(document, 'drop', this);
                    _off(el, 'dragstart', this._onDragStart);
                }

                this._offUpEvents();

                if (evt) {
                    if (moved) {
                        evt.preventDefault();
                        !options.dropBubble && evt.stopPropagation();
                    }

                    ghostEl && ghostEl.parentNode.removeChild(ghostEl);

                    if (dragEl) {
                        if (this.nativeDraggable) {
                            _off(dragEl, 'dragend', this);
                        }

                        _disableDraggable(dragEl);
                        dragEl.style['will-change'] = '';

                        // Remove class's
                        _toggleClass(dragEl, this.options.ghostClass, false);
                        _toggleClass(dragEl, this.options.chosenClass, false);

                        if (rootEl !== parentEl) {
                            newIndex = _index(dragEl, options.draggable);

                            if (newIndex >= 0) {

                                // Add event
                                _dispatchEvent(null, parentEl, 'add', dragEl, rootEl, oldIndex, newIndex);

                                // Remove event
                                _dispatchEvent(this, rootEl, 'remove', dragEl, rootEl, oldIndex, newIndex);

                                // drag from one list and drop into another
                                _dispatchEvent(null, parentEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
                                _dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
                            }
                        }
                        else {
                            // Remove clone
                            cloneEl && cloneEl.parentNode.removeChild(cloneEl);

                            if (dragEl.nextSibling !== nextEl) {
                                // Get the index of the dragged element within its parent
                                newIndex = _index(dragEl, options.draggable);

                                if (newIndex >= 0) {
                                    // drag & drop within the same list
                                    _dispatchEvent(this, rootEl, 'update', dragEl, rootEl, oldIndex, newIndex);
                                    _dispatchEvent(this, rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
                                }
                            }
                        }

                        if (Sortable.active) {
                            /* jshint eqnull:true */
                            if (newIndex == null || newIndex === -1) {
                                newIndex = oldIndex;
                            }

                            _dispatchEvent(this, rootEl, 'end', dragEl, rootEl, oldIndex, newIndex);

                            // Save sorting
                            this.save();
                        }
                    }

                }

                this._nulling();
            },

            _nulling: function() {
                rootEl =
                    dragEl =
                        parentEl =
                            ghostEl =
                                nextEl =
                                    cloneEl =

                                        scrollEl =
                                            scrollParentEl =

                                                tapEvt =
                                                    touchEvt =

                                                        moved =
                                                            newIndex =

                                                                lastEl =
                                                                    lastCSS =

                                                                        putSortable =
                                                                            activeGroup =
                                                                                Sortable.active = null;
            },

            handleEvent: function (/**Event*/evt) {
                var type = evt.type;

                if (type === 'dragover' || type === 'dragenter') {
                    if (dragEl) {
                        this._onDragOver(evt);
                        _globalDragOver(evt);
                    }
                }
                else if (type === 'drop' || type === 'dragend') {
                    this._onDrop(evt);
                }
            },


            /**
             * Serializes the item into an array of string.
             * @returns {String[]}
             */
            toArray: function () {
                var order = [],
                    el,
                    children = this.el.children,
                    i = 0,
                    n = children.length,
                    options = this.options;

                for (; i < n; i++) {
                    el = children[i];
                    if (_closest(el, options.draggable, this.el)) {
                        order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
                    }
                }

                return order;
            },


            /**
             * Sorts the elements according to the array.
             * @param  {String[]}  order  order of the items
             */
            sort: function (order) {
                var items = {}, rootEl = this.el;

                this.toArray().forEach(function (id, i) {
                    var el = rootEl.children[i];

                    if (_closest(el, this.options.draggable, rootEl)) {
                        items[id] = el;
                    }
                }, this);

                order.forEach(function (id) {
                    if (items[id]) {
                        rootEl.removeChild(items[id]);
                        rootEl.appendChild(items[id]);
                    }
                });
            },


            /**
             * Save the current sorting
             */
            save: function () {
                var store = this.options.store;
                store && store.set(this);
            },


            /**
             * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
             * @param   {HTMLElement}  el
             * @param   {String}       [selector]  default: `options.draggable`
             * @returns {HTMLElement|null}
             */
            closest: function (el, selector) {
                return _closest(el, selector || this.options.draggable, this.el);
            },


            /**
             * Set/get option
             * @param   {string} name
             * @param   {*}      [value]
             * @returns {*}
             */
            option: function (name, value) {
                var options = this.options;

                if (value === void 0) {
                    return options[name];
                } else {
                    options[name] = value;

                    if (name === 'group') {
                        _prepareGroup(options);
                    }
                }
            },


            /**
             * Destroy
             */
            destroy: function () {
                var el = this.el;

                el[expando] = null;

                _off(el, 'mousedown', this._onTapStart);
                _off(el, 'touchstart', this._onTapStart);

                if (this.nativeDraggable) {
                    _off(el, 'dragover', this);
                    _off(el, 'dragenter', this);
                }

                // Remove draggable attributes
                Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
                    el.removeAttribute('draggable');
                });

                touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

                this._onDrop();

                this.el = el = null;
            }
        };


        function _cloneHide(state) {
            if (cloneEl && (cloneEl.state !== state)) {
                _css(cloneEl, 'display', state ? 'none' : '');
                !state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);
                cloneEl.state = state;
            }
        }


        function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
            if (el) {
                ctx = ctx || document;

                do {
                    if ((selector === '>*' && el.parentNode === ctx) || _matches(el, selector)) {
                        return el;
                    }
                    /* jshint boss:true */
                } while (el = _getParentOrHost(el));
            }

            return null;
        }


        function _getParentOrHost(el) {
            var parent = el.host;

            return (parent && parent.nodeType) ? parent : el.parentNode;
        }


        function _globalDragOver(/**Event*/evt) {
            if (evt.dataTransfer) {
                evt.dataTransfer.dropEffect = 'move';
            }
            evt.preventDefault();
        }


        function _on(el, event, fn) {
            el.addEventListener(event, fn, false);
        }


        function _off(el, event, fn) {
            el.removeEventListener(event, fn, false);
        }


        function _toggleClass(el, name, state) {
            if (el) {
                if (el.classList) {
                    el.classList[state ? 'add' : 'remove'](name);
                }
                else {
                    var className = (' ' + el.className + ' ').replace(RSPACE, ' ').replace(' ' + name + ' ', ' ');
                    el.className = (className + (state ? ' ' + name : '')).replace(RSPACE, ' ');
                }
            }
        }


        function _css(el, prop, val) {
            var style = el && el.style;

            if (style) {
                if (val === void 0) {
                    if (document.defaultView && document.defaultView.getComputedStyle) {
                        val = document.defaultView.getComputedStyle(el, '');
                    }
                    else if (el.currentStyle) {
                        val = el.currentStyle;
                    }

                    return prop === void 0 ? val : val[prop];
                }
                else {
                    if (!(prop in style)) {
                        prop = '-webkit-' + prop;
                    }

                    style[prop] = val + (typeof val === 'string' ? '' : 'px');
                }
            }
        }


        function _find(ctx, tagName, iterator) {
            if (ctx) {
                var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

                if (iterator) {
                    for (; i < n; i++) {
                        iterator(list[i], i);
                    }
                }

                return list;
            }

            return [];
        }



        function _dispatchEvent(sortable, rootEl, name, targetEl, fromEl, startIndex, newIndex) {
            sortable = (sortable || rootEl[expando]);

            var evt = document.createEvent('Event'),
                options = sortable.options,
                onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

            evt.initEvent(name, true, true);

            evt.to = rootEl;
            evt.from = fromEl || rootEl;
            evt.item = targetEl || rootEl;
            evt.clone = cloneEl;

            evt.oldIndex = startIndex;
            evt.newIndex = newIndex;

            rootEl.dispatchEvent(evt);

            if (options[onName]) {
                options[onName].call(sortable, evt);
            }
        }


        function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt) {
            var evt,
                sortable = fromEl[expando],
                onMoveFn = sortable.options.onMove,
                retVal;

            evt = document.createEvent('Event');
            evt.initEvent('move', true, true);

            evt.to = toEl;
            evt.from = fromEl;
            evt.dragged = dragEl;
            evt.draggedRect = dragRect;
            evt.related = targetEl || toEl;
            evt.relatedRect = targetRect || toEl.getBoundingClientRect();

            fromEl.dispatchEvent(evt);

            if (onMoveFn) {
                retVal = onMoveFn.call(sortable, evt, originalEvt);
            }

            return retVal;
        }


        function _disableDraggable(el) {
            el.draggable = false;
        }


        function _unsilent() {
            _silent = false;
        }


        /** @returns {HTMLElement|false} */
        function _ghostIsLast(el, evt) {
            var lastEl = el.lastElementChild,
                rect = lastEl.getBoundingClientRect();

            // 5 ??? min delta
            // abs ??? ???????????? ??????????????????, ?? ???? ?????????? ?????? ?????????????????? ????????????
            return (
                    (evt.clientY - (rect.top + rect.height) > 5) ||
                    (evt.clientX - (rect.right + rect.width) > 5)
                ) && lastEl;
        }


        /**
         * Generate id
         * @param   {HTMLElement} el
         * @returns {String}
         * @private
         */
        function _generateId(el) {
            var str = el.tagName + el.className + el.src + el.href + el.textContent,
                i = str.length,
                sum = 0;

            while (i--) {
                sum += str.charCodeAt(i);
            }

            return sum.toString(36);
        }

        /**
         * Returns the index of an element within its parent for a selected set of
         * elements
         * @param  {HTMLElement} el
         * @param  {selector} selector
         * @return {number}
         */
        function _index(el, selector) {
            var index = 0;

            if (!el || !el.parentNode) {
                return -1;
            }

            while (el && (el = el.previousElementSibling)) {
                if ((el.nodeName.toUpperCase() !== 'TEMPLATE') && (selector === '>*' || _matches(el, selector))) {
                    index++;
                }
            }

            return index;
        }

        function _matches(/**HTMLElement*/el, /**String*/selector) {
            if (el) {
                selector = selector.split('.');

                var tag = selector.shift().toUpperCase(),
                    re = new RegExp('\\s(' + selector.join('|') + ')(?=\\s)', 'g');

                return (
                    (tag === '' || el.nodeName.toUpperCase() == tag) &&
                    (!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)
                );
            }

            return false;
        }

        function _throttle(callback, ms) {
            var args, _this;

            return function () {
                if (args === void 0) {
                    args = arguments;
                    _this = this;

                    setTimeout(function () {
                        if (args.length === 1) {
                            callback.call(_this, args[0]);
                        } else {
                            callback.apply(_this, args);
                        }

                        args = void 0;
                    }, ms);
                }
            };
        }

        function _extend(dst, src) {
            if (dst && src) {
                for (var key in src) {
                    if (src.hasOwnProperty(key)) {
                        dst[key] = src[key];
                    }
                }
            }

            return dst;
        }

        function _clone(el) {
            return $
                ? $(el).clone(true)[0]
                : (Polymer && Polymer.dom
                    ? Polymer.dom(el).cloneNode(true)
                    : el.cloneNode(true)
            );
        }


        // Export utils
        Sortable.utils = {
            on: _on,
            off: _off,
            css: _css,
            find: _find,
            is: function (el, selector) {
                return !!_closest(el, selector, el);
            },
            extend: _extend,
            throttle: _throttle,
            closest: _closest,
            toggleClass: _toggleClass,
            clone: _clone,
            index: _index
        };


        /**
         * Create sortable instance
         * @param {HTMLElement}  el
         * @param {Object}      [options]
         */
        Sortable.create = function (el, options) {
            return new Sortable(el, options);
        };


        // Export
        Sortable.version = '1.4.2';
        return Sortable;
    });
    });
    var sortable_min_1 = sortable_min.Sortable;

    const $$h = jQuery;
    class ImagesFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchType = options.searchType || 'fulltext';
            this.mediaUploader = external.mediaUploader;
            this.button_text = options.button_text || 'Browse...';
            this.db_type = 'text';
            this.label = options.label || 'Images';
            this.name = options.name || 'images';
            this.images = this.value || [];
            this.value = JSON.stringify(this.value);
        }
        init() {
            super.init();
            this.redrawImages();
        }
        setDomElements() {
            super.setDomElements();
        }
        getData() {
            this.updateData();
            return { name: this.name, value: this.images };
        }
        getSchema() {
            let schema = super.getSchema();
            schema.button_text = this.button_text;
            return schema;
        }
        updateData() {
            let newListOfImages = [];
            $$h(this.domElements.main).find('.mapsvg-thumbnail-wrap').each(function (index, el) {
                var imageData = $$h(el).data('image');
                newListOfImages.push(imageData);
            });
            this.images = newListOfImages;
            this.value = JSON.stringify(this.images);
            $$h(this.domElements.main).find('input').val(this.value);
        }
        setEventHandlers() {
            super.setEventHandlers();
            if (this.formBuilder.editMode) {
                return;
            }
            let _this = this;
            var imageDOM = $$h(this.domElements.main).find('.mapsvg-data-images');
            this.external.mediaUploader.on('select', function () {
                var attachments = _this.external.mediaUploader.state().get('selection').toJSON();
                attachments.forEach(function (img) {
                    let image;
                    image = { sizes: {} };
                    for (var type in img.sizes) {
                        image[type] = img.sizes[type].url.replace('http://', '//').replace('https://', '//');
                        image.sizes[type] = { width: img.sizes[type].width, height: img.sizes[type].height };
                    }
                    if (!image.thumbnail) {
                        image.thumbnail = image.full;
                        image.sizes.thumbnail = { width: img.sizes.full.width, height: img.sizes.full.height };
                    }
                    if (!image.medium) {
                        image.medium = image.full;
                        image.sizes.medium = { width: img.sizes.full.width, height: img.sizes.full.height };
                    }
                    image.caption = img.caption;
                    image.description = img.description;
                    _this.images.push(image);
                });
                _this.value = JSON.stringify(this.images);
                _this.redrawImages();
            });
            $$h(_this.domElements.main).on('click', '.mapsvg-upload-image', function (e) {
                e.preventDefault();
                _this.external.mediaUploader.open();
            });
            $$h(_this.domElements.main).on('click', '.mapsvg-image-delete', function (e) {
                e.preventDefault();
                $$h(this).closest('.mapsvg-thumbnail-wrap').remove();
                _this.updateData();
            });
            _this.sortable = new sortable_min(imageDOM[0], {
                animation: 150,
                onStart: function () {
                    $$h(_this.domElements.main).addClass('sorting');
                },
                onEnd: function (evt) {
                    _this.images = [];
                    $$h(_this.domElements.main).find('img').each(function (i, image) {
                        _this.images.push($$h(image).data('image'));
                    });
                    this.value = JSON.stringify(_this.images);
                    $$h(_this.domElements.main).find('input').val(this.value);
                    $$h(_this.domElements.main).removeClass('sorting');
                }
            });
        }
        redrawImages() {
            var imageDOM = $$h(this.domElements.main).find('.mapsvg-data-images');
            imageDOM.empty();
            this.images && this.images.forEach(function (image) {
                var img = $$h('<img class="mapsvg-data-thumbnail" />').attr('src', image.thumbnail).data('image', image);
                var imgContainer = $$h('<div class="mapsvg-thumbnail-wrap"></div>').data('image', image);
                imgContainer.append(img);
                imgContainer.append('<i class="fa fa-times  mapsvg-image-delete"></i>');
                imageDOM.append(imgContainer);
            });
            $$h(this.domElements.main).find('input').val(this.value);
        }
        ;
    }

    const $$i = jQuery;
    class LocationFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.location = this.value;
            this.label = this.label || (options.label === undefined ? 'Location' : options.label);
            this.name = 'location';
            this.db_type = 'text';
            this.languages = [{ "value": "sq", "label": "Albanian" }, { "value": "ar", "label": "Arabic" }, {
                    "value": "eu",
                    "label": "Basque"
                }, { "value": "be", "label": "Belarusian" }, { "value": "bg", "label": "Bulgarian" }, {
                    "value": "my",
                    "label": "Burmese"
                }, { "value": "bn", "label": "Bengali" }, { "value": "ca", "label": "Catalan" }, {
                    "value": "zh-cn",
                    "label": "Chinese (simplified)"
                }, { "value": "zh-tw", "label": "Chinese (traditional)" }, {
                    "value": "hr",
                    "label": "Croatian"
                }, { "value": "cs", "label": "Czech" }, { "value": "da", "label": "Danish" }, {
                    "value": "nl",
                    "label": "Dutch"
                }, { "value": "en", "label": "English" }, {
                    "value": "en-au",
                    "label": "English (australian)"
                }, { "value": "en-gb", "label": "English (great Britain)" }, {
                    "value": "fa",
                    "label": "Farsi"
                }, { "value": "fi", "label": "Finnish" }, { "value": "fil", "label": "Filipino" }, {
                    "value": "fr",
                    "label": "French"
                }, { "value": "gl", "label": "Galician" }, { "value": "de", "label": "German" }, {
                    "value": "el",
                    "label": "Greek"
                }, { "value": "gu", "label": "Gujarati" }, { "value": "iw", "label": "Hebrew" }, {
                    "value": "hi",
                    "label": "Hindi"
                }, { "value": "hu", "label": "Hungarian" }, { "value": "id", "label": "Indonesian" }, {
                    "value": "it",
                    "label": "Italian"
                }, { "value": "ja", "label": "Japanese" }, { "value": "kn", "label": "Kannada" }, {
                    "value": "kk",
                    "label": "Kazakh"
                }, { "value": "ko", "label": "Korean" }, { "value": "ky", "label": "Kyrgyz" }, {
                    "value": "lt",
                    "label": "Lithuanian"
                }, { "value": "lv", "label": "Latvian" }, { "value": "mk", "label": "Macedonian" }, {
                    "value": "ml",
                    "label": "Malayalam"
                }, { "value": "mr", "label": "Marathi" }, { "value": "no", "label": "Norwegian" }, {
                    "value": "pl",
                    "label": "Polish"
                }, { "value": "pt", "label": "Portuguese" }, {
                    "value": "pt-br",
                    "label": "Portuguese (brazil)"
                }, { "value": "pt-pt", "label": "Portuguese (portugal)" }, {
                    "value": "pa",
                    "label": "Punjabi"
                }, { "value": "ro", "label": "Romanian" }, { "value": "ru", "label": "Russian" }, {
                    "value": "sr",
                    "label": "Serbian"
                }, { "value": "sk", "label": "Slovak" }, { "value": "sl", "label": "Slovenian" }, {
                    "value": "es",
                    "label": "Spanish"
                }, { "value": "sv", "label": "Swedish" }, { "value": "tl", "label": "Tagalog" }, {
                    "value": "ta",
                    "label": "Tamil"
                }, { "value": "te", "label": "Telugu" }, { "value": "th", "label": "Thai" }, {
                    "value": "tr",
                    "label": "Turkish"
                }, { "value": "uk", "label": "Ukrainian" }, { "value": "uz", "label": "Uzbek" }, {
                    "value": "vi",
                    "label": "Vietnamese"
                }];
            this.language = options.language;
            this.markerImages = MapSVG.markerImages;
            this.markersByField = options.markersByField;
            this.markerField = options.markerField;
            this.markersByFieldEnabled = MapSVG.parseBoolean(options.markersByFieldEnabled);
            this.templates.marker = Handlebars.compile($$i('#mapsvg-data-tmpl-marker').html());
        }
        init() {
            super.init();
            this.location && this.location.marker && this.renderMarker();
        }
        getSchema() {
            let schema = super.getSchema();
            schema.language = this.language;
            schema.markersByField = this.markersByField;
            schema.markerField = this.markerField;
            schema.markersByFieldEnabled = MapSVG.parseBoolean(this.markersByFieldEnabled);
            return schema;
        }
        getData() {
            return { name: this.name, value: this.location ? this.location.getData() : {} };
        }
        getDataForTemplate() {
            let data = super.getDataForTemplate();
            if (this.formBuilder.admin) {
                data.languages = this.languages;
                data.markerImages = MapSVG.markerImages;
                data.markersByField = this.markersByField;
                data.markerField = this.markerField;
                data.markersByFieldEnabled = MapSVG.parseBoolean(this.markersByFieldEnabled);
                var _this = this;
                data.markerImages.forEach(function (m) {
                    if (m.url === _this.formBuilder.mapsvg.getData().options.defaultMarkerImage) {
                        m.default = true;
                    }
                    else {
                        m.default = false;
                    }
                });
            }
            data.language = this.language;
            if (this.location) {
                data.location = this.location;
                if (this.location.marker) {
                    data.location.img = (this.location.marker.src.indexOf(MapSVG.urls.uploads) === 0 ? 'uploads/' : '') + (this.location.marker.src.split('/').pop());
                }
            }
            return data;
        }
        initEditor() {
            super.initEditor();
            this.fillMarkersByFieldOptions(this.markerField);
        }
        setEventHandlers() {
            super.setEventHandlers();
            var _this = this;
            let server = new Server();
            if (_this.formBuilder.mapsvg.isGeo()) {
                var locations = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('formatted_address'),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    remote: {
                        url: server.getUrl('geocoding') + '?address=%QUERY%&language=' + this.language,
                        wildcard: '%QUERY%',
                        transform: function (response) {
                            if (response.error_message) {
                                alert(response.error_message);
                            }
                            return response.results;
                        },
                        rateLimitWait: 600
                    }
                });
                var thContainer = $$i(this.domElements.main).find('.typeahead');
                var tH = thContainer.typeahead({
                    minLength: 3
                }, {
                    name: 'mapsvg-addresses',
                    display: 'formatted_address',
                    source: locations
                });
                thContainer.on('typeahead:select', function (ev, item) {
                    _this.location && _this.location.marker && _this.deleteMarker();
                    let address;
                    address = {};
                    address.formatted = item.formatted_address;
                    item.address_components.forEach(function (addr_item) {
                        var type = addr_item.types[0];
                        address[type] = addr_item.long_name;
                        if (addr_item.short_name != addr_item.long_name) {
                            address[type + '_short'] = addr_item.short_name;
                        }
                    });
                    var locationData = {
                        address: address,
                        geoPoint: new GeoPoint(item.geometry.location.lat, item.geometry.location.lng),
                        img: _this.formBuilder.mapsvg.getMarkerImage(_this.formBuilder.getData())
                    };
                    _this.location = new Location(locationData);
                    _this.formBuilder.location = _this.location;
                    var marker = new Marker({
                        location: _this.location,
                        mapsvg: _this.formBuilder.mapsvg
                    });
                    _this.location.marker = marker;
                    _this.formBuilder.mapsvg.markerAdd(_this.location.marker);
                    _this.formBuilder.mapsvg.setEditingMarker(marker);
                    _this.formBuilder.markerBackup = marker.getOptions();
                    _this.renderMarker();
                    var select = $$i(_this.formBuilder.view).find('select[name="regions"]');
                    if (_this.formBuilder.mapsvg.options.source.indexOf('/geo-calibrated/usa.svg') !== -1) {
                        if (select.length !== 0 && _this.location.address.state_short) {
                            select.val(['US-' + _this.location.address.state_short]);
                            select.trigger('change');
                        }
                    }
                    else if (_this.formBuilder.mapsvg.options.source.indexOf('/geo-calibrated/world.svg') !== -1) {
                        if (select.length !== 0 && _this.location.address.country_short) {
                            select.val([_this.location.address.country_short]);
                            select.trigger('change');
                        }
                    }
                    else {
                        if (select.length !== 0 && _this.location.address.administrative_area_level_1) {
                            _this.formBuilder.mapsvg.regions.forEach((_region) => {
                                if (_region.title === _this.location.address.administrative_area_level_1
                                    ||
                                        _region.title === _this.location.address.administrative_area_level_2
                                    ||
                                        _region.id === _this.location.address.country_short + '-' + _this.location.address.administrative_area_level_1_short) {
                                    select.val([_region.id]);
                                    select.trigger('change');
                                }
                            });
                        }
                    }
                    thContainer.typeahead('val', '');
                });
            }
            $$i(this.domElements.main).on('click', '.mapsvg-marker-image-btn-trigger', function (e) {
                $$i(this).toggleClass('active');
                _this.toggleMarkerSelector.call(_this, $$i(this), e);
            });
            $$i(this.domElements.main).on('click', '.mapsvg-marker-delete', function (e) {
                e.preventDefault();
                _this.deleteMarker();
            });
        }
        setEditorEventHandlers() {
            super.setEditorEventHandlers();
            var _this = this;
            var imgSelector = $$i('#marker-file-uploader').closest('.form-group').find('.mapsvg-marker-image-selector');
            $$i(this.domElements.edit).on('change', 'select[name="markerField"]', function () {
                var fieldName = $$i(this).val();
                _this.fillMarkersByFieldOptions(fieldName);
            });
            $$i(this.domElements.edit).on('click', '.mapsvg-marker-image-btn-trigger', function (e) {
                $$i(this).toggleClass('active');
                _this.toggleMarkerSelectorInLocationEditor.call(_this, $$i(this), e);
            });
            $$i(this.domElements.edit).on('change', '#marker-file-uploader', function () {
                let uploadBtn = $$i(this).closest('.btn-file')._button('loading');
                for (var i = 0; i < this.files.length; i++) {
                    var data = new FormData();
                    data.append('file', this.files[0]);
                    data.append('action', 'mapsvg_marker_upload');
                    data.append('_wpnonce', MapSVG.nonce);
                    $$i.ajax({
                        url: MapSVG.urls.ajaxurl,
                        type: "POST",
                        data: data,
                        processData: false,
                        contentType: false
                    }).done(function (resp) {
                        resp = JSON.parse(resp);
                        if (resp.error) {
                            alert(resp.error);
                        }
                        else {
                            var newMarker = '<button class="btn btn-default mapsvg-marker-image-btn mapsvg-marker-image-btn-choose">'
                                + '<img src="' + resp.url + '" />'
                                + '</button>';
                            $$i(newMarker).appendTo(imgSelector);
                            MapSVG.markerImages.push(resp);
                        }
                    }).always(function () {
                        uploadBtn._button('reset');
                    });
                }
            });
        }
        updateData() {
        }
        mayBeAddDistanceRow() {
            var _this = this;
            if (!this.domElements.editDistanceRow) {
                this.domElements.editDistanceRow = $$i($$i('#mapsvg-edit-distance-row').html())[0];
            }
            var z = $$i(this.domElements.edit).find('.mapsvg-edit-distance-row:last-child input');
            if (z && z.last() && z.last().val() && (z.last().val() + '').trim().length) {
                var newRow = $$i(this.templates.editDistanceRow).clone();
                newRow.insertAfter($$i(_this.domElements.edit).find('.mapsvg-edit-distance-row:last-child'));
            }
            var rows = $$i(_this.domElements.edit).find('.mapsvg-edit-distance-row');
            var row1 = rows.eq(rows.length - 2);
            var row2 = rows.eq(rows.length - 1);
            if (row1.length && row2.length && !row1.find('input:eq(0)').val().toString().trim() && !row2.find('input:eq(0)').val().toString().trim()) {
                row2.remove();
            }
        }
        ;
        fillMarkersByFieldOptions(fieldName) {
            var _this = this;
            var field = _this.formBuilder.mapsvg.objectsRepository.getSchema().getField(fieldName);
            if (field) {
                var markerImg = _this.formBuilder.mapsvg.options.defaultMarkerImage;
                var rows = [];
                field.options.forEach(function (option) {
                    var img = _this.markersByField && _this.markersByField[option.value] ? _this.markersByField[option.value] : markerImg;
                    rows.push('<tr data-option-id="' + option.value + '"><td>' + option.label + '</td><td><button class="btn btn-default mapsvg-marker-image-btn-trigger mapsvg-marker-image-btn"><img src="' + img + '" class="new-marker-img" style="margin-right: 4px;"/><span class="caret"></span></button></td></tr>');
                });
                $$i("#markers-by-field").empty().append(rows);
            }
        }
        ;
        renderMarker(marker) {
            if (!this.location && !(marker && marker.location)) {
                return false;
            }
            if (marker && marker.location) {
                this.location = marker.location;
            }
            $$i(this.domElements.main).find('.mapsvg-new-marker').show().html(this.templates.marker(this.location));
            this.location.marker.events.on('change', () => {
                this.renderMarker();
            });
        }
        ;
        toggleMarkerSelector(jQueryObj, e) {
            e.preventDefault();
            var _this = this;
            if (_this.domElements.markerSelector && $$i(_this.domElements.markerSelector).is(':visible')) {
                $$i(_this.domElements.markerSelector).hide();
                return;
            }
            if (_this.domElements.markerSelector && $$i(_this.domElements.markerSelector).not(':visible')) {
                $$i(_this.domElements.markerSelector).show();
                return;
            }
            _this.domElements.markerImageButton = jQueryObj.find('img')[0];
            var currentImage = $$i(_this.domElements.markerImageButton).attr('src');
            var images = MapSVG.markerImages.map(function (image) {
                return '<button class="btn btn-default mapsvg-marker-image-btn mapsvg-marker-image-btn-choose ' + (currentImage == image.url ? 'active' : '') + '"><img src="' + image.url + '" /></button>';
            });
            if (!_this.domElements.markerSelector) {
                _this.domElements.markerSelector = $$i(this.domElements.main).find('.mapsvg-marker-image-selector')[0];
            }
            if (_this.domElements.markerSelector) {
                $$i(_this.domElements.markerSelector).empty();
            }
            if (_this.formBuilder.markerBackup) {
                $$i(_this.domElements.markerSelector).data('marker', _this.formBuilder.markerBackup);
            }
            else {
                $$i(_this.domElements.markerSelector).data('marker', null);
            }
            $$i(_this.domElements.markerSelector).html(images.join(''));
            $$i(_this.domElements.markerSelector).on('click', '.mapsvg-marker-image-btn-choose', function (e) {
                e.preventDefault();
                var src = $$i(this).find('img').attr('src');
                if (_this.formBuilder.markerBackup) {
                    var marker = _this.formBuilder.mapsvg.getMarker(_this.formBuilder.markerBackup.id);
                    marker.setImage(src);
                }
                $$i(_this.domElements.markerSelector).hide();
                $$i(_this.domElements.main).find('.mapsvg-marker-image-btn-trigger').toggleClass('active', false);
                $$i(_this.domElements.markerImageButton).attr('src', src);
            });
        }
        ;
        toggleMarkerSelectorInLocationEditor(jQueryObj, e) {
            e.preventDefault();
            var _this = this;
            if (jQueryObj.data('markerSelector') && jQueryObj.data('markerSelector').is(':visible')) {
                jQueryObj.data('markerSelector').hide();
                return;
            }
            if (jQueryObj.data('markerSelector') && jQueryObj.data('markerSelector').not(':visible')) {
                jQueryObj.data('markerSelector').show();
                return;
            }
            var markerBtn = $$i(this).closest('td').find('.mapsvg-marker-image-btn-trigger');
            var currentImage = markerBtn.attr('src');
            var images = MapSVG.markerImages.map(function (image) {
                return '<button class="btn btn-default mapsvg-marker-image-btn mapsvg-marker-image-btn-choose ' + (currentImage == image.url ? 'active' : '') + '"><img src="' + image.url + '" /></button>';
            });
            if (!jQueryObj.data('markerSelector')) {
                var ms = $$i('<div class="mapsvg-marker-image-selector"></div>');
                jQueryObj.closest('td').append(ms);
                jQueryObj.data('markerSelector', ms);
            }
            else {
                jQueryObj.data('markerSelector').empty();
            }
            jQueryObj.data('markerSelector').html(images.join(''));
            jQueryObj.data('markerSelector').on('click', '.mapsvg-marker-image-btn-choose', function (e) {
                e.preventDefault();
                var src = $$i(this).find('img').attr('src');
                jQueryObj.data('markerSelector').hide();
                var td = $$i(this).closest('td');
                var fieldId = $$i(this).closest('tr').data('option-id');
                var btn = td.find('.mapsvg-marker-image-btn-trigger');
                btn.toggleClass('active', false);
                btn.find('img').attr('src', src);
                _this.setMarkerByField(fieldId, src);
            });
        }
        ;
        setMarkerByField(fieldId, markerImg) {
            this.markersByField = this.markersByField || {};
            this.markersByField[fieldId] = markerImg;
        }
        ;
        deleteMarker() {
            var _this = this;
            if (this.formBuilder.backupData) {
                this.formBuilder.backupData.location = this.location;
                this.formBuilder.backupData.marker = this.marker;
            }
            else {
                this.formBuilder.backupData = {
                    location: this.location,
                    marker: this.marker
                };
            }
            this.location = null;
            this.marker = null;
            if (this.formBuilder.markerBackup) {
                this.formBuilder.mapsvg.getMarker(this.formBuilder.markerBackup.id).delete();
                _this.formBuilder.mapsvg.editingMarker = null;
            }
            $$i(this.domElements.main).find('.mapsvg-new-marker').hide();
            $$i(this.domElements.main).find('.mapsvg-marker-id').attr('disabled', 'disabled');
        }
        ;
        destroy() {
            if ($$i().mselect2) {
                var sel = $$i(this.domElements.main).find('.mapsvg-select2');
                if (sel.length) {
                    sel.mselect2('destroy');
                }
            }
            this.domElements.markerSelector && $$i(this.domElements.markerSelector).popover('destroy');
        }
    }

    const $$j = jQuery;
    class ModalFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.showButtonText = options.showButtonText;
        }
        getSchema() {
            let schema = super.getSchema();
            schema.showButtonText = this.showButtonText;
            return schema;
        }
    }

    const $$k = jQuery;
    class PostFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            if (this.formBuilder.admin)
                this.post_types = this.formBuilder.admin.getPostTypes();
            this.post_type = options.post_type || this.post_types[0];
            this.add_fields = MapSVG.parseBoolean(options.add_fields);
            this.db_type = 'int(11)';
            this.name = 'post_id';
            this.post_id = options.post_id;
            this.post = options.post;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.postSelect = $$k(this.domElements.main).find(".mapsvg-find-post")[0];
            this.inputs.postId = $$k(this.domElements.main).find('input[name="post_id"]')[0];
        }
        getSchema() {
            let schema = super.getSchema();
            schema.post_type = this.post_type;
            schema.add_fields = this.add_fields;
            return schema;
        }
        destroy() {
            if ($$k().mselect2) {
                let sel = $$k(this.domElements.main).find('.mapsvg-select2');
                if (sel.length) {
                    sel.mselect2('destroy');
                }
            }
        }
        getDataForTemplate() {
            let data = super.getDataForTemplate();
            if (this.formBuilder.admin)
                data.post_types = this.formBuilder.admin.getPostTypes();
            data.post_type = this.post_type;
            data.post = this.post;
            data.add_fields = this.add_fields || 0;
            return data;
        }
        setEventHandlers() {
            super.setEventHandlers();
            let _this = this;
            let server = new Server();
            $$k(this.inputs.postSelect).mselect2({
                placeholder: 'Search post by title',
                allowClear: true,
                ajax: {
                    url: server.getUrl('posts'),
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            filters: { post_type: _this.post_type },
                            search: params.term,
                            page: params.page
                        };
                    },
                    processResults: function (data, params) {
                        params.page = params.page || 1;
                        return {
                            results: data.posts ? data.posts : [],
                            pagination: {
                                more: false
                            }
                        };
                    },
                    cache: true
                },
                escapeMarkup: function (markup) {
                    return markup;
                },
                minimumInputLength: 1,
                templateResult: formatRepo,
                templateSelection: formatRepoSelection
            }).on('select2:select', function (e) {
                _this.post = e.params.data;
                $$k(_this.domElements.main).find(".mapsvg-post-id").text(_this.post.id);
                $$k(_this.domElements.main).find(".mapsvg-post-url").text(_this.post.url).attr('href', _this.post.url);
                $$k(_this.inputs.postId).val(_this.post.id);
                _this.value = _this.post.id;
                _this.events.trigger('change');
            }).on('change', function (e) {
                if (e.target.value === '') {
                    $$k(_this.domElements.main).find(".mapsvg-post-id").text('');
                    $$k(_this.domElements.main).find(".mapsvg-post-url").text('');
                    $$k(_this.inputs.postId).val('');
                    _this.value = '';
                    _this.events.trigger('change');
                }
            });
            function formatRepo(repo) {
                if (repo.loading) {
                    return repo.text;
                }
                else {
                    return "<div class='select2-result-repository clearfix'>" +
                        repo.post_title + "</div>";
                }
            }
            function formatRepoSelection(repo) {
                return repo.post_title || repo.text;
            }
        }
    }

    const $$l = jQuery;
    class RadioFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.setOptions(options.options);
        }
        setDomElements() {
            super.setDomElements();
            this.radiosjQueryObject = $$l(this.domElements.main).find('input[type="radio"]');
        }
        setEventHandlers() {
            super.setEventHandlers();
            this.radiosjQueryObject.on('change', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
    }

    const $$m = jQuery;
    class RegionsFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchable = MapSVG.parseBoolean(options.searchable);
            this.options = this.formBuilder.getRegionsList();
            this.label = 'Regions';
            this.name = 'regions';
            this.db_type = 'text';
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.select = $$m(this.domElements.main).find('select')[0];
        }
        getData() {
            let data;
            let table = this.formBuilder.mapsvg.regionsRepository.getSchema().name;
            data = $$m(this.inputs.select).val() || [];
            let data2 = {};
            if (data && data.length > 0) {
                data = data.map((rId) => {
                    let region = this.external.regions.findById(rId);
                    return { id: region.id, title: region.title };
                });
                data2[table] = data;
            }
            return { name: 'regions', value: data2 };
        }
        getSchema() {
            let schema = super.getSchema();
            if (schema.multiselect)
                schema.db_type = 'text';
            var opts = $$m.extend(true, {}, { options: this.options });
            schema.options = opts.options;
            schema.optionsDict = {};
            schema.options.forEach(function (option) {
                schema.optionsDict[option.id] = option.title || option.id;
            });
            return schema;
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$m(this.inputs.select).on('change', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
        destroy() {
            if ($$m().mselect2) {
                var sel = $$m(this.domElements.main).find('.mapsvg-select2');
                if (sel.length) {
                    sel.mselect2('destroy');
                }
            }
        }
    }

    const $$n = jQuery;
    class SaveFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.readonly = true;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.btnSave = $$n(this.domElements.main).find('.btn-save')[0];
            this.inputs.btnClose = $$n(this.domElements.main).find('.btn-close')[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$n(this.inputs.btnSave).on('click', () => {
                this.events.trigger('click.btn.save');
            });
            $$n(this.inputs.btnClose).on('click', () => {
                this.events.trigger('click.btn.close');
            });
        }
    }

    const $$o = jQuery;
    class SearchFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchType = options.searchType || 'fulltext';
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.text = $$o(this.domElements.main).find('input')[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$o(this.inputs.text).on('change keyup paste', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
        getSchema() {
            let schema = super.getSchema();
            schema.searchFallback = MapSVG.parseBoolean(this.searchFallback);
            schema.placeholder = this.placeholder;
            schema.noResultsText = this.noResultsText;
            schema.width = this.width;
            return schema;
        }
    }

    const $$p = jQuery;
    class SelectFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchable = MapSVG.parseBoolean(options.searchable);
            this.setOptions(options.options);
            this.multiselect = MapSVG.parseBoolean(options.multiselect);
            this.optionsGrouped = options.optionsGrouped;
            this.db_type = this.multiselect ? 'text' : 'varchar(255)';
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.select = $$p(this.domElements.main).find('select')[0];
        }
        getSchema() {
            let schema = super.getSchema();
            schema.multiselect = MapSVG.parseBoolean(this.multiselect);
            if (schema.multiselect)
                schema.db_type = 'text';
            schema.optionsGrouped = this.optionsGrouped;
            var opts = $$p.extend(true, {}, { options: this.options });
            schema.options = opts.options || [];
            schema.optionsDict = {};
            schema.options.forEach(function (option) {
                schema.optionsDict[option.value] = option.label;
            });
            return schema;
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$p(this.inputs.select).on('change', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
        addSelect2() {
            if ($$p().mselect2) {
                let select2Options;
                select2Options = {};
                if (this.formBuilder.filtersMode && this.type == 'select') {
                    select2Options.placeholder = this.placeholder;
                    if (!this.multiselect) {
                        select2Options.allowClear = true;
                    }
                }
                $$p(this.domElements.main).find('select').css({ width: '100%', display: 'block' })
                    .mselect2(select2Options)
                    .on('select2:focus', function () {
                    $$p(this).mselect2('open');
                });
                $$p(this.domElements.main).find('.select2-selection--multiple .select2-search__field').css('width', '100%');
            }
        }
        getData() {
            let data;
            data = $$p(this.inputs.select).val();
            if (this.multiselect) {
                if (data && data.length > 0) {
                    data = data.map((r) => {
                        return { value: r.value, label: r.label };
                    });
                }
            }
            return { name: this.name, value: data };
        }
    }

    const $$q = jQuery;
    class StatusFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.label = options.label || 'Status';
            this.name = 'status';
            this.setOptions(options.options);
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.select = $$q(this.domElements.main).find('select')[0];
            if ($$q().colorpicker) {
                $$q(this.domElements.main).find('.cpicker').colorpicker().on('changeColor.colorpicker', function (event) {
                    var input = $$q(this).find('input');
                    if (input.val() == '')
                        $$q(this).find('i').css({ 'background-color': '' });
                });
                this.domElements.edit && $$q(this.domElements.edit).find('.cpicker').colorpicker().on('changeColor.colorpicker', function (event) {
                    var input = $$q(this).find('input');
                    if (input.val() == '')
                        $$q(this).find('i').css({ 'background-color': '' });
                });
            }
        }
        destroy() {
            if ($$q().mselect2) {
                var sel = $$q(this.domElements.main).find('.mapsvg-select2');
                if (sel.length) {
                    sel.mselect2('destroy');
                }
            }
        }
        setEditorEventHandlers() {
            super.setEditorEventHandlers();
            var _this = this;
            $$q(this.domElements.edit).on('keyup change paste', '.mapsvg-edit-status-row input', function () {
                _this.mayBeAddStatusRow();
            });
        }
        initEditor() {
            super.initEditor();
            var _this = this;
            $$q(_this.domElements.edit).find('.cpicker').colorpicker().on('changeColor.colorpicker', function (event) {
                var input = $$q(this).find('input');
                var index = $$q(this).closest('tr').index();
                if (input.val() == '')
                    $$q(this).find('i').css({ 'background-color': '' });
                _this.options[index] = _this.options[index] || { label: '', value: '', color: '', disabled: false };
                _this.options[index]['color'] = input.val();
            });
            _this.mayBeAddStatusRow();
        }
        mayBeAddStatusRow() {
            var _this = this;
            let editStatusRow = $$q($$q('#mapsvg-edit-status-row').html());
            var z = $$q(_this.domElements.edit).find('.mapsvg-edit-status-label:last-child');
            if (z && z.last() && z.last().val() && (z.last().val() + '').trim().length) {
                var newRow = editStatusRow.clone();
                newRow.insertAfter($$q(_this.domElements.edit).find('.mapsvg-edit-status-row:last-child'));
                newRow.find('.cpicker').colorpicker().on('changeColor.colorpicker', function (event) {
                    var input = $$q(this).find('input');
                    var index = $$q(this).closest('tr').index();
                    if (input.val() == '')
                        $$q(this).find('i').css({ 'background-color': '' });
                    _this.options[index] = _this.options[index] || { label: '', value: '', color: '', disabled: false };
                    _this.options[index]['color'] = input.val();
                });
            }
            var rows = $$q(_this.domElements.edit).find('.mapsvg-edit-status-row');
            var row1 = rows.eq(rows.length - 2);
            var row2 = rows.eq(rows.length - 1);
            if (row1.length && row2.length &&
                !(row1.find('input:eq(0)').val().toString().trim() || row1.find('input:eq(1)').val().toString().trim() || row1.find('input:eq(2)').val().toString().trim())
                &&
                    !(row2.find('input:eq(0)').val().toString().trim() || row2.find('input:eq(1)').val().toString().trim() || row2.find('input:eq(2)').val().toString().trim())) {
                row2.remove();
            }
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$q(this.inputs.select).on('change keyup paste', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
        getSchema() {
            let schema = super.getSchema();
            var opts = $$q.extend(true, {}, { options: this.options });
            schema.options = opts.options;
            schema.optionsDict = {};
            schema.options.forEach(function (option, index) {
                if (schema.options[index].value === '') {
                    schema.options.splice(index, 1);
                }
                else {
                    schema.options[index].disabled = MapSVG.parseBoolean(schema.options[index].disabled);
                    schema.optionsDict[option.value] = option;
                }
            });
            return schema;
        }
    }

    const $$r = jQuery;
    class TextareaFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchType = options.searchType || 'fulltext';
            this.searchable = MapSVG.parseBoolean(options.searchable);
            this.autobr = options.autobr;
            this.html = options.html;
            this.db_type = 'text';
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.textarea = $$r(this.domElements.main).find('textarea')[0];
            if (this.html) {
                this.editor = CodeMirror.fromTextArea(this.inputs.textarea, {
                    mode: { name: "handlebars", base: "text/html" },
                    matchBrackets: true,
                    lineNumbers: true
                });
                if (this.formBuilder.admin) {
                    this.editor.on('change', this.setTextareaValue);
                }
            }
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$r(this.inputs.textarea).on('change keyup paste', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
        getSchema() {
            let schema = super.getSchema();
            schema.autobr = this.autobr;
            schema.html = this.html;
            return schema;
        }
        getDataForTemplate() {
            let data = super.getDataForTemplate();
            data.html = this.html;
            return data;
        }
        setTextareaValue(codemirror, changeobj) {
            var handler = codemirror.getValue();
            var textarea = $$r(codemirror.getTextArea());
            textarea.val(handler).trigger('change');
        }
        destroy() {
            var cm = $$r(this.domElements.main).find('.CodeMirror');
            if (cm.length) {
                cm.empty().remove();
            }
        }
    }

    const $$s = jQuery;
    class TextFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchFallback = MapSVG.parseBoolean(options.searchFallback);
            this.width = this.formBuilder.filtersHide && !this.formBuilder.modal ? null : (options.width || '100%');
            this.db_type = 'varchar(255)';
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.text = $$s(this.domElements.main).find('input[type="text"]')[0];
        }
        getSchema() {
            let schema = super.getSchema();
            schema.searchType = this.searchType;
            return schema;
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$s(this.inputs.text).on('change keyup paste', (e) => {
                this.value = e.target.value;
                this.events.trigger('changed', this, [this]);
            });
        }
    }

    const $$t = jQuery;
    class FormElementFactory {
        constructor(options) {
            this.mapsvg = options.mapsvg;
            this.editMode = options.editMode;
            this.filtersMode = options.filtersMode;
            this.namespace = options.namespace;
            this.mediaUploader = options.mediaUploader;
            this.formBuilder = options.formBuilder;
        }
        create(options) {
            let types = {
                'checkbox': CheckboxFormElement,
                'checkboxes': CheckboxesFormElement,
                'date': DateFormElement,
                'distance': DistanceFormElement,
                'empty': EmptyFormElement,
                'id': IdFormElement,
                'image': ImagesFormElement,
                'location': LocationFormElement,
                'modal': ModalFormElement,
                'post': PostFormElement,
                'radio': RadioFormElement,
                'region': RegionsFormElement,
                'save': SaveFormElement,
                'search': SearchFormElement,
                'select': SelectFormElement,
                'status': StatusFormElement,
                'text': TextFormElement,
                'textarea': TextareaFormElement,
            };
            var formElement = new types[options.type](options, this.formBuilder, this.getExtraParams());
            formElement.init();
            return formElement;
        }
        getExtraParams() {
            let databaseFields = [];
            this.mapsvg.objectsRepository.getSchema().getFields().forEach(function (obj) {
                if (obj.type == 'text' || obj.type == 'region' || obj.type == 'textarea' || obj.type == 'post' || obj.type == 'select' || obj.type == 'radio' || obj.type == 'checkbox') {
                    if (obj.type == 'post') {
                        databaseFields.push('Object.post.post_title');
                    }
                    else {
                        databaseFields.push('Object.' + obj.name);
                    }
                }
            });
            let databaseFieldsFilterableShort = [];
            databaseFieldsFilterableShort = this.mapsvg.objectsRepository.getSchema().getFieldsAsArray().filter(function (obj) {
                return (obj.type == 'select' || obj.type == 'radio' || obj.type == 'region');
            }).map(function (obj) {
                return obj.name;
            });
            let regionFields = this.mapsvg.regionsRepository.getSchema().getFieldsAsArray().map(function (obj) {
                if (obj.type == 'status' || obj.type == 'text' || obj.type == 'textarea' || obj.type == 'post' || obj.type == 'select' || obj.type == 'radio' || obj.type == 'checkbox') {
                    if (obj.type == 'post') {
                        return 'Region.post.post_title';
                    }
                    else {
                        return 'Region.' + obj.name;
                    }
                }
            });
            let regions = new ArrayIndexed('id');
            this.mapsvg.regions.forEach(region => {
                regions.push({ id: region.id, title: region.title });
            });
            return {
                databaseFields: databaseFields,
                databaseFieldsFilterableShort: databaseFieldsFilterableShort,
                regionFields: regionFields,
                regions: regions,
                mapIsGeo: this.mapsvg.isGeo(),
                mediaUploader: this.mediaUploader
            };
        }
    }

    const $$u = jQuery;
    class FormBuilder {
        constructor(options) {
            var _this = this;
            this.events = new Events();
            this.container = options.container;
            this.namespace = options.namespace;
            this.mediaUploader = options.mediaUploader;
            this.schema = options.schema || [];
            this.editMode = options.editMode == undefined ? false : options.editMode;
            this.filtersMode = options.filtersMode == undefined ? false : options.filtersMode;
            this.filtersHide = options.filtersHide == undefined ? false : options.filtersHide;
            this.modal = options.modal == undefined ? false : options.modal;
            this.admin = options.admin;
            this.mapsvg = options.mapsvg;
            this.data = options.data || {};
            this.clearButton = options.clearButton || false;
            this.clearButtonText = options.clearButtonText || '';
            this.showButtonText = options.showButtonText || '';
            this.formElementFactory = new FormElementFactory({
                mapsvg: this.mapsvg,
                formBuilder: this,
                mediaUploader: this.mediaUploader,
                editMode: this.editMode,
                filtersMode: this.filtersMode,
                namespace: this.namespace,
            });
            this.events = new Events(this);
            if (options.events && Object.keys(options.events).length > 0) {
                for (var eventName in options.events) {
                    this.events.on(eventName, options.events[eventName]);
                }
            }
            this.template = 'form-builder';
            this.closeOnSave = options.closeOnSave === true;
            this.newRecord = options.newRecord === true;
            this.types = options.types || ['text', 'textarea', 'checkbox', 'radio', 'select', 'image', 'region', 'location', 'post', 'date'];
            this.templates = {};
            this.elements = {};
            this.view = $$u('<div />').addClass('mapsvg-form-builder')[0];
            if (this.editMode)
                $$u(this.view).addClass('full-flex');
            this.formElements = new ArrayIndexed('name');
            if (!MapSVG.templatesLoaded[this.template]) {
                $$u.get(MapSVG.urls.templates + _this.template + '.html', function (data) {
                    $$u(data).appendTo('body');
                    MapSVG.templatesLoaded[_this.template] = true;
                    Handlebars.registerPartial('dataMarkerPartial', $$u('#mapsvg-data-tmpl-marker').html());
                    if (_this.editMode) {
                        Handlebars.registerPartial('markerByFieldPartial', $$u('#mapsvg-markers-by-field-tmpl-partial').html());
                    }
                    _this.init();
                });
            }
            else {
                this.init();
            }
        }
        init() {
            var _this = this;
            MapSVG.formBuilder = this;
            if (_this.editMode) {
                var templateUI = Handlebars.compile($$u('#mapsvg-form-editor-tmpl-ui').html());
                $$u(_this.view).append(templateUI({ types: this.types }));
                $$u(_this.view).addClass('edit');
            }
            else {
                var form = $$u('<div class="mapsvg-data-form-view"></div>');
                $$u(_this.view).append(form);
                if (!this.filtersMode) {
                    form.addClass('form-horizontal');
                }
            }
            _this.elements = {
                buttons: {
                    text: $$u(_this.view).find('#mapsvg-data-btn-text')[0],
                    textarea: $$u(_this.view).find('#mapsvg-data-btn-textarea')[0],
                    checkbox: $$u(_this.view).find('#mapsvg-data-btn-checkbox')[0],
                    radio: $$u(_this.view).find('#mapsvg-data-btn-radio')[0],
                    select: $$u(_this.view).find('#mapsvg-data-btn-select')[0],
                    image: $$u(_this.view).find('#mapsvg-data-btn-image')[0],
                    region: $$u(_this.view).find('#mapsvg-data-btn-region')[0],
                    marker: $$u(_this.view).find('#mapsvg-data-btn-marker')[0],
                    saveSchema: $$u(_this.view).find('#mapsvg-data-btn-save-schema')[0]
                },
                containers: {
                    buttons_add: $$u(_this.view).find('#mapsvg-data-buttons-add')[0],
                    formView: $$u(_this.view).find('.mapsvg-data-form-view')[0],
                    form_edit: $$u(_this.view).find('#mapsvg-data-form-edit')[0]
                }
            };
            _this.redraw();
        }
        ;
        viewDidLoad() { }
        ;
        setEventHandlers() {
            var _this = this;
            if (_this.filtersMode && _this.clearButton) {
                $$u(_this.elements.buttons.clearButton).on('click', function () {
                    $$u(_this.elements.containers.formView).find('input')
                        .not(':button, :submit, :reset, :hidden, :checkbox, :radio')
                        .val('')
                        .prop('selected', false);
                    $$u(_this.elements.containers.formView).find('input[type="radio"]').prop('checked', false);
                    $$u(_this.elements.containers.formView).find('input[type="checkbox"]').prop('checked', false);
                    $$u(_this.elements.containers.formView).find('select').val('').trigger('change.select2');
                    _this.events.trigger('clear');
                });
            }
            $$u(window).off('keydown.form.mapsvg').on('keydown.form.mapsvg', function (e) {
                if (MapSVG.formBuilder) {
                    if ((e.metaKey || e.ctrlKey) && e.keyCode == 13)
                        MapSVG.formBuilder.save();
                    else if (e.keyCode == 27)
                        MapSVG.formBuilder.close();
                }
            });
            if (this.editMode) {
                $$u(this.view).on('click', '.mapsvg-marker-image-selector button', function (e) {
                    e.preventDefault();
                    var src = $$u(this).find('img').attr('src');
                    $$u(this).parent().find('button').removeClass('active');
                    $$u(this).addClass('active');
                    _this.mapsvg.setDefaultMarkerImage(src);
                });
                $$u(this.view).on('click', '#mapsvg-data-buttons-add button', function (e) {
                    e.preventDefault();
                    var type = $$u(this).data('create');
                    let formElement = _this.formElementFactory.create({ type: type });
                    _this.addField(formElement);
                });
                $$u(this.view).on('click', '#mapsvg-data-btn-save-schema', function (e) {
                    e.preventDefault();
                    var fields = _this.getSchema();
                    var counts = {};
                    _this.formElements.forEach(function (elem) { counts[elem.name] = (counts[elem.name] || 0) + 1; });
                    $$u(_this.elements.containers.formView).find('.form-group').removeClass('has-error');
                    var errors = [];
                    var reservedFields = ['lat', 'lon', 'lng', 'location', 'location_lat', 'location_lon', 'location_lng', 'location_address', 'location_img', 'marker', 'marker_id', 'regions', 'region_id', 'post_id', 'post', 'post_title', 'post_url', 'keywords', 'status'];
                    var reservedFieldsToTypes = { 'regions': 'region', 'status': 'status', 'post_id': 'post', 'marker': 'marker', 'location': 'location' };
                    var errUnique, errEmpty;
                    _this.formElements.forEach(function (formElement, index) {
                        var err = false;
                        if (!_this.filtersMode) {
                            if (counts[formElement.name] > 1) {
                                if (!errUnique) {
                                    errUnique = 'Field names should be unique';
                                    errors.push(errUnique);
                                    err = true;
                                }
                            }
                            else if (formElement.name.length === 0) {
                                if (!errEmpty) {
                                    errEmpty = 'Field name can\'t be empty';
                                    errors.push(errEmpty);
                                    err = true;
                                }
                            }
                            else if (reservedFields.indexOf(formElement.name) != -1) {
                                if (!reservedFieldsToTypes[formElement.name] || (reservedFieldsToTypes[formElement.name] && reservedFieldsToTypes[formElement.name] != formElement.type)) {
                                    var msg = 'Field name "' + formElement.name + '" is reserved, please set another name';
                                    errors.push(msg);
                                    err = true;
                                }
                            }
                        }
                        if (formElement.options && formElement.type != 'region' && formElement.type != 'marker') {
                            var vals = formElement.options.map(function (obj) {
                                return obj.value;
                            });
                            let uniq = [...Array.from((new Set(vals)).values())];
                            if (vals.length != uniq.length) {
                                errors.push('Check "Options" list - values should not repeat');
                                err = true;
                            }
                        }
                        err && $$u(formElement.domElements.main).addClass('has-error');
                    });
                    if (errors.length === 0) {
                        _this.events.trigger('saveSchema', _this, [fields]);
                    }
                    else {
                        jQuery.growl.error({ title: "Errors", message: errors.join('<br />') });
                    }
                });
                setTimeout(function () {
                    var el = _this.elements.containers.formView;
                    _this.sortable = new Sortable(el, {
                        animation: 150,
                        onStart: function () {
                            $$u(_this.elements.containers.formView).addClass('sorting');
                        },
                        onEnd: function () {
                            setTimeout(function () {
                                $$u(_this.elements.containers.formView).removeClass('sorting');
                                _this.formElements.clear();
                                $$u(el).find('.form-group').each(function (index, elem) {
                                    _this.formElements.push($$u(elem).data('formElement'));
                                });
                            }, 500);
                        }
                    });
                }, 1000);
            }
            this.formElements.forEach((formElement) => {
                this.setFormElementEventHandlers(formElement);
            });
            new ResizeSensor(this.view, function () {
                _this.scrollApi && _this.scrollApi.reinitialise();
            });
        }
        setFormElementEventHandlers(formElement) {
            var _this = this;
            if (this.editMode) {
                formElement.events.on('click', (elem) => {
                    this.edit(elem);
                });
                formElement.events.on('delete', (elem) => {
                    this.deleteField(elem);
                });
            }
            else {
                formElement.events.on('changed', (_formElement) => {
                    let name = _formElement.name;
                    let value = _formElement.value;
                    this.events.trigger('changed.field', _formElement, [name, value]);
                });
                let locationField = _this.mapsvg.objectsRepository.getSchema().getField('location');
                if (locationField && locationField.markersByFieldEnabled && locationField.markerField && formElement.name == locationField.markerField && Object.values(locationField.markersByField).length > 0) {
                    formElement.events.on('changed', (_formElement) => {
                        let name = _formElement.name;
                        let value = _formElement.value;
                        var src = locationField.markersByField[value];
                        if (src) {
                            if (_this.markerBackup) {
                                var marker = _this.mapsvg.getMarker(_this.markerBackup.id);
                                marker.setImage(src);
                                $$u(_this.view).find('.mapsvg-marker-image-btn img').attr('src', src);
                            }
                        }
                    });
                }
            }
        }
        save() {
            var _this = this;
            if (_this.markerBackup) {
                var marker = _this.mapsvg.getEditingMarker();
                marker.events.off('change');
                _this.markerBackup = marker.getOptions();
                _this.mapsvg.unsetEditingMarker();
            }
            var data = _this.getData();
            _this.saved = true;
            this.events.trigger('save', _this, [data]);
        }
        getFormElementByType(type) {
            return this.formElements.find((el) => el.type === type);
        }
        getData() {
            let data = {};
            this.formElements.forEach((formElement) => {
                if (formElement.readonly === false || formElement.type === 'id') {
                    let _formElementData = formElement.getData();
                    data[_formElementData.name] = _formElementData.value;
                }
            });
            return data;
        }
        redraw() {
            var _this = this;
            delete _this.markerBackup;
            $$u(_this.container).empty();
            $$u(_this.elements.containers.formView).empty();
            _this.formElements.clear();
            _this.schema && _this.schema.fields.length > 0 && _this.schema.fields.forEach(function (elem) {
                if (_this.admin && _this.admin.isMetabox && elem.type == 'post') ;
                else {
                    if (_this.filtersMode) {
                        if (elem.type == 'distance') {
                            elem.value = _this.data.distance ? _this.data.distance : elem.value !== undefined ? elem.value : null;
                        }
                        else {
                            elem.value = _this.data[elem.parameterNameShort];
                        }
                    }
                    else {
                        elem.value = _this.data ? _this.data[elem.name] : elem.value !== undefined ? elem.value : null;
                    }
                    if (elem.type == 'location' && !_this.editMode) {
                        if (elem.value && elem.value.marker && elem.value.marker.id) {
                            _this.markerBackup = elem.value.marker.getOptions();
                            _this.mapsvg.setEditingMarker(elem.value.marker);
                        }
                        _this.admin && _this.admin.setMode && _this.admin.setMode('editMarkers');
                        _this.admin && _this.admin.enableMarkersMode(true);
                        _this.mapsvg.setMarkerEditHandler(function () {
                            _this.markerBackup = this.getOptions();
                            _this.mapsvg.setEditingMarker(this);
                            var object = _this.getData();
                            var img = _this.mapsvg.getMarkerImage(object);
                            var marker = this;
                            marker.setImage(img);
                            let locationFormElement = _this.getFormElementByType('location');
                            locationFormElement && locationFormElement.renderMarker(marker);
                        });
                    }
                    else if (elem.type == 'post') {
                        elem.post = _this.data['post'];
                    }
                    else if (elem.type === 'region') {
                        elem.options = _this.getRegionsList();
                    }
                    let formElement = _this.formElementFactory.create(elem);
                    if (_this.filtersMode) {
                        if (!_this.filtersHide || (_this.filtersHide && (_this.modal && elem.type !== 'search') || (!_this.modal && elem.type === 'search'))) {
                            _this.addField(formElement);
                        }
                    }
                    else {
                        _this.addField(formElement);
                    }
                }
            });
            if (!_this.editMode) {
                if (this.schema.fields.length === 0) {
                    let formElement = this.formElementFactory.create({ type: 'empty' });
                    _this.addField(formElement);
                }
                else {
                    if (_this.admin && !_this.admin.isMetabox) {
                        let formElement = this.formElementFactory.create({ type: 'save' });
                        formElement.events.on('click.btn.save', () => {
                            this.save();
                        });
                        formElement.events.on('click.btn.close', () => {
                            this.close();
                        });
                        _this.addField(formElement);
                    }
                }
            }
            if (_this.filtersMode && _this.filtersHide && !_this.modal) {
                let formElement = this.formElementFactory.create({ type: 'modal', 'buttonText': _this.showButtonText });
                this.showFiltersButton = _this.addField(formElement);
            }
            if (!_this.editMode && !_this.filtersMode) {
                var nano = $$u('<div class="nano"></div>');
                var nanoContent = $$u('<div class="nano-content"></div>');
                nano.append(nanoContent);
                nanoContent.append(this.view);
                $$u(_this.container).append(nano);
                nano.jScrollPane({ mouseWheelSpeed: 30 });
                _this.scrollApi = nano.data('jsp');
            }
            else {
                $$u(_this.container).append(this.view);
            }
            if (_this.filtersMode && _this.clearButton) {
                _this.elements.buttons.clearButton = $$u('<div class="form-group mapsvg-filters-reset-container"><button class="btn btn-default mapsvg-filters-reset">' + _this.clearButtonText + '</button></div>')[0];
                $$u(this.elements.containers.formView).find('.mapsvg-data-form-view').append(_this.elements.buttons.clearButton);
            }
            this.events.trigger('load');
            if (!this.editMode && !_this.filtersMode)
                $$u(this.view).find('input:visible,textarea:visible').not('.tt-hint').first().focus();
            var cm = $$u(this.container).find('.CodeMirror');
            cm.each(function (index, el) {
                el && el.CodeMirror.refresh();
            });
            _this.setEventHandlers();
            this.events.trigger('init', this, [this.getData()]);
        }
        deleteField(formElement) {
            var _this = this;
            _this.formElements.delete(formElement.name);
        }
        getExtraParams() {
            let databaseFields = [];
            this.mapsvg.objectsRepository.getSchema().getFields().forEach(function (obj) {
                if (obj.type == 'text' || obj.type == 'region' || obj.type == 'textarea' || obj.type == 'post' || obj.type == 'select' || obj.type == 'radio' || obj.type == 'checkbox') {
                    if (obj.type == 'post') {
                        databaseFields.push('Object.post.post_title');
                    }
                    else {
                        databaseFields.push('Object.' + obj.name);
                    }
                }
            });
            let databaseFieldsFilterableShort = [];
            databaseFieldsFilterableShort = this.mapsvg.objectsRepository.getSchema().getFieldsAsArray().filter(function (obj) {
                return (obj.type == 'select' || obj.type == 'radio' || obj.type == 'region');
            }).map(function (obj) {
                return obj.name;
            });
            let regionFields = this.mapsvg.regionsRepository.getSchema().getFieldsAsArray().map(function (obj) {
                if (obj.type == 'status' || obj.type == 'text' || obj.type == 'textarea' || obj.type == 'post' || obj.type == 'select' || obj.type == 'radio' || obj.type == 'checkbox') {
                    if (obj.type == 'post') {
                        return 'Region.post.post_title';
                    }
                    else {
                        return 'Region.' + obj.name;
                    }
                }
            });
            return {
                databaseFields: databaseFields,
                databaseFieldsFilterableShort: databaseFieldsFilterableShort,
                regionFields: regionFields
            };
        }
        addField(formElement) {
            var _this = this;
            if (['region', 'marker', 'post', 'status', 'distance', 'location', 'search'].indexOf(formElement.type) != -1) {
                var repeat = false;
                _this.formElements.forEach(function (control) {
                    if (control.type == formElement.type)
                        repeat = true;
                });
                if (repeat) {
                    jQuery.growl.error({ title: 'Error', message: 'You can add only 1 "' + MapSVG.ucfirst(formElement.type) + '" field' });
                    return;
                }
            }
            _this.formElements.push(formElement);
            _this.elements.containers.formView.append(formElement.domElements.main);
            if (this.editMode) {
                if (formElement.protected) {
                    formElement.hide();
                }
                else {
                    this.edit(formElement);
                    this.setFormElementEventHandlers(formElement);
                }
            }
            return formElement;
        }
        edit(formElement) {
            var _this = this;
            _this.currentlyEditing && _this.currentlyEditing.destroyEditor();
            _this.elements.containers.form_edit.append(formElement.getEditor());
            formElement.initEditor();
            _this.currentlyEditing = formElement;
            $$u(_this.elements.containers.formView).find('.form-group.active').removeClass('active');
            $$u(formElement.domElements.main).addClass('active');
        }
        get() {
        }
        getSchema() {
            return this.formElements.map(function (formElement) {
                return formElement.getSchema();
            });
        }
        close() {
            var _this = this;
            this.formElements.forEach(formElement => formElement.destroy());
            if (!_this.saved) {
                if (_this.data.id == undefined && _this.markerBackup) {
                    var marker = _this.mapsvg.getMarker(_this.markerBackup.id);
                    marker.events.off('change');
                    marker.delete();
                    delete _this.markerBackup;
                }
                if (this.backupData) {
                    if (this.backupData.location) {
                        _this.mapsvg.markerAdd(this.backupData.location.marker);
                        _this.mapsvg.setEditingMarker(this.backupData.location.marker);
                    }
                }
                if (_this.markerBackup) {
                    var editingMarker = _this.mapsvg.getEditingMarker();
                    if (editingMarker) {
                        editingMarker.setImage(_this.markerBackup.src);
                        editingMarker.setPoint(_this.markerBackup.svgPoint);
                        _this.mapsvg.unsetEditingMarker();
                    }
                }
            }
            _this.admin && _this.admin.enableMarkersMode(false);
            MapSVG.formBuilder = null;
            this.events.trigger('close');
        }
        destroy() {
            $$u(this.view).empty().remove();
            this.sortable = null;
        }
        toJSON(addEmpty) {
            var obj = {};
            function add(obj, name, value) {
                if (!addEmpty && !value)
                    return false;
                if (name.length == 1) {
                    obj[name[0]] = value;
                }
                else {
                    if (obj[name[0]] == null) {
                        if (name[1] === '') {
                            obj[name[0]] = [];
                        }
                        else {
                            obj[name[0]] = {};
                        }
                    }
                    if (obj[name[0]].length !== undefined) {
                        obj[name[0]].push(value);
                    }
                    else {
                        add(obj[name[0]], name.slice(1), value);
                    }
                }
            }
            $$u(this.elements.containers.formView).find('input, textarea, select').each(function () {
                if (!$$u(this).data('skip')
                    &&
                        !$$u(this).prop('disabled')
                    &&
                        $$u(this).attr('name')
                    &&
                        !(!addEmpty && $$u(this).attr('type') == 'checkbox' && $$u(this).attr('checked') == undefined)
                    &&
                        !($$u(this).attr('type') == 'radio' && $$u(this).attr('checked') == undefined)) {
                    var value;
                    if ($$u(this).attr('type') == 'checkbox') {
                        value = $$u(this).prop('checked');
                    }
                    else {
                        value = $$u(this).val();
                    }
                    add(obj, $$u(this).attr('name').replace(/]/g, '').split('['), value);
                }
            });
            return obj;
        }
        getRegionsList() {
            return this.mapsvg.regions.map(function (r) {
                return { id: r.id, title: r.title };
            });
        }
        getRegionsAsArray() {
            return this.mapsvg.regions;
        }
    }

    const $$v = jQuery;
    class FiltersController extends DetailsController {
        constructor(options) {
            super(options);
            this.showButtonText = options.showButtonText;
            this.clearButton = options.clearButton;
            this.clearButtonText = options.clearButtonText;
            this.schema = options.schema;
            this.hideFilters = options.hide;
            this.repository = options.repository;
            this.query = options.query;
        }
        viewDidLoad() {
            super.viewDidLoad();
            var _this = this;
            var filtersController = this;
            var formBuilder = new FormBuilder({
                container: this.containers.contentView,
                filtersMode: true,
                schema: this.schema,
                modal: this.modal,
                filtersHide: this.hideFilters,
                showButtonText: this.showButtonText,
                clearButton: this.clearButton,
                clearButtonText: this.clearButtonText,
                editMode: false,
                mapsvg: this.mapsvg,
                data: this.query,
                admin: false,
                events: {
                    'changed.field': (field, value) => {
                        let filters = {};
                        filters[field] = value;
                        this.query.setFilters(filters);
                        _this.events.trigger('changed.field', _this, [field, value]);
                        _this.events.trigger('changed.fields', _this, [field, value]);
                    },
                    'cleared': () => {
                        this.query.clearFilters();
                        _this.events.trigger('cleared.filters', _this, []);
                    },
                    'loaded': (_formBuilder) => {
                        _formBuilder.container.find('.mapsvg-form-builder').css({
                            padding: _this.padding
                        });
                        filtersController.updateScroll();
                        if (_this.hideFilters) {
                            var setFiltersCounter = function () {
                                var filtersCounter = Object.keys(_this.repository.query.filters).length;
                                var filtersCounterString = filtersCounter === 0 ? '' : filtersCounter.toString();
                                _formBuilder && _formBuilder.showFiltersButton && _formBuilder.showFiltersButton.views.result.find('button').html(_this.showButtonText + ' <b>' + filtersCounterString + '</b>');
                            };
                            setFiltersCounter();
                            _this.repository.events.on('dataLoaded', function () {
                                setFiltersCounter();
                            });
                        }
                        _this.events.trigger('loaded');
                    }
                }
            });
        }
        setEventHandlers() {
            super.setEventHandlers();
            var _this = this;
            $$v(this.containers.view).on('click', '.mapsvg-btn-show-filters', function () {
                _this.events.trigger('click.btn.showFilters');
            });
            var filterDatabase = _this.repository;
            $$v(this.containers.view).on('change paste keyup', 'select,input[type="radio"],input', function () {
                if ($$v(this).data('ignoreSelect2Change')) {
                    $$v(this).data('ignoreSelect2Change', false);
                    return;
                }
                var filter = {};
                var field = $$v(this).data('parameter-name');
                if ($$v(this).attr('data-parameter-name') == "search") {
                    return;
                }
                if ($$v(this).attr('name') === 'distanceAddress' || field == "search") {
                    return;
                }
                if ($$v(this).attr('name') === 'distanceLatLng' || $$v(this).attr('name') === 'distanceLength') ;
                else if ($$v(this).closest('.mapsvg-checkbox-group').length > 0) {
                    filter[field] = [];
                    $$v(this).closest('.mapsvg-checkbox-group').find('input[type="checkbox"]:checked').each(function (i, el) {
                        filter[field].push($$v(el).val());
                    });
                }
                else {
                    filter[field] = $$v(this).val();
                }
                filterDatabase.query.setFilters(filter);
            });
        }
    }

    const $$w = jQuery;
    class PopoverController extends Controller {
        constructor(options) {
            super(options);
            options.autoresize = true;
            this.point = options.point;
            this.yShift = options.yShift;
            this.mapObject = options.mapObject;
            this.id = this.mapObject.id + '_' + Math.random();
            $$w(this.containers.main).data('popover-id', this.id);
        }
        setPoint(point) {
            this.point = point;
        }
        getToolbarTemplate() {
            if (this.withToolbar)
                return '<div class="mapsvg-popover-close"></div>';
            else
                return '';
        }
        viewDidLoad() {
            super.viewDidLoad.call(this);
            var _this = this;
            if (MapSVG.isPhone && _this.mapsvg.options.popovers.mobileFullscreen && !this.mobileCloseBtn) {
                this.mobileCloseBtn = $$w('<button class="mapsvg-mobile-modal-close mapsvg-btn">' + _this.mapsvg.getData().options.mobileView.labelClose + '</button>')[0];
                $$w(this.containers.view).append(this.mobileCloseBtn);
            }
            this.adjustPosition();
            $$w(this.containers.main).toggleClass('mapsvg-popover-animate', true);
            $$w(this.containers.main).toggleClass('mapsvg-popover-visible', true);
            _this.adjustHeight();
            _this.updateScroll();
            this.autoresize && this.resizeSensor.setScroll();
            this.events.trigger('shown', _this, [_this.mapsvg]);
        }
        adjustHeight() {
            var _this = this;
            $$w(_this.containers.main).height($$w(_this.containers.main).find('.mapsvg-auto-height').outerHeight() + (_this.containers.toolbar ? $$w(_this.containers.toolbar).outerHeight() : 0));
        }
        adjustPosition() {
            var pos = this.mapsvg.convertSVGToPixel(this.point);
            pos.y -= this.yShift;
            pos.x = Math.round(pos.x);
            pos.y = Math.round(pos.y);
            $$w(this.containers.main).css({
                'transform': 'translateX(-50%) translate(' + pos.x + 'px,' + pos.y + 'px)'
            });
        }
        setEventHandlers() {
            var _this = this;
            $$w('body').off('.popover.mapsvg');
            $$w(this.containers.view).on('click touchend', '.mapsvg-popover-close, .mapsvg-mobile-modal-close', function (e) {
                e.stopImmediatePropagation();
                _this.close();
            });
            $$w('body').one('mouseup.popover.mapsvg touchend.popover.mapsvg ', function (e) {
                if (_this.mapsvg.isScrolling || $$w(e.target).closest('.mapsvg-directory').length || $$w(e.target).closest('.mapsvg-popover').length || $$w(e.target).hasClass('mapsvg-btn-map'))
                    return;
                _this.close();
            });
        }
        close() {
            var _this = this;
            if (($$w(this.containers.main).data('popover-id') != this.id) || !$$w(_this.containers.main).is(':visible'))
                return;
            _this.destroy();
            if (_this.mapObject instanceof Region) {
                _this.mapsvg.deselectRegion(_this.mapObject);
            }
            if (_this.mapObject instanceof Marker) {
                _this.mapsvg.deselectAllMarkers();
            }
            _this.events.trigger('closed', _this, [_this.mapsvg]);
        }
        destroy() {
            $$w(this.containers.main).toggleClass('mapsvg-popover-animate', false);
            $$w(this.containers.main).toggleClass('mapsvg-popover-visible', false);
            super.destroy.call(this);
        }
        show() {
            $$w(this.containers.main).toggleClass('mapsvg-popover-animate', true);
            $$w(this.containers.main).toggleClass('mapsvg-popover-visible', true);
        }
    }

    const $$x = jquery;
    class MapSVGMap {
        constructor(containerId, options) {
            this.markerOptions = { 'src': MapSVG.urls.root + 'markers/pin1_red.png' };
            this.updateOutdatedOptions(options);
            this.dirtyFields = [];
            this.containerId = containerId;
            this.options = $$x.extend(true, {}, DefaultOptions, options);
            if (this.options.source.indexOf('//') === 0)
                this.options.source = this.options.source.replace(/^\/\/[^\/]+/, '').replace('//', '/');
            else
                this.options.source = this.options.source.replace(/^.*:\/\/[^\/]+/, '').replace('//', '/');
            this.editMode = this.options.editMode;
            delete this.options.editMode;
            this.id = this.options.id;
            this.regions = new ArrayIndexed('id');
            this.objects = new ArrayIndexed('id');
            this.events = new Events(this);
            this.highlightedRegions = [];
            this.editRegions = { on: false };
            this.editMarkers = { on: false };
            this.editData = { on: false };
            this.controllers = {};
            this.containers = {
                map: document.getElementById(this.containerId),
                scrollpane: $$x('<div class="mapsvg-scrollpane"></div>')[0],
                layers: $$x('<div class="mapsvg-layers-wrap"></div>')[0]
            };
            this.containers.map.appendChild(this.containers.scrollpane);
            this.containers.scrollpane.appendChild(this.containers.layers);
            this.whRatio = 0;
            this.isScrolling = false;
            this.markerOptions = {};
            this.svgDefault = {};
            this.scale = 1;
            this._scale = 1;
            this.selected_id = [];
            this.regions = new ArrayIndexed('id');
            if (!this.options.database.regionsRepoName) {
                this.options.database.regionsRepoName = 'regions_' + this.id;
            }
            if (!this.options.database.objectsRepoName) {
                this.options.database.objectsRepoName = 'objects_' + this.id;
            }
            this.regionsRepository = new Repository('region', 'regions/' + this.options.database.regionsRepoName);
            this.regionsRepository.query.update({ perpage: 0 });
            this.objectsRepository = new Repository('object', 'objects/' + this.options.database.objectsRepoName);
            this.objectsRepository.query.update({ perpage: this.options.database.pagination.perpage });
            this.schemaRepository = new SchemaRepository();
            this.markers = new ArrayIndexed('id');
            this.markersClusters = new ArrayIndexed('id');
            this._viewBox = new ViewBox(0, 0, 0, 0);
            this.viewBox = new ViewBox(0, 0, 0, 0);
            this.zoomLevel = 0;
            this.scroll = {
                tx: 0, ty: 0,
                vxi: 0, vyi: 0,
                x: 0, y: 0,
                dx: 0, dy: 0,
                vx: 0, vy: 0,
                gx: 0, gy: 0,
                touchScrollStart: 0
            };
            this.layers = {};
            this.geoCoordinates = false;
            this.geoViewBox = new GeoViewBox(new GeoPoint(0, 0), new GeoPoint(0, 0));
            this.eventsPreventList = {};
            this.googleMaps = { loaded: false, initialized: false, map: null, zoomLimit: true };
            this.init();
        }
        setGroups() {
            let _this = this;
            _this.groups = _this.options.groups;
            _this.groups.forEach(function (g) {
                g.objects && g.objects.length && g.objects.forEach(function (obj) {
                    _this.containers.svg.querySelector('#' + obj.value).classList.toggle('mapsvg-hidden', !g.visible);
                });
            });
        }
        setLayersControl(options) {
            var _this = this;
            if (options)
                extend(true, this.options.layersControl, options);
            if (this.options.layersControl.on) {
                if (!this.containers.layersControl) {
                    this.containers.layersControl = document.createElement('div');
                    this.containers.layersControl.classList.add('mapsvg-layers-control');
                    this.containers.layersControlLabel = document.createElement('div');
                    this.containers.layersControlLabel.classList.add('mapsvg-layers-label');
                    this.containers.layersControl.appendChild(this.containers.layersControlLabel);
                    let layersControlWrap = document.createElement('div');
                    layersControlWrap.classList.add('mapsvg-layers-list-wrap');
                    this.containers.layersControl.appendChild(layersControlWrap);
                    this.containers.layersControlListNano = document.createElement('div');
                    this.containers.layersControlListNano.classList.add('nano');
                    layersControlWrap.appendChild(this.containers.layersControlListNano);
                    this.containers.layersControlList = document.createElement('div');
                    this.containers.layersControlList.classList.add('mapsvg-layers-list');
                    this.containers.layersControlList.classList.add('nano-content');
                    this.containers.layersControlListNano.appendChild(this.containers.layersControlList);
                    this.containers.mapContainer.appendChild(this.containers.layersControl);
                }
                this.containers.layersControl.style.display = 'block';
                this.containers.layersControlLabel.innerHTML = this.options.layersControl.label;
                this.containers.layersControlLabel.style.display = 'block';
                this.containers.layersControlList.innerHTML = '';
                while (this.containers.layersControlList.firstChild) {
                    this.containers.layersControlList.removeChild(this.containers.layersControlList.firstChild);
                }
                this.containers.layersControl.classList.remove('mapsvg-top-left', 'mapsvg-top-right', 'mapsvg-bottom-left', 'mapsvg-bottom-right');
                this.containers.layersControl.classList.add('mapsvg-' + this.options.layersControl.position);
                if (this.options.menu.on && !this.options.menu.customContainer && this.options.layersControl.position.indexOf('left') !== -1) {
                    this.containers.layersControl.style.left = this.options.menu.width;
                }
                this.containers.layersControl.style.maxHeight = this.options.layersControl.maxHeight;
                this.options.groups.forEach((g) => {
                    let item = document.createElement('div');
                    item.classList.add('mapsvg-layers-item');
                    item.setAttribute('data-group-id', g.id);
                    item.innerHTML = '<input type="checkbox" class="ios8-switch ios8-switch-sm" ' + (g.visible ? 'checked' : '') + ' /><label>' + g.title + '</label>';
                    this.containers.layersControlList.appendChild(item);
                });
                $$x(this.containers.layersControlListNano).nanoScroller({
                    preventPageScrolling: true,
                    iOSNativeScrolling: true
                });
                $$x(this.containers.layersControl).off();
                $$x(this.containers.layersControl).on('click', '.mapsvg-layers-item', function () {
                    var id = $$x(this).data('group-id');
                    var input = $$x(this).find('input');
                    input.prop('checked', !input.prop('checked'));
                    _this.options.groups.forEach(function (g) {
                        if (g.id === id)
                            g.visible = !g.visible;
                    });
                    _this.setGroups();
                });
                $$x(this.containers.layersControlLabel).on('click', () => {
                    $$x(_this.containers.layersControlLabel).toggleClass('closed');
                });
                $$x(this.containers.layersControlLabel).toggleClass('closed', !this.options.layersControl.expanded);
            }
            else {
                if (this.containers.layersControl) {
                    this.containers.layersControl.style.display = 'none';
                }
            }
        }
        loadDataObjects(params) {
            return this.objectsRepository.find(params);
        }
        loadDirectory() {
            if (!this.editMode && this.options.menu.source === 'database' && this.objectsRepository.getLoaded().length === 0) {
                return false;
            }
            if (this.options.menu.on) {
                this.controllers.directory.loadItemsToDirectory();
            }
            this.setPagination();
        }
        setPagination() {
            var _this = this;
            (this.containers.pagerMap) && $$x(this.containers.pagerMap).empty().remove();
            (this.containers.pagerDir) && $$x(this.containers.pagerDir).empty().remove();
            if (_this.options.database.pagination.on && _this.options.database.pagination.perpage !== 0) {
                this.containers.directory.classList.toggle('mapsvg-with-pagination', (['directory', 'both'].indexOf(_this.options.database.pagination.showIn) !== -1));
                this.containers.map.classList.toggle('mapsvg-with-pagination', (['map', 'both'].indexOf(_this.options.database.pagination.showIn) !== -1));
                if (_this.options.menu.on) {
                    this.containers.pagerDir = _this.getPagination();
                    _this.controllers.directory.addPagination(this.containers.pagerDir);
                }
                this.containers.pagerMap = _this.getPagination();
                this.containers.map.appendChild(this.containers.pagerMap);
            }
        }
        getPagination(callback) {
            var _this = this;
            var pager = $$x('<nav class="mapsvg-pagination"><ul class="pager"><!--<li class="mapsvg-first"><a href="#">First</a></li>--><li class="mapsvg-prev"><a href="#">&larr; ' + _this.options.database.pagination.prev + ' ' + _this.options.database.pagination.perpage + '</a></li><li class="mapsvg-next"><a href="#">' + _this.options.database.pagination.next + ' ' + _this.options.database.pagination.perpage + ' &rarr;</a></li><!--<li class="mapsvg-last"><a href="#">Last</a></li>--></ul></nav>');
            if (this.objectsRepository.onFirstPage() && this.objectsRepository.onLastPage()) {
                pager.hide();
            }
            else {
                pager.find('.mapsvg-prev').removeClass('disabled');
                pager.find('.mapsvg-first').removeClass('disabled');
                pager.find('.mapsvg-last').removeClass('disabled');
                pager.find('.mapsvg-next').removeClass('disabled');
                this.objectsRepository.onLastPage() &&
                    (pager.find('.mapsvg-next').addClass('disabled') && pager.find('.mapsvg-last').addClass('disabled'));
                this.objectsRepository.onFirstPage() &&
                    (pager.find('.mapsvg-prev').addClass('disabled') && pager.find('.mapsvg-first').addClass('disabled'));
            }
            pager.on('click', '.mapsvg-next:not(.disabled)', (e) => {
                e.preventDefault();
                if (this.objectsRepository.onLastPage())
                    return;
                var query = new Query({ page: this.objectsRepository.query.page + 1 });
                this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            }).on('click', '.mapsvg-prev:not(.disabled)', function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onFirstPage())
                    return;
                var query = new Query({ page: _this.objectsRepository.query.page - 1 });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            }).on('click', '.mapsvg-first:not(.disabled)', function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onFirstPage())
                    return;
                var query = new Query({ page: 1 });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            }).on('click', '.mapsvg-last:not(.disabled)', function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onLastPage())
                    return;
                let query = new Query({ lastpage: true });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            });
            return pager[0];
        }
        deleteMarkers() {
            this.markers.clear();
        }
        deleteClusters() {
            if (this.markersClusters) {
                this.markersClusters.forEach(function (markerCluster) {
                    markerCluster.destroy();
                });
                this.markersClusters.clear();
            }
        }
        addLocations() {
            var _this = this;
            this.firstDataLoad = this.firstDataLoad === undefined;
            var locationField = this.objectsRepository.getSchema().getFieldByType('location');
            if (!locationField) {
                return false;
            }
            locationField = locationField.name;
            if (locationField) {
                if (this.firstDataLoad) {
                    this.setMarkerImagesDependency();
                }
                _this.deleteMarkers();
                _this.deleteClusters();
                _this.clusters = {};
                _this.clustersByZoom = [];
                _this.deleteClusters();
                if (this.objectsRepository.getLoaded().length > 0) {
                    this.objectsRepository.getLoaded().forEach(function (object) {
                        if (object[locationField]) {
                            if (object[locationField].geoPoint || object[locationField].svgPoint) {
                                new Marker({
                                    location: object[locationField],
                                    object: object,
                                    mapsvg: _this
                                });
                            }
                        }
                    });
                    if (_this.options.clustering.on) {
                        _this.startClusterizer();
                    }
                    else {
                        this.objectsRepository.getLoaded().forEach(function (object) {
                            if (object.location && object.location.marker) {
                                _this.markerAdd(object.location.marker);
                            }
                        });
                        _this.mayBeFitMarkers();
                    }
                }
            }
        }
        addClustersFromWorker(zoomLevel, clusters) {
            var _this = this;
            _this.clustersByZoom[zoomLevel] = [];
            for (var cell in clusters) {
                var markers = clusters[cell].markers.map(function (marker) {
                    return _this.objectsRepository.objects.findById(marker.id).location.marker;
                });
                _this.clustersByZoom[zoomLevel].push(new MarkerCluster({
                    markers: markers,
                    svgPoint: new SVGPoint(clusters[cell].x, clusters[cell].y),
                    cellX: clusters[cell].cellX,
                    cellY: clusters[cell].cellY
                }, _this));
            }
            if (_this.zoomLevel === zoomLevel) {
                _this.clusterizeMarkers();
            }
        }
        startClusterizer() {
            var _this = this;
            if (!_this.objectsRepository || _this.objectsRepository.getLoaded().length === 0) {
                return;
            }
            var locationField = _this.objectsRepository.getSchema().getFieldByType('location');
            if (!locationField) {
                return false;
            }
            if (!_this.clusterizerWorker) {
                _this.clusterizerWorker = new Worker(MapSVG.urls.root + "js/clustering.js");
                _this.clusterizerWorker.onmessage = function (evt) {
                    if (evt.data.clusters) {
                        _this.addClustersFromWorker(evt.data.zoomLevel, evt.data.clusters);
                    }
                };
            }
            var objectsData = [];
            _this.objectsRepository.getLoaded().forEach(function (o) {
                objectsData.push({ id: o.id, x: o.location ? o.location.marker.svgPoint.x : null, y: o.location ? o.location.marker.svgPoint.y : null });
            });
            _this.clusterizerWorker.postMessage({
                objects: objectsData,
                cellSize: 50,
                mapWidth: $$x(_this.containers.map).width(),
                zoomLevels: _this.zoomLevels,
                zoomLevel: _this.zoomLevel,
                zoomDelta: _this.zoomDelta,
                svgViewBox: _this.svgDefault.viewBox
            });
            _this.events.on("zoom", function () {
                _this.clusterizerWorker.postMessage({
                    message: "zoom",
                    zoomLevel: _this.zoomLevel
                });
            });
        }
        clusterizeMarkers(skipFitMarkers) {
            var _this = this;
            $$x(_this.layers.markers).children().each(function (i, obj) {
                $$x(obj).detach();
            });
            _this.markers.clear();
            _this.markersClusters.clear();
            _this.clustersByZoom && _this.clustersByZoom[_this.zoomLevel] && _this.clustersByZoom[_this.zoomLevel].forEach(function (cluster) {
                if (_this.options.googleMaps.on && _this.googleMaps.map && _this.googleMaps.map.getZoom() >= 17) {
                    _this.markerAdd(cluster.markers[0]);
                }
                else {
                    if (cluster.markers.length > 1) {
                        _this.markersClusterAdd(cluster);
                    }
                    else {
                        _this.markerAdd(cluster.markers[0]);
                    }
                }
            });
            if (_this.editingMarker) {
                _this.markerAdd(_this.editingMarker);
            }
            if (!skipFitMarkers) {
                _this.mayBeFitMarkers();
            }
            if (_this.options.labelsMarkers.on) {
                _this.setLabelsMarkers();
            }
        }
        getCssUrl() {
            return MapSVG.urls.root + 'css/mapsvg.css';
        }
        isGeo() {
            var _this = this;
            return _this.mapIsGeo;
        }
        functionFromString(string) {
            var func;
            var error = { error: '' };
            var fn = string.trim();
            if (fn.indexOf("{") == -1 || fn.indexOf("function") !== 0 || fn.indexOf("(") == -1) {
                return { error: "MapSVG user function error: no function body." };
            }
            var fnBody = fn.substring(fn.indexOf("{") + 1, fn.lastIndexOf("}"));
            var params = fn.substring(fn.indexOf("(") + 1, fn.indexOf(")"));
            try {
                func = new Function(params, fnBody);
            }
            catch (err) {
                error = err;
            }
            if (!error.error)
                return func;
            else
                return error;
        }
        getOptions(forTemplate, forWeb) {
            var _this = this;
            var options = $$x.extend(true, {}, _this.options);
            $$x.extend(true, options, this.optionsDelta);
            options.viewBox = _this._viewBox.toArray();
            options.filtersSchema = _this.filtersSchema.getFieldsAsArray();
            if (options.filtersSchema.length > 0) {
                options.filtersSchema.forEach(function (field) {
                    if (field.type === 'distance') {
                        field.value = '';
                    }
                });
            }
            delete options.markers;
            if (forTemplate) {
                options.svgFilename = options.source.split('/').pop();
                options.svgFiles = MapSVG.svgFiles;
            }
            if (forWeb)
                $$x.each(options, function (key, val) {
                    if (JSON.stringify(val) == JSON.stringify(_this.defaults[key]))
                        delete options[key];
                });
            delete options.backend;
            return options;
        }
        restoreDeltaOptions() {
            this.update(this.optionsDelta);
            this.optionsDelta = {};
        }
        setEvents(functions) {
            var _this = this;
            for (var eventName in functions) {
                if (typeof functions[eventName] === 'string') {
                    var func = functions[eventName] != "" ? this.functionFromString(functions[eventName]) : null;
                    if (func && !func.error && !(func instanceof TypeError || func instanceof SyntaxError)) {
                        _this.events[eventName] = func;
                    }
                    else {
                        _this.events[eventName] = null;
                    }
                }
                else if (typeof functions[eventName] === 'function') {
                    _this.events[eventName] = functions[eventName];
                }
                if (eventName.indexOf('directory') !== -1) {
                    var event = eventName.split('.')[0];
                    if (_this.controllers && _this.controllers.directory) {
                        _this.controllers.directory.events[event] = _this.events[eventName];
                    }
                }
            }
            $$x.extend(true, _this.options.events, functions);
        }
        setActions(options) {
            var _this = this;
            $$x.extend(true, _this.options.actions, options);
        }
        setDetailsView(options) {
            var _this = this;
            options = options || _this.options.detailsView || {};
            $$x.extend(true, _this.options.detailsView, options);
            if (_this.options.detailsView.location === 'top' && _this.options.menu.position === 'left') {
                _this.options.detailsView.location = 'leftSidebar';
            }
            else if (_this.options.detailsView.location === 'top' && _this.options.menu.position === 'right') {
                _this.options.detailsView.location = 'rightSidebar';
            }
            if (_this.options.detailsView.location === 'near') {
                _this.options.detailsView.location = 'map';
            }
            if (!_this.containers.detailsView) {
                _this.containers.detailsView = $$x('<div class="mapsvg-details-container"></div>')[0];
            }
            $$x(_this.containers.detailsView).toggleClass('mapsvg-details-container-relative', !(MapSVG.isPhone && _this.options.detailsView.mobileFullscreen) && !_this.shouldBeScrollable(_this.options.detailsView.location));
            if (_this.options.detailsView.location === 'custom') {
                $$x('#' + _this.options.detailsView.containerId).append($$x(_this.containers.detailsView));
            }
            else {
                if (MapSVG.isPhone && _this.options.detailsView.mobileFullscreen) {
                    $$x('body').append($$x(_this.containers.detailsView));
                    $$x(_this.containers.detailsView).addClass('mapsvg-container-fullscreen');
                }
                else {
                    _this.containers[_this.options.detailsView.location].append(_this.containers.detailsView);
                }
                if (_this.options.detailsView.margin) {
                    $$x(_this.containers.detailsView).css('margin', _this.options.detailsView.margin);
                }
                $$x(_this.containers.detailsView).css('width', _this.options.detailsView.width);
            }
        }
        setMobileView(options) {
            var _this = this;
            $$x.extend(true, _this.options.mobileView, options);
        }
        attachDataToRegions(object) {
            var _this = this;
            _this.regions.forEach(function (region) {
                region.objects = [];
            });
            _this.objectsRepository.getLoaded().forEach(function (obj, index) {
                var regions = obj.getRegions(_this.regionsRepository.schema.name);
                if (regions && regions.length) {
                    regions.forEach(function (region) {
                        var r = _this.getRegion(region.id);
                        if (r)
                            r.objects.push(obj);
                    });
                }
            });
        }
        setTemplates(templates) {
            var _this = this;
            _this.templates = _this.templates || {};
            for (var name in templates) {
                if (name != undefined) {
                    _this.options.templates[name] = templates[name];
                    var t = _this.options.templates[name];
                    if (name == 'directoryItem' || name == 'directoryCategoryItem') {
                        var dirItemTemplate = _this.options.templates.directoryItem;
                        t = '{{#each items}}<div id="mapsvg-directory-item-{{id}}" class="mapsvg-directory-item" data-object-id="{{id}}">' + dirItemTemplate + '</div>{{/each}}';
                        if (_this.options.menu.categories && _this.options.menu.categories.on && _this.options.menu.categories.groupBy) {
                            var t2 = _this.options.templates['directoryCategoryItem'];
                            t = '{{#each items}}{{#with category}}<div id="mapsvg-category-item-{{value}}" class="mapsvg-category-item" data-category-value="{{value}}">' + t2 + '</div><div class="mapsvg-category-block" data-category-id="{{value}}">{{/with}}' + t + '</div>{{/each}}';
                        }
                        name = 'directory';
                    }
                    try {
                        _this.templates[name] = Handlebars.compile(t, { strict: false });
                    }
                    catch (err) {
                        console.error(err);
                        _this.templates[name] = Handlebars.compile("", { strict: false });
                    }
                    if (_this.editMode && ((name == 'directory' || name == 'directoryCategoryItem') && _this.controllers && _this.controllers.directory)) {
                        _this.controllers.directory.templates.main = _this.templates[name];
                        _this.loadDirectory();
                    }
                }
            }
        }
        update(options) {
            var _this = this;
            for (var key in options) {
                if (key == "regions") {
                    $$x.each(options.regions, function (id, regionOptions) {
                        var region = _this.getRegion(id);
                        region && region.update(regionOptions);
                        if (regionOptions.gaugeValue != undefined) {
                            _this.updateGaugeMinMax();
                            _this.regionsRedrawColors();
                        }
                        if (regionOptions.disabled != undefined) {
                            _this.deselectRegion(region);
                            _this.options.regions[id] = _this.options.regions[id] || {};
                            _this.options.regions[id].disabled = region.disabled;
                        }
                    });
                }
                else if (key == "markers") {
                    $$x.each(options.markers, function (id, markerOptions) {
                        var marker = _this.getMarker(id);
                        marker && marker.update(markerOptions);
                    });
                }
                else {
                    var setter = 'set' + MapSVG.ucfirst(key);
                    if (typeof _this[setter] == 'function')
                        this[setter](options[key]);
                    else {
                        _this.options[key] = options[key];
                    }
                }
            }
        }
        getDirtyFields() {
            return this.getData();
        }
        clearDirtyFields() {
            this.dirtyFields = [];
        }
        setTitle(title) {
            title && (this.options.title = title);
        }
        setExtension(extension) {
            var _this = this;
            if (extension) {
                _this.options.extension = extension;
            }
            else {
                delete _this.options.extension;
            }
        }
        setDisableLinks(on) {
            var _this = this;
            on = MapSVG.parseBoolean(on);
            if (on) {
                $$x(_this.containers.map).on('click.a.mapsvg', 'a', function (e) {
                    e.preventDefault();
                });
            }
            else {
                $$x(_this.containers.map).off('click.a.mapsvg');
            }
            _this.disableLinks = on;
        }
        setLoadingText(val) {
            var _this = this;
            _this.options.loadingText = val;
        }
        setLockAspectRatio(onoff) {
            var _this = this;
            _this.options.lockAspectRatio = MapSVG.parseBoolean(onoff);
        }
        setMarkerEditHandler(handler) {
            var _this = this;
            _this.markerEditHandler = handler;
        }
        setRegionChoroplethField(field) {
            var _this = this;
            _this.options.regionChoroplethField = field;
            _this.redrawGauge();
        }
        setRegionEditHandler(handler) {
            this.regionEditHandler = handler;
        }
        setDisableAll(on) {
            on = MapSVG.parseBoolean(on);
            $$x.extend(true, this.options, { disableAll: on });
            $$x(this.containers.map).toggleClass('mapsvg-disabled-regions', on);
        }
        setRegionStatuses(_statuses) {
            var _this = this;
            _this.options.regionStatuses = {};
            var colors = {};
            _statuses.forEach(function (statusOptions) {
                _this.options.regionStatuses[statusOptions.value] = statusOptions;
                colors[statusOptions.value] = statusOptions.color.length ? statusOptions.color : undefined;
            });
            _this.setColors({ status: colors });
        }
        setColorsIgnore(val) {
            var _this = this;
            _this.options.colorsIgnore = MapSVG.parseBoolean(val);
            _this.regionsRedrawColors();
        }
        fixColorHash(color) {
            var hexColorNoHash = new RegExp(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
            if (color && color.match(hexColorNoHash) !== null) {
                color = '#' + color;
            }
            return color;
        }
        setColors(colors) {
            var _this = this;
            for (var i in colors) {
                if (i === 'status') {
                    for (var s in colors[i]) {
                        _this.fixColorHash(colors[i][s]);
                    }
                }
                else {
                    if (typeof colors[i] == 'string') {
                        _this.fixColorHash(colors[i]);
                    }
                }
            }
            $$x.extend(true, _this.options, { colors: colors });
            if (colors && colors.status)
                _this.options.colors.status = colors.status;
            if (_this.options.colors.markers) {
                for (var z in _this.options.colors.markers) {
                    for (var x in _this.options.colors.markers[z]) {
                        _this.options.colors.markers[z][x] = parseInt(_this.options.colors.markers[z][x]);
                    }
                }
            }
            if (_this.options.colors.background)
                $$x(_this.containers.map).css({ 'background': _this.options.colors.background });
            if (_this.options.colors.hover) {
                _this.options.colors.hover = (_this.options.colors.hover == "" + parseInt(_this.options.colors.hover)) ? parseInt(_this.options.colors.hover) : _this.options.colors.hover;
            }
            if (_this.options.colors.selected) {
                _this.options.colors.selected = (_this.options.colors.selected == "" + parseInt(_this.options.colors.selected)) ? parseInt(_this.options.colors.selected) : _this.options.colors.selected;
            }
            $$x(_this.containers.leftSidebar).css({ 'background-color': _this.options.colors.leftSidebar });
            $$x(_this.containers.rightSidebar).css({ 'background-color': _this.options.colors.rightSidebar });
            $$x(_this.containers.header).css({ 'background-color': _this.options.colors.header });
            $$x(_this.containers.footer).css({ 'background-color': _this.options.colors.footer });
            if ($$x(_this.containers.detailsView) && _this.options.colors.detailsView !== undefined) {
                $$x(_this.containers.detailsView).css({ 'background-color': _this.options.colors.detailsView });
            }
            if ($$x(_this.containers.directory) && _this.options.colors.directory !== undefined) {
                $$x(_this.containers.directory).css({ 'background-color': _this.options.colors.directory });
            }
            if ($$x(_this.containers.filtersModal) && _this.options.colors.modalFilters !== undefined) {
                $$x(_this.containers.filtersModal).css({ 'background-color': _this.options.colors.modalFilters });
            }
            if ($$x(_this.containers.filters) && _this.options.colors.directorySearch) {
                $$x(_this.containers.filters).css({
                    'background-color': _this.options.colors.directorySearch
                });
            }
            else if ($$x(_this.containers.filters)) {
                $$x(_this.containers.filters).css({
                    'background-color': ''
                });
            }
            if (!_this.containers.clustersCss) {
                _this.containers.clustersCss = $$x('<style></style>').appendTo('body')[0];
            }
            var css = '';
            if (_this.options.colors.clusters) {
                css += "background-color: " + _this.options.colors.clusters + ";";
            }
            if (_this.options.colors.clustersBorders) {
                css += "border-color: " + _this.options.colors.clustersBorders + ";";
            }
            if (_this.options.colors.clustersText) {
                css += "color: " + _this.options.colors.clustersText + ";";
            }
            $$x(_this.containers.clustersCss).html(".mapsvg-marker-cluster {" + css + "}");
            if (!_this.containers.clustersHoverCss) {
                _this.containers.clustersHoverCss = $$x('<style></style>').appendTo('body')[0];
            }
            var cssHover = "";
            if (_this.options.colors.clustersHover) {
                cssHover += "background-color: " + _this.options.colors.clustersHover + ";";
            }
            if (_this.options.colors.clustersHoverBorders) {
                cssHover += "border-color: " + _this.options.colors.clustersHoverBorders + ";";
            }
            if (_this.options.colors.clustersHoverText) {
                cssHover += "color: " + _this.options.colors.clustersHoverText + ";";
            }
            $$x(_this.containers.clustersHoverCss).html(".mapsvg-marker-cluster:hover {" + cssHover + "}");
            if (!_this.containers.markersCss) {
                _this.containers.markersCss = $$x('<style></style>').appendTo('head')[0];
            }
            var markerCssText = '.mapsvg-with-marker-active .mapsvg-marker {\n' +
                '  opacity: ' + _this.options.colors.markers.inactive.opacity / 100 + ';\n' +
                '  -webkit-filter: grayscale(' + (100 - _this.options.colors.markers.inactive.saturation) + '%);\n' +
                '  filter: grayscale(' + (100 - _this.options.colors.markers.inactive.saturation) + '%);\n' +
                '}\n' +
                '.mapsvg-with-marker-active .mapsvg-marker-active {\n' +
                '  opacity: ' + _this.options.colors.markers.active.opacity / 100 + ';\n' +
                '  -webkit-filter: grayscale(' + (100 - _this.options.colors.markers.active.saturation) + '%);\n' +
                '  filter: grayscale(' + (100 - _this.options.colors.markers.active.saturation) + '%);\n' +
                '}\n' +
                '.mapsvg-with-marker-hover .mapsvg-marker {\n' +
                '  opacity: ' + _this.options.colors.markers.unhovered.opacity / 100 + ';\n' +
                '  -webkit-filter: grayscale(' + (100 - _this.options.colors.markers.unhovered.saturation) + '%);\n' +
                '  filter: grayscale(' + (100 - _this.options.colors.markers.unhovered.saturation) + '%);\n' +
                '}\n' +
                '.mapsvg-with-marker-hover .mapsvg-marker-hover {\n' +
                '  opacity: ' + _this.options.colors.markers.hovered.opacity / 100 + ';\n' +
                '  -webkit-filter: grayscale(' + (100 - _this.options.colors.markers.hovered.saturation) + '%);\n' +
                '  filter: grayscale(' + (100 - _this.options.colors.markers.hovered.saturation) + '%);\n' +
                '}\n';
            $$x(_this.containers.markersCss).html(markerCssText);
            $$x.each(_this.options.colors, function (key, color) {
                if (color === null || color == "")
                    delete _this.options.colors[key];
            });
            _this.regionsRedrawColors();
        }
        setTooltips(options) {
            var _this = this;
            if (options.on !== undefined)
                options.on = MapSVG.parseBoolean(options.on);
            $$x.extend(true, _this.options, { tooltips: options });
            _this.tooltip = _this.tooltip || { posOriginal: {}, posShifted: {}, posShiftedPrev: {}, mirror: {} };
            _this.tooltip.posOriginal = {};
            _this.tooltip.posShifted = {};
            _this.tooltip.posShiftedPrev = {};
            _this.tooltip.mirror = {};
            if (_this.containers.tooltip) {
                _this.containers.tooltip.className = _this.containers.tooltip.className.replace(/(^|\s)mapsvg-tt-\S+/g, '');
            }
            else {
                _this.containers.tooltip = $$x('<div />').addClass('mapsvg-tooltip')[0];
                $$x(_this.containers.map).append(_this.containers.tooltip);
            }
            var ex = _this.options.tooltips.position.split('-');
            if (ex[0].indexOf('top') != -1 || ex[0].indexOf('bottom') != -1) {
                _this.tooltip.posOriginal.topbottom = ex[0];
            }
            if (ex[0].indexOf('left') != -1 || ex[0].indexOf('right') != -1) {
                _this.tooltip.posOriginal.leftright = ex[0];
            }
            if (ex[1]) {
                _this.tooltip.posOriginal.leftright = ex[1];
            }
            var event = 'mousemove.tooltip.mapsvg-' + $$x(_this.containers.map).attr('id');
            $$x(_this.containers.tooltip).addClass('mapsvg-tt-' + _this.options.tooltips.position);
            $$x(_this.containers.tooltip).css({ 'min-width': _this.options.tooltips.minWidth + 'px', 'max-width': _this.options.tooltips.maxWidth + 'px' });
            $$x('body').off(event).on(event, function (e) {
                MapSVG.mouse = MapSVG.mouseCoords(e);
                _this.containers.tooltip.style.left = (e.clientX + $$x(window).scrollLeft() - $$x(_this.containers.map).offset().left) + 'px';
                _this.containers.tooltip.style.top = (e.clientY + $$x(window).scrollTop() - $$x(_this.containers.map).offset().top) + 'px';
                var m = new ScreenPoint(e.clientX + $$x(window).scrollLeft(), e.clientY + $$x(window).scrollTop());
                var _tbbox = _this.containers.tooltip.getBoundingClientRect();
                var _mbbox = _this.containers.wrap.getBoundingClientRect();
                var tbbox = {
                    top: _tbbox.top + $$x(window).scrollTop(),
                    bottom: _tbbox.bottom + $$x(window).scrollTop(),
                    left: _tbbox.left + $$x(window).scrollLeft(),
                    right: _tbbox.right + $$x(window).scrollLeft(),
                    width: _tbbox.width,
                    height: _tbbox.height
                };
                var mbbox = {
                    top: _mbbox.top + $$x(window).scrollTop(),
                    bottom: _mbbox.bottom + $$x(window).scrollTop(),
                    left: _mbbox.left + $$x(window).scrollLeft(),
                    right: _mbbox.right + $$x(window).scrollLeft(),
                    width: _mbbox.width,
                    height: _mbbox.height
                };
                if (m.x > mbbox.right || m.y > mbbox.bottom || m.x < mbbox.left || m.y < mbbox.top) {
                    return;
                }
                if (_this.tooltip.mirror.top || _this.tooltip.mirror.bottom) {
                    if (_this.tooltip.mirror.top && m.y > _this.tooltip.mirror.top) {
                        _this.tooltip.mirror.top = 0;
                        delete _this.tooltip.posShifted.topbottom;
                    }
                    else if (_this.tooltip.mirror.bottom && m.y < _this.tooltip.mirror.bottom) {
                        _this.tooltip.mirror.bottom = 0;
                        delete _this.tooltip.posShifted.topbottom;
                    }
                }
                else {
                    if (tbbox.bottom < mbbox.top + tbbox.height) {
                        _this.tooltip.posShifted.topbottom = 'bottom';
                        _this.tooltip.mirror.top = m.y;
                    }
                    else if (tbbox.top > mbbox.bottom - tbbox.height) {
                        _this.tooltip.posShifted.topbottom = 'top';
                        _this.tooltip.mirror.bottom = m.y;
                    }
                }
                if (_this.tooltip.mirror.right || _this.tooltip.mirror.left) {
                    if (_this.tooltip.mirror.left && m.x > _this.tooltip.mirror.left) {
                        _this.tooltip.mirror.left = 0;
                        delete _this.tooltip.posShifted.leftright;
                    }
                    else if (_this.tooltip.mirror.right && m.x < _this.tooltip.mirror.right) {
                        _this.tooltip.mirror.right = 0;
                        delete _this.tooltip.posShifted.leftright;
                    }
                }
                else {
                    if (tbbox.right < mbbox.left + tbbox.width) {
                        _this.tooltip.posShifted.leftright = 'right';
                        _this.tooltip.mirror.left = m.x;
                    }
                    else if (tbbox.left > mbbox.right - tbbox.width) {
                        _this.tooltip.posShifted.leftright = 'left';
                        _this.tooltip.mirror.right = m.x;
                    }
                }
                var pos = $$x.extend({}, _this.tooltip.posOriginal, _this.tooltip.posShifted);
                var _pos = [];
                pos.topbottom && _pos.push(pos.topbottom);
                pos.leftright && _pos.push(pos.leftright);
                pos = _pos.join('-');
                if (_this.tooltip.posShifted.topbottom != _this.tooltip.posOriginal.topbottom || _this.tooltip.posShifted.leftright != _this.tooltip.posOriginal.leftright) {
                    _this.containers.tooltip.className = _this.containers.tooltip.className.replace(/(^|\s)mapsvg-tt-\S+/g, '');
                    $$x(_this.containers.tooltip).addClass('mapsvg-tt-' + pos);
                    _this.tooltip.posShiftedPrev = pos;
                }
            });
        }
        setPopovers(options) {
            var _this = this;
            if (options.on !== undefined)
                options.on = MapSVG.parseBoolean(options.on);
            $$x.extend(_this.options.popovers, options);
            if (!_this.containers.popover) {
                _this.containers.popover = $$x('<div />').addClass('mapsvg-popover')[0];
                _this.layers.popovers.append(_this.containers.popover);
            }
            $$x(_this.containers.popover).css({
                width: _this.options.popovers.width + (_this.options.popovers.width == 'auto' ? '' : 'px'),
                'max-width': _this.options.popovers.maxWidth + '%',
                'max-height': _this.options.popovers.maxHeight * $$x(_this.containers.wrap).outerHeight() / 100 + 'px'
            });
            if (_this.options.popovers.mobileFullscreen && MapSVG.isPhone) {
                $$x('body').toggleClass('mapsvg-fullscreen-popovers', true);
                $$x(_this.containers.popover).appendTo('body');
            }
        }
        setRegionPrefix(prefix) {
            var _this = this;
            _this.options.regionPrefix = prefix;
        }
        setInitialViewBox(v) {
            var _this = this;
            if (typeof v == 'string')
                v = v.trim().split(' ').map(function (v) { return parseFloat(v); });
            _this._viewBox = new ViewBox(v);
            if (_this.options.googleMaps.on) {
                _this.options.googleMaps.center = _this.googleMaps.map.getCenter().toJSON();
                _this.options.googleMaps.zoom = _this.googleMaps.map.getZoom();
            }
            _this.zoomLevel = 0;
        }
        setViewBoxOnStart() {
            var _this = this;
            _this.viewBoxFull = _this.svgDefault.viewBox;
            _this.viewBoxFake = _this.viewBox;
            _this.whRatioFull = _this.viewBoxFull.width / _this.viewBox.width;
            _this.containers.svg.setAttribute('viewBox', _this.viewBoxFull.toString());
            _this.containers.svg.style.width = _this.svgDefault.viewBox.width + 'px';
            _this.vbStart = true;
        }
        setViewBox(viewBox, skipAdjustments) {
            var _this = this;
            let initial = false;
            if (typeof viewBox === 'undefined' || (viewBox.width === 0 && viewBox.height === 0)) {
                viewBox = _this.svgDefault.viewBox;
                initial = true;
            }
            var isZooming = viewBox.width != _this.viewBox.width || viewBox.height != _this.viewBox.height;
            _this.viewBox = viewBox;
            _this.whRatio = _this.viewBox.width / _this.viewBox.height;
            !_this.vbStart && _this.setViewBoxOnStart();
            if (initial) {
                if (!_this._viewBox) {
                    _this._viewBox = _this.viewBox;
                }
                _this._scale = 1;
            }
            var p = _this.options.padding;
            if (p.top) {
                _this.viewBox.y -= p.top;
                _this.viewBox.height += p.top;
            }
            if (p.right) {
                _this.viewBox.width += p.right;
            }
            if (p.bottom) {
                _this.viewBox.height += p.bottom;
            }
            if (p.left) {
                _this.viewBox.x -= p.left;
                _this.viewBox.width += p.left;
            }
            _this.scale = _this.getScale();
            _this.superScale = _this.whRatioFull * _this.svgDefault.viewBox.width / _this.viewBox.width;
            var w = _this.svgDefault.viewBox.width / $$x(_this.containers.map).width();
            _this.superScale = _this.superScale / w;
            _this.scroll.tx = Math.round((_this.svgDefault.viewBox.x - _this.viewBox.x) * _this.scale);
            _this.scroll.ty = Math.round((_this.svgDefault.viewBox.y - _this.viewBox.y) * _this.scale);
            if (isZooming) {
                if (!_this.options.googleMaps.on) {
                    _this.enableMarkersAnimation();
                }
            }
            _this.containers.scrollpane.style.transform = 'translate(' + _this.scroll.tx + 'px,' + _this.scroll.ty + 'px)';
            _this.containers.svg.style.transform = 'scale(' + _this.superScale + ')';
            if (isZooming && !skipAdjustments) {
                _this.updateSize();
            }
            if (isZooming) {
                if (!_this.options.googleMaps.on) {
                    setTimeout(function () {
                        _this.disableMarkersAnimation();
                    }, 400);
                }
                if (_this.options.clustering.on) {
                    _this.throttle(_this.clusterizeOnZoom, 400, _this);
                }
                else {
                    _this.events.trigger('zoom');
                }
            }
            return true;
        }
        enableMarkersAnimation() {
            $$x(this.containers.map).removeClass('no-transitions-markers');
        }
        disableMarkersAnimation() {
            $$x(this.containers.map).addClass('no-transitions-markers');
        }
        clusterizeOnZoom() {
            if (this.options.googleMaps.on && this.googleMaps.map && this.zoomDelta) {
                this.zoomLevel = this.googleMaps.map.getZoom() - this.zoomDelta;
            }
            this.events.trigger('zoom');
            this.clusterizeMarkers(true);
        }
        throttle(method, delay, scope, params) {
            clearTimeout(method._tId);
            method._tId = setTimeout(function () {
                method.apply(scope, params);
            }, delay);
        }
        setViewBoxByGoogleMapBounds() {
            var _this = this;
            var googleMapBounds = _this.googleMaps.map.getBounds();
            if (!googleMapBounds)
                return;
            var googleMapBoundsJSON = googleMapBounds.toJSON();
            if (googleMapBoundsJSON.west == -180 && googleMapBoundsJSON.east == 180) {
                var center = _this.googleMaps.map.getCenter().toJSON();
            }
            var ne = new GeoPoint(googleMapBounds.getNorthEast().lat(), googleMapBounds.getNorthEast().lng());
            var sw = new GeoPoint(googleMapBounds.getSouthWest().lat(), googleMapBounds.getSouthWest().lng());
            var xyNE = _this.convertGeoToSVG(ne);
            var xySW = _this.convertGeoToSVG(sw);
            if (xyNE.x < xySW.y) {
                var mapPointsWidth = (_this.svgDefault.viewBox.width / _this.mapLonDelta) * 360;
                xySW.x = -(mapPointsWidth - xySW.y);
            }
            var width = xyNE.x - xySW.x;
            var height = xySW.y - xyNE.y;
            var viewBox = new ViewBox(xySW.x, xyNE.y, width, height);
            _this.setViewBox(viewBox);
        }
        redraw() {
            var _this = this;
            if (MapSVG.browser.ie) {
                $$x(_this.containers.svg).css({ height: _this.svgDefault.viewBox.height });
            }
            if (_this.options.googleMaps.on && _this.googleMaps.map) {
                google.maps.event.trigger(_this.googleMaps.map, 'resize');
            }
            else {
                _this.setViewBox(_this.viewBox);
            }
            $$x(_this.containers.popover) && $$x(_this.containers.popover).css({
                'max-height': _this.options.popovers.maxHeight * $$x(_this.containers.wrap).outerHeight() / 100 + 'px'
            });
            if (this.controllers && this.controllers.directory) {
                this.controllers.directory.updateTopShift();
                this.controllers.directory.updateScroll();
            }
            _this.updateSize();
        }
        setPadding(options) {
            var _this = this;
            options = options || _this.options.padding;
            for (var i in options) {
                options[i] = options[i] ? parseInt(options[i]) : 0;
            }
            $$x.extend(_this.options.padding, options);
            _this.setViewBox();
            _this.events.trigger('sizeChange');
        }
        setSize(width, height, responsive) {
            var _this = this;
            _this.options.width = width;
            _this.options.height = height;
            _this.options.responsive = responsive != null && responsive != undefined ? MapSVG.parseBoolean(responsive) : _this.options.responsive;
            if ((!_this.options.width && !_this.options.height)) {
                _this.options.width = _this.svgDefault.width;
                _this.options.height = _this.svgDefault.height;
            }
            else if (!_this.options.width && _this.options.height) {
                _this.options.width = _this.options.height * _this.svgDefault.width / _this.svgDefault.height;
            }
            else if (_this.options.width && !_this.options.height) {
                _this.options.height = _this.options.width * _this.svgDefault.height / _this.svgDefault.width;
            }
            _this.whRatio = _this.options.width / _this.options.height;
            _this.scale = _this.getScale();
            _this.setResponsive(responsive);
            if (_this.markers)
                _this.markersAdjustPosition();
            if (_this.options.labelsRegions.on) {
                _this.labelsRegionsAdjustPosition();
            }
            return [_this.options.width, _this.options.height];
        }
        setResponsive(on) {
            var _this = this;
            on = on != undefined ? MapSVG.parseBoolean(on) : _this.options.responsive;
            $$x(_this.containers.map).css({
                'width': '100%',
                'height': '0',
                'padding-bottom': (_this.viewBox.height * 100 / _this.viewBox.width) + '%'
            });
            if (on) {
                $$x(_this.containers.wrap).css({
                    'width': '100%',
                    'height': 'auto'
                });
            }
            else {
                $$x(_this.containers.wrap).css({
                    'width': _this.options.width + 'px',
                    'height': _this.options.height + 'px'
                });
            }
            $$x.extend(true, _this.options, { responsive: on });
            if (!_this.resizeSensor) {
                _this.resizeSensor = new ResizeSensor(_this.containers.map, function () {
                    _this.redraw();
                });
            }
            _this.redraw();
        }
        setScroll(options, skipEvents) {
            var _this = this;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.limit != undefined && (options.limit = MapSVG.parseBoolean(options.limit));
            $$x.extend(true, _this.options, { scroll: options });
            !skipEvents && _this.setEventHandlers();
        }
        setZoom(options) {
            var _this = this;
            options = options || {};
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.fingers != undefined && (options.fingers = MapSVG.parseBoolean(options.fingers));
            options.mousewheel != undefined && (options.mousewheel = MapSVG.parseBoolean(options.mousewheel));
            options.delta = 2;
            if (options.limit) {
                if (typeof options.limit == 'string')
                    options.limit = options.limit.split(';');
                options.limit = [parseInt(options.limit[0]), parseInt(options.limit[1])];
            }
            if (!_this.zoomLevels) {
                _this.setZoomLevels();
            }
            $$x.extend(true, _this.options, { zoom: options });
            $$x(_this.containers.map).off('wheel.mapsvg');
            if (_this.options.zoom.mousewheel) {
                if (MapSVG.browser.firefox) {
                    _this.firefoxScroll = { insideIframe: false, scrollX: 0, scrollY: 0 };
                    $$x(_this.containers.map).on('mouseenter', function () {
                        _this.firefoxScroll.insideIframe = true;
                        _this.firefoxScroll.scrollX = window.scrollX;
                        _this.firefoxScroll.scrollY = window.scrollY;
                    }).on('mouseleave', function () {
                        _this.firefoxScroll.insideIframe = false;
                    });
                    $$x(document).scroll(function () {
                        if (_this.firefoxScroll.insideIframe)
                            window.scrollTo(_this.firefoxScroll.scrollX, _this.firefoxScroll.scrollY);
                    });
                }
                $$x(_this.containers.map).on('wheel.mapsvg', function (event) {
                    if ($$x(event.target).hasClass('mapsvg-popover') || $$x(event.target).closest('.mapsvg-popover').length)
                        return;
                    event.preventDefault();
                    var d = Math.sign(-event.originalEvent.deltaY);
                    var m = MapSVG.mouseCoords(event.originalEvent);
                    m.x = m.x - $$x(_this.containers.svg).offset().left;
                    m.y = m.y - $$x(_this.containers.svg).offset().top;
                    var center = _this.convertPixelToSVG(new ScreenPoint(m.x, m.y));
                    d > 0 ? _this.zoomIn(center) : _this.zoomOut(center);
                    return false;
                });
            }
            _this.canZoom = true;
        }
        setControls(options) {
            var _this = this;
            options = options || {};
            $$x.extend(true, _this.options, { controls: options });
            _this.options.controls.zoom = MapSVG.parseBoolean(_this.options.controls.zoom);
            _this.options.controls.zoomReset = MapSVG.parseBoolean(_this.options.controls.zoomReset);
            _this.options.controls.userLocation = MapSVG.parseBoolean(_this.options.controls.userLocation);
            var loc = _this.options.controls.location || 'right';
            if (!_this.containers.controls) {
                var buttons = $$x('<div />').addClass('mapsvg-buttons');
                var zoomGroup = $$x('<div />').addClass('mapsvg-btn-group').appendTo(buttons);
                var zoomIn = $$x('<div />').addClass('mapsvg-btn-map mapsvg-in');
                zoomIn.on('touchend click', function (e) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    _this.zoomIn();
                });
                var zoomOut = $$x('<div />').addClass('mapsvg-btn-map mapsvg-out');
                zoomOut.on('touchend click', function (e) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    _this.zoomOut();
                });
                zoomGroup.append(zoomIn).append(zoomOut);
                var location = $$x('<div />').addClass('mapsvg-btn-map mapsvg-btn-location');
                location.on('touchend click', function (e) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    _this.showUserLocation(function (location) {
                        if (_this.options.scroll.on) {
                            _this.centerOn(location.marker);
                        }
                    });
                });
                var userLocationIcon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 447.342 447.342" style="enable-background:new 0 0 447.342 447.342;" xml:space="preserve"><path d="M443.537,3.805c-3.84-3.84-9.686-4.893-14.625-2.613L7.553,195.239c-4.827,2.215-7.807,7.153-7.535,12.459 c0.254,5.305,3.727,9.908,8.762,11.63l129.476,44.289c21.349,7.314,38.125,24.089,45.438,45.438l44.321,129.509 c1.72,5.018,6.325,8.491,11.63,8.762c5.306,0.271,10.244-2.725,12.458-7.535L446.15,18.429 C448.428,13.491,447.377,7.644,443.537,3.805z"/></svg>';
                location.html(userLocationIcon);
                var locationGroup = $$x('<div />').addClass('mapsvg-btn-group').appendTo(buttons);
                locationGroup.append(location);
                var zoomResetIcon = '<svg height="14px" version="1.1" viewBox="0 0 14 14" width="14px" xmlns="http://www.w3.org/2000/svg" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:xlink="http://www.w3.org/1999/xlink"><g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1"><g fill="#000000" transform="translate(-215.000000, -257.000000)"><g id="fullscreen" transform="translate(215.000000, 257.000000)"><path d="M2,9 L0,9 L0,14 L5,14 L5,12 L2,12 L2,9 L2,9 Z M0,5 L2,5 L2,2 L5,2 L5,0 L0,0 L0,5 L0,5 Z M12,12 L9,12 L9,14 L14,14 L14,9 L12,9 L12,12 L12,12 Z M9,0 L9,2 L12,2 L12,5 L14,5 L14,0 L9,0 L9,0 Z" /></g></g></g></svg>';
                var zoomResetButton = $$x('<div />').html(zoomResetIcon).addClass('mapsvg-btn-map mapsvg-btn-zoom-reset');
                zoomResetButton.on('touchend click', function (e) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    _this.viewBoxReset(true);
                });
                var zoomResetGroup = $$x('<div />').addClass('mapsvg-btn-group').appendTo(buttons);
                zoomResetGroup.append(zoomResetButton);
                _this.containers.controls = buttons[0];
                _this.controls = {
                    zoom: zoomGroup[0],
                    userLocation: locationGroup[0],
                    zoomReset: zoomResetGroup[0]
                };
                $$x(_this.containers.map).append($$x(_this.containers.controls));
            }
            $$x(_this.controls.zoom).toggle(_this.options.controls.zoom);
            $$x(_this.controls.userLocation).toggle(_this.options.controls.userLocation);
            $$x(_this.controls.zoomReset).toggle(_this.options.controls.zoomReset);
            $$x(_this.containers.controls).removeClass('left');
            $$x(_this.containers.controls).removeClass('right');
            loc == 'right' && $$x(_this.containers.controls).addClass('right')
                ||
                    loc == 'left' && $$x(_this.containers.controls).addClass('left');
        }
        setZoomLevels() {
            var _this = this;
            _this.zoomLevels = {};
            var _scale = 1;
            for (var i = 0; i <= 20; i++) {
                _this.zoomLevels[i + ''] = {
                    _scale: _scale,
                    viewBox: new ViewBox(0, 0, _this._viewBox.width / _scale, _this._viewBox.height / _scale)
                };
                _scale = _scale * _this.options.zoom.delta;
            }
            _scale = 1;
            for (var i = 0; i >= -20; i--) {
                _this.zoomLevels[i + ''] = {
                    _scale: _scale,
                    viewBox: new ViewBox(0, 0, _this._viewBox.width / _scale, _this._viewBox.height / _scale)
                };
                _scale = _scale / _this.options.zoom.delta;
            }
        }
        setCursor(type) {
            var _this = this;
            type = type == 'pointer' ? 'pointer' : 'default';
            _this.options.cursor = type;
            if (type == 'pointer')
                $$x(_this.containers.map).addClass('mapsvg-cursor-pointer');
            else
                $$x(_this.containers.map).removeClass('mapsvg-cursor-pointer');
        }
        setMultiSelect(on, deselect) {
            var _this = this;
            _this.options.multiSelect = MapSVG.parseBoolean(on);
            if (deselect !== false)
                _this.deselectAllRegions();
        }
        setGauge(options) {
            var _this = this;
            options = options || _this.options.gauge;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            $$x.extend(true, _this.options, { gauge: options });
            var needsRedraw = false;
            if (!_this.containers.legend) {
                _this.containers.legend = {
                    gradient: $$x('<td>&nbsp;</td>').addClass('mapsvg-gauge-gradient')[0],
                    container: $$x('<div />').addClass('mapsvg-gauge').hide()[0],
                    table: $$x('<table />')[0],
                    labelLow: $$x('<td>' + _this.options.gauge.labels.low + '</td>')[0],
                    labelHigh: $$x('<td>' + _this.options.gauge.labels.high + '</td>')[0]
                };
                _this.setGaugeGradientCSS();
                var tr = $$x('<tr />');
                tr.append(_this.containers.legend.labelLow);
                tr.append(_this.containers.legend.gradient);
                tr.append(_this.containers.legend.labelHigh);
                $$x(_this.containers.legend.table).append(tr);
                $$x(_this.containers.legend.container).append(_this.containers.legend.table);
                $$x(_this.containers.map).append(_this.containers.legend.container);
            }
            if (!_this.options.gauge.on && $$x(_this.containers.legend.container).is(":visible")) {
                $$x(_this.containers.legend.container).hide();
                needsRedraw = true;
            }
            else if (_this.options.gauge.on && !$$x(_this.containers.legend.container).is(":visible")) {
                $$x(_this.containers.legend.container).show();
                needsRedraw = true;
                _this.regionsRepository.events.on('updated', function () {
                    _this.redrawGauge();
                });
            }
            if (options.colors) {
                _this.options.gauge.colors.lowRGB = tinycolor(_this.options.gauge.colors.low).toRgb();
                _this.options.gauge.colors.highRGB = tinycolor(_this.options.gauge.colors.high).toRgb();
                _this.options.gauge.colors.diffRGB = {
                    r: _this.options.gauge.colors.highRGB.r - _this.options.gauge.colors.lowRGB.r,
                    g: _this.options.gauge.colors.highRGB.g - _this.options.gauge.colors.lowRGB.g,
                    b: _this.options.gauge.colors.highRGB.b - _this.options.gauge.colors.lowRGB.b,
                    a: _this.options.gauge.colors.highRGB.a - _this.options.gauge.colors.lowRGB.a
                };
                needsRedraw = true;
                _this.containers.legend && _this.setGaugeGradientCSS();
            }
            if (options.labels) {
                $$x(_this.containers.legend.labelLow).html(_this.options.gauge.labels.low);
                $$x(_this.containers.legend.labelHigh).html(_this.options.gauge.labels.high);
            }
            needsRedraw && _this.redrawGauge();
        }
        redrawGauge() {
            var _this = this;
            _this.updateGaugeMinMax();
            _this.regionsRedrawColors();
        }
        updateGaugeMinMax() {
            var _this = this;
            _this.options.gauge.min = 0;
            _this.options.gauge.max = null;
            var values = [];
            _this.regions.forEach(function (r) {
                var gauge = r.data && r.data[_this.options.regionChoroplethField];
                gauge != undefined && values.push(gauge);
            });
            if (values.length > 0) {
                _this.options.gauge.min = values.length == 1 ? 0 : Math.min.apply(null, values);
                _this.options.gauge.max = Math.max.apply(null, values);
                _this.options.gauge.maxAdjusted = _this.options.gauge.max - _this.options.gauge.min;
            }
        }
        setGaugeGradientCSS() {
            var _this = this;
            $$x(_this.containers.legend.gradient).css({
                'background': 'linear-gradient(to right,' + _this.options.gauge.colors.low + ' 1%,' + _this.options.gauge.colors.high + ' 100%)',
                'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr="' + _this.options.gauge.colors.low + '", endColorstr="' + _this.options.gauge.colors.high + '",GradientType=1 )'
            });
        }
        setCss(css) {
            var _this = this;
            _this.options.css = css || (_this.options.css ? _this.options.css.replace(/%id%/g, '' + this.id) : '');
            _this.liveCss = _this.liveCss || $$x('<style></style>').appendTo('head')[0];
            $$x(_this.liveCss).html(_this.options.css);
        }
        setFilters(options) {
            var _this = this;
            options = options || _this.options.filters;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.hide != undefined && (options.hide = MapSVG.parseBoolean(options.hide));
            $$x.extend(true, _this.options, { filters: options });
            if (['leftSidebar', 'rightSidebar', 'header', 'footer', 'custom', 'map'].indexOf(_this.options.filters.location) === -1) {
                _this.options.filters.location = 'leftSidebar';
            }
            if (_this.options.filters.on) {
                if (_this.formBuilder) {
                    _this.formBuilder.destroy();
                }
                if (!_this.containers.filters) {
                    _this.containers.filters = $$x('<div class="mapsvg-filters-wrap"></div>')[0];
                }
                else {
                    $$x(_this.containers.filters).empty();
                    $$x(_this.containers.filters).show();
                }
                $$x(_this.containers.filters).css({
                    'background-color': _this.options.colors.directorySearch,
                });
                if ($$x(_this.containers.filtersModal)) {
                    $$x(_this.containers.filtersModal).css({ width: _this.options.filters.width });
                }
                if (_this.options.filters.location === 'custom') {
                    $$x(_this.containers.filters).removeClass('mapsvg-filter-container-custom').addClass('mapsvg-filter-container-custom');
                    if ($$x('#' + _this.options.filters.containerId).length) {
                        $$x('#' + _this.options.filters.containerId).append(_this.containers.filters);
                    }
                    else {
                        $$x(_this.containers.filters).hide();
                        console.error('MapSVG: filter container #' + _this.options.filters.containerId + ' does not exists');
                    }
                }
                else {
                    if (MapSVG.isPhone) {
                        $$x(_this.containers.header).append($$x(_this.containers.filters));
                        _this.setContainers({ header: { on: true } });
                    }
                    else {
                        var location = MapSVG.isPhone ? 'header' : _this.options.filters.location;
                        if (_this.options.menu.on && _this.controllers.directory && _this.options.menu.location === _this.options.filters.location) {
                            $$x(_this.controllers.directory.containers.view).find('.mapsvg-directory-filter-wrap').append($$x(_this.containers.filters));
                            _this.controllers.directory.updateTopShift();
                        }
                        else {
                            $$x(_this.containers[location]).append($$x(_this.containers.filters));
                            _this.controllers.directory && _this.controllers.directory.updateTopShift();
                        }
                    }
                }
                _this.loadFiltersController(_this.containers.filters, false);
                _this.updateFiltersState();
            }
            else {
                if ($$x(_this.containers.filters)) {
                    $$x(_this.containers.filters).empty();
                    $$x(_this.containers.filters).hide();
                }
            }
            if (_this.options.menu.on && _this.controllers.directory && _this.options.menu.location === _this.options.filters.location) {
                _this.controllers.directory.updateTopShift();
            }
        }
        updateFiltersState() {
            var _this = this;
            $$x(_this.containers.filterTags) && $$x(_this.containers.filterTags).empty();
            if ((_this.options.filters && _this.options.filters.on) || _this.objectsRepository.query.hasFilters()) {
                for (var field_name in _this.objectsRepository.query.filters) {
                    var field_value = _this.objectsRepository.query.filters[field_name];
                    var _field_name = field_name;
                    var filterField = _this.filtersSchema.getField(_field_name);
                    if (_this.options.filters.on && filterField) {
                        $$x(_this.containers.filters).find('select[data-parameter-name="' + _field_name + '"],radio[data-parameter-name="\'+_field_name+\'"]')
                            .data('ignoreSelect2Change', true)
                            .val(field_value)
                            .trigger('change');
                    }
                    else {
                        if (field_name == 'regions') {
                            _field_name = '';
                            var field_value = field_value.region_ids.map(id => _this.getRegion(id).title);
                        }
                        else {
                            _field_name = filterField && filterField.label;
                        }
                        if (field_name !== 'distance') {
                            if (!_this.containers.filterTags) {
                                _this.containers.filterTags = $$x('<div class="mapsvg-filter-tags"></div>')[0];
                                if ($$x(_this.containers.filters)) ;
                                else {
                                    if (_this.options.menu.on && _this.controllers.directory) {
                                        $$x(_this.controllers.directory.containers.toolbar).append(_this.containers.filterTags);
                                        _this.controllers.directory.updateTopShift();
                                    }
                                    else {
                                        $$x(_this.containers.map).append(_this.containers.filterTags);
                                        if (_this.options.zoom.buttons.on) {
                                            if (_this.options.layersControl.on) {
                                                if (_this.options.layersControl.position == 'top-left') {
                                                    $$x(_this.containers.filterTags).css({
                                                        right: 0,
                                                        bottom: 0
                                                    });
                                                }
                                                else {
                                                    $$x(_this.containers.filterTags).css({
                                                        bottom: 0
                                                    });
                                                }
                                            }
                                            else {
                                                if (_this.options.zoom.buttons.location == 'left') {
                                                    $$x(_this.containers.filterTags).css({
                                                        right: 0
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                                $$x(_this.containers.filterTags).on('click', '.mapsvg-filter-delete', function (e) {
                                    var filterField = $$x(this).data('filter');
                                    $$x(this).parent().remove();
                                    _this.objectsRepository.query.removeFilter(filterField);
                                    _this.deselectAllRegions();
                                    _this.loadDataObjects();
                                });
                            }
                            $$x(_this.containers.filterTags).append('<div class="mapsvg-filter-tag">' + (_field_name ? _field_name + ': ' : '') + field_value + ' <span class="mapsvg-filter-delete" data-filter="' + field_name + '">??</span></div>');
                        }
                    }
                }
            }
        }
        setContainers(options) {
            var _this = this;
            if (!this.containersCreated) {
                this.containers.wrapAll = document.createElement('div');
                this.containers.wrapAll.classList.add('mapsvg-wrap-all');
                this.containers.wrapAll.id = 'mapsvg-map-' + this.id;
                this.containers.wrapAll.setAttribute('data-map-id', this.id ? (this.id).toString() : '');
                this.containers.wrap = document.createElement('div');
                this.containers.wrap.classList.add('mapsvg-wrap');
                this.containers.mapContainer = document.createElement('div');
                this.containers.mapContainer.classList.add('mapsvg-map-container');
                this.containers.leftSidebar = document.createElement('div');
                this.containers.leftSidebar.className = 'mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-left';
                this.containers.rightSidebar = document.createElement('div');
                this.containers.rightSidebar.className = "mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-right";
                this.containers.header = document.createElement('div');
                this.containers.header.className = "mapsvg-header mapsvg-top-container";
                this.containers.footer = document.createElement('div');
                this.containers.footer.className = "mapsvg-footer mapsvg-top-container";
                _this.containers.wrapAll = $$x('<div class="mapsvg-wrap-all"></div>').attr('id', 'mapsvg-map-' + this.id).attr('data-map-id', this.id)[0];
                _this.containers.wrap = $$x('<div class="mapsvg-wrap"></div>')[0];
                _this.containers.mapContainer = $$x('<div class="mapsvg-map-container"></div>')[0];
                _this.containers.leftSidebar = $$x('<div class="mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-left"></div>')[0];
                _this.containers.rightSidebar = $$x('<div class="mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-right"></div>')[0];
                _this.containers.header = $$x('<div class="mapsvg-header mapsvg-top-container"></div>')[0];
                _this.containers.footer = $$x('<div class="mapsvg-footer mapsvg-top-container"></div>')[0];
                $$x(_this.containers.wrapAll).insertBefore(_this.containers.map);
                $$x(_this.containers.wrapAll).append(_this.containers.header);
                $$x(_this.containers.wrapAll).append(_this.containers.wrap);
                $$x(_this.containers.wrapAll).append(_this.containers.footer);
                $$x(_this.containers.mapContainer).append(_this.containers.map);
                $$x(_this.containers.wrap).append(_this.containers.leftSidebar);
                $$x(_this.containers.wrap).append(_this.containers.mapContainer);
                $$x(_this.containers.wrap).append(_this.containers.rightSidebar);
                _this.containersCreated = true;
            }
            options = options || _this.options.containers || {};
            for (var contName in options) {
                if (options[contName].on !== undefined) {
                    options[contName].on = MapSVG.parseBoolean(options[contName].on);
                }
                if (options[contName].width) {
                    if ((typeof options[contName].width != 'string') || options[contName].width.indexOf('px') === -1 && options[contName].width.indexOf('%') === -1 && options[contName].width !== 'auto') {
                        options[contName].width = options[contName].width + 'px';
                    }
                    $$x(_this.containers[contName]).css({ 'flex-basis': options[contName].width });
                }
                if (options[contName].height) {
                    if ((typeof options[contName].height != 'string') || options[contName].height.indexOf('px') === -1 && options[contName].height.indexOf('%') === -1 && options[contName].height !== 'auto') {
                        options[contName].height = options[contName].height + 'px';
                    }
                    $$x(_this.containers[contName]).css({ 'flex-basis': options[contName].height, height: options[contName].height });
                }
                $$x.extend(true, _this.options, { containers: options });
                var on = _this.options.containers[contName].on;
                if (MapSVG.isPhone && _this.options.menu.hideOnMobile && _this.options.menu.location === contName && ['leftSidebar', 'rightSidebar'].indexOf(contName) !== -1) {
                    on = false;
                }
                else if (MapSVG.isPhone && _this.options.menu.location === 'custom' && ['leftSidebar', 'rightSidebar'].indexOf(contName) !== -1) {
                    on = false;
                    $$x(_this.containers.wrapAll).addClass('mapsvg-hide-map-list-buttons');
                }
                else if (MapSVG.isPhone && !_this.options.menu.hideOnMobile && _this.options.menu.location === contName && ['leftSidebar', 'rightSidebar'].indexOf(contName) !== -1) {
                    $$x(_this.containers.wrapAll).addClass('mapsvg-hide-map-list-buttons');
                    $$x(_this.containers.wrapAll).addClass('mapsvg-directory-visible');
                }
                $$x(_this.containers[contName]).toggle(on);
            }
            _this.setDetailsView();
        }
        shouldBeScrollable(container) {
            var _this = this;
            switch (container) {
                case 'map':
                case 'leftSidebar':
                case 'rightSidebar':
                    return true;
                case 'custom':
                    return false;
                case 'header':
                case 'footer':
                    if (_this.options.containers[container].height && _this.options.containers[container].height !== 'auto' && _this.options.containers[container].height !== '100%') {
                        return true;
                    }
                    else {
                        return false;
                    }
                default:
                    return false;
            }
        }
        setDirectory(options) {
            var _this = this;
            return _this.setMenu(options);
        }
        setMenu(options) {
            var _this = this;
            options = options || _this.options.menu;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.search != undefined && (options.search = MapSVG.parseBoolean(options.search));
            options.showMapOnClick != undefined && (options.showMapOnClick = MapSVG.parseBoolean(options.showMapOnClick));
            options.searchFallback != undefined && (options.searchFallback = MapSVG.parseBoolean(options.searchFallback));
            options.customContainer != undefined && (options.customContainer = MapSVG.parseBoolean(options.customContainer));
            $$x.extend(true, _this.options, { menu: options });
            _this.controllers = _this.controllers || {};
            if (!_this.containers.directory) {
                _this.containers.directory = $$x('<div class="mapsvg-directory"></div>')[0];
            }
            $$x(_this.containers.directory).toggleClass('flex', _this.shouldBeScrollable(_this.options.menu.location));
            if (_this.options.menu.on) {
                if (!_this.controllers.directory) {
                    _this.controllers.directory = new DirectoryController({
                        container: _this.containers.directory,
                        template: _this.templates.directory,
                        mapsvg: _this,
                        repository: _this.options.menu.source === 'regions' ? _this.regionsRepository : _this.objectsRepository,
                        scrollable: _this.shouldBeScrollable(_this.options.menu.location),
                        events: {
                            'click': _this.events['click.directoryItem'],
                            'mouseover': _this.events['mouseover.directoryItem'],
                            'mouseout': _this.events['mouseout.directoryItem']
                        }
                    });
                    _this.controllers.directory._init();
                }
                else {
                    _this.controllers.directory.repository = _this.options.menu.source === 'regions' ? _this.regionsRepository : _this.objectsRepository;
                    _this.controllers.directory.repository.query.update({ sort: [{
                                field: _this.options.menu.sortBy,
                                order: _this.options.menu.sortDirection
                            }] });
                    if (options.filterout) {
                        var f = {};
                        f[_this.options.menu.filterout.field] = _this.options.menu.filterout.val;
                        _this.controllers.directory.repository.query.setFilterOut(f);
                    }
                    _this.controllers.directory.scrollable = _this.shouldBeScrollable(_this.options.menu.location);
                }
                var $container;
                if (MapSVG.isPhone && _this.options.menu.hideOnMobile) {
                    $container = $$x(_this.containers.leftSidebar);
                }
                else {
                    $container = _this.options.menu.location !== 'custom' ? $$x(_this.containers[_this.options.menu.location]) : $$x('#' + _this.options.menu.containerId);
                }
                $container.append(_this.containers.directory);
                if (_this.options.colors.directory) {
                    $$x(_this.containers.directory).css({
                        'background-color': _this.options.colors.directory
                    });
                }
                _this.setFilters();
                _this.setTemplates({ directoryItem: _this.options.templates.directoryItem });
                if ((_this.options.menu.source === 'regions' && _this.regionsRepository.loaded) || (_this.options.menu.source === 'database' && _this.objectsRepository.loaded)) {
                    if (_this.editMode && (options.sortBy || options.sortDirection || options.filterout)) {
                        _this.controllers.directory.repository.reload();
                    }
                    _this.loadDirectory();
                }
            }
            else {
                _this.controllers.directory && _this.controllers.directory.destroy();
                _this.controllers.directory = null;
            }
        }
        setDatabase(options) {
            var _this = this;
            options = options || _this.options.database;
            if (options.pagination) {
                if (options.pagination.on != undefined) {
                    options.pagination.on = MapSVG.parseBoolean(options.pagination.on);
                }
                if (options.pagination.perpage != undefined) {
                    options.pagination.perpage = parseInt(options.pagination.perpage);
                }
            }
            $$x.extend(true, _this.options, { database: options });
            if (options.pagination) {
                if (options.pagination.on !== undefined || options.pagination.perpage) {
                    var query = new Query({
                        perpage: _this.options.database.pagination.on ? _this.options.database.pagination.perpage : 0
                    });
                    _this.objectsRepository.find(query);
                }
                else {
                    _this.setPagination();
                }
            }
        }
        setGoogleMaps(options) {
            var _this = this;
            options = options || _this.options.googleMaps;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            if (!_this.googleMaps) {
                _this.googleMaps = { loaded: false, initialized: false, map: null, overlay: null };
            }
            $$x.extend(true, _this.options, { googleMaps: options });
            if (_this.options.googleMaps.on) {
                $$x(_this.containers.map).toggleClass('mapsvg-with-google-map', true);
                if (!MapSVG.googleMapsApiLoaded) {
                    _this.loadGoogleMapsAPI(function () {
                        _this.setGoogleMaps();
                    }, function () {
                        _this.setGoogleMaps({ on: false });
                    });
                }
                else {
                    if (!_this.googleMaps.map) {
                        _this.containers.googleMaps = $$x('<div class="mapsvg-layer mapsvg-layer-gm" id="mapsvg-google-maps-' + _this.id + '"></div>').prependTo(_this.containers.map)[0];
                        $$x(_this.containers.googleMaps).css({
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            'z-index': '0'
                        });
                        _this.googleMaps.map = new google.maps.Map(_this.containers.googleMaps, {
                            mapTypeId: options.type,
                            fullscreenControl: false,
                            keyboardShortcuts: false,
                            mapTypeControl: false,
                            scaleControl: false,
                            scrollwheel: false,
                            streetViewControl: false,
                            zoomControl: false,
                            styles: options.styleJSON
                        });
                        USGSOverlay.prototype = new google.maps.OverlayView();
                        function USGSOverlay(bounds, map) {
                            this.bounds_ = bounds;
                            this.map_ = map;
                            this.setMap(map);
                            this.prevCoords = {
                                sw: { x: 0, y: 0 },
                                sw2: { x: 0, y: 0 },
                                ne: { x: 0, y: 0 },
                                ne2: { x: 0, y: 0 }
                            };
                        }
                        USGSOverlay.prototype.onAdd = function () {
                            var div = document.createElement('div');
                            div.style.borderStyle = 'none';
                            div.style.borderWidth = '0px';
                            div.style.position = 'absolute';
                            this.div_ = div;
                            var panes = this.getPanes();
                            panes.overlayLayer.appendChild(div);
                        };
                        USGSOverlay.prototype.draw = function (t) {
                            if (_this.isScrolling)
                                return;
                            var overlayProjection = this.getProjection();
                            if (!overlayProjection)
                                return;
                            var geoSW = this.bounds_.getSouthWest();
                            var geoNE = this.bounds_.getNorthEast();
                            var coords = {
                                sw: overlayProjection.fromLatLngToDivPixel(geoSW),
                                ne: overlayProjection.fromLatLngToDivPixel(geoNE),
                                sw2: overlayProjection.fromLatLngToContainerPixel(geoSW),
                                ne2: overlayProjection.fromLatLngToContainerPixel(geoNE)
                            };
                            var ww = overlayProjection.getWorldWidth();
                            if (this.prevCoords.sw) {
                                if (coords.ne.x < coords.sw.x) {
                                    if (Math.abs(this.prevCoords.sw.x - coords.sw.x) > Math.abs(this.prevCoords.ne.x - coords.ne.x)) {
                                        coords.sw.x = coords.sw.x - ww;
                                    }
                                    else {
                                        coords.ne.x = coords.ne.x + ww;
                                    }
                                    if (Math.abs(this.prevCoords.sw2.x - coords.sw2.x) > Math.abs(this.prevCoords.ne2.x - coords.ne2.x)) {
                                        coords.sw2.x = coords.sw2.x - ww;
                                    }
                                    else {
                                        coords.ne2.x = coords.ne2.x + ww;
                                    }
                                }
                            }
                            for (var i in this.prevCoords) { }
                            this.prevCoords = coords;
                            var scale = (coords.ne2.x - coords.sw2.x) / _this.svgDefault.viewBox.width;
                            var vb = new ViewBox(_this.svgDefault.viewBox.x - coords.sw2.x / scale, _this.svgDefault.viewBox.y - coords.ne2.y / scale, $$x(_this.containers.map).width() / scale, $$x(_this.containers.map).outerHeight() / scale);
                            _this.setViewBox(vb);
                        };
                        var southWest = new google.maps.LatLng(_this.geoViewBox.sw.lat, _this.geoViewBox.sw.lng);
                        var northEast = new google.maps.LatLng(_this.geoViewBox.ne.lat, _this.geoViewBox.ne.lng);
                        var bounds = new google.maps.LatLngBounds(southWest, northEast);
                        _this.googleMaps.overlay = new USGSOverlay(bounds, _this.googleMaps.map);
                        if (!_this.options.googleMaps.center || !_this.options.googleMaps.zoom) {
                            _this.googleMaps.map.fitBounds(bounds, 0);
                        }
                        else {
                            _this.googleMaps.map.setZoom(_this.options.googleMaps.zoom);
                            _this.googleMaps.map.setCenter(_this.options.googleMaps.center);
                        }
                        _this.googleMaps.initialized = true;
                        _this.googleMaps.map.addListener('idle', function () {
                            _this.isZooming = false;
                        });
                        google.maps.event.addListenerOnce(_this.googleMaps.map, 'idle', function () {
                            setTimeout(function () {
                                $$x(_this.containers.map).addClass('mapsvg-fade-in');
                                setTimeout(function () {
                                    $$x(_this.containers.map).removeClass('mapsvg-google-map-loading');
                                    $$x(_this.containers.map).removeClass('mapsvg-fade-in');
                                    if (!_this.options.googleMaps.center || !_this.options.googleMaps.zoom) {
                                        _this.options.googleMaps.center = _this.googleMaps.map.getCenter().toJSON();
                                        _this.options.googleMaps.zoom = _this.googleMaps.map.getZoom();
                                    }
                                    _this.zoomDelta = _this.options.googleMaps.zoom - _this.zoomLevel;
                                    _this.events.trigger('googleMapsLoaded');
                                }, 300);
                            }, 1);
                        });
                    }
                    else {
                        $$x(_this.containers.map).toggleClass('mapsvg-with-google-map', true);
                        $$x(_this.containers.googleMaps) && $$x(_this.containers.googleMaps).show();
                        if (options.type) {
                            _this.googleMaps.map.setMapTypeId(options.type);
                        }
                    }
                }
            }
            else {
                $$x(_this.containers.map).toggleClass('mapsvg-with-google-map', false);
                $$x(_this.containers.googleMaps) && $$x(_this.containers.googleMaps).hide();
                _this.googleMaps.initialized = false;
            }
        }
        loadGoogleMapsAPI(callback, fail) {
            var _this = this;
            if (window.google !== undefined && google.maps) {
                MapSVG.googleMapsApiLoaded = true;
            }
            if (MapSVG.googleMapsApiLoaded) {
                if (typeof callback == 'function') {
                    callback();
                }
                return;
            }
            MapSVG.googleMapsLoadCallbacks = MapSVG.googleMapsLoadCallbacks || [];
            if (typeof callback == 'function') {
                MapSVG.googleMapsLoadCallbacks.push(callback);
            }
            if (MapSVG.googleMapsApiIsLoading) {
                return;
            }
            MapSVG.googleMapsApiIsLoading = true;
            window.gm_authFailure = function () {
                if (MapSVG.GoogleMapBadApiKey) {
                    MapSVG.GoogleMapBadApiKey();
                }
                else {
                    alert("Google maps API key is incorrect.");
                }
            };
            _this.googleMapsScript = document.createElement('script');
            _this.googleMapsScript.onload = function () {
                MapSVG.googleMapsApiLoaded = true;
                MapSVG.googleMapsLoadCallbacks.forEach(function (_callback) {
                    if (typeof callback == 'function')
                        _callback();
                });
            };
            var gmLibraries = [];
            if (_this.options.googleMaps.drawingTools) {
                gmLibraries.push('drawing');
            }
            if (_this.options.googleMaps.geometry) {
                gmLibraries.push('geometry');
            }
            var libraries = '';
            if (gmLibraries.length > 0) {
                libraries = '&libraries=' + gmLibraries.join(',');
            }
            _this.googleMapsScript.src = 'https://maps.googleapis.com/maps/api/js?language=en&key=' + _this.options.googleMaps.apiKey + libraries;
            document.head.appendChild(_this.googleMapsScript);
        }
        loadDetailsView(obj) {
            var _this = this;
            _this.controllers.popover && _this.controllers.popover.close();
            if (_this.controllers.detailsView)
                _this.controllers.detailsView.destroy();
            _this.controllers.detailsView = new DetailsController({
                autoresize: MapSVG.isPhone && _this.options.detailsView.mobileFullscreen && _this.options.detailsView.location !== 'custom' ? false : _this.options.detailsView.autoresize,
                container: _this.containers.detailsView,
                template: obj instanceof Region ? _this.templates.detailsViewRegion : _this.templates.detailsView,
                mapsvg: _this,
                data: obj.getData(this.regionsRepository.schema.name),
                modal: (MapSVG.isPhone && _this.options.detailsView.mobileFullscreen && _this.options.detailsView.location !== 'custom'),
                scrollable: (MapSVG.isPhone && _this.options.detailsView.mobileFullscreen && _this.options.detailsView.location !== 'custom') || _this.shouldBeScrollable(_this.options.detailsView.location),
                withToolbar: !(MapSVG.isPhone && _this.options.detailsView.mobileFullscreen && _this.options.detailsView.location !== 'custom') && _this.shouldBeScrollable(_this.options.detailsView.location),
                events: {
                    'shown'(mapsvg) {
                        _this.events.trigger('shown.detailsView');
                    },
                    'closed'(mapsvg) {
                        _this.deselectAllRegions();
                        _this.deselectAllMarkers();
                        _this.controllers && _this.controllers.directory && _this.controllers.directory.deselectItems();
                        _this.events.trigger('closed.detailsView');
                    }
                }
            });
            _this.controllers.detailsView._init();
        }
        loadFiltersModal() {
            var _this = this;
            if (_this.options.filters.modalLocation != 'custom') {
                if (!_this.containers.filtersModal) {
                    _this.containers.filtersModal = $$x('<div class="mapsvg-details-container mapsvg-filters-wrap"></div>')[0];
                }
                _this.setColors();
                $$x(_this.containers.filtersModal).css({ width: _this.options.filters.width });
                if (MapSVG.isPhone) {
                    $$x('body').append($$x(_this.containers.filtersModal));
                    $$x(_this.containers.filtersModal).css({ width: '' });
                }
                else {
                    $$x(_this.containers[_this.options.filters.modalLocation]).append($$x(_this.containers.filtersModal));
                }
            }
            else {
                _this.containers.filtersModal = $$x('#' + _this.options.filters.containerId)[0];
                $$x(_this.containers.filtersModal).css({ width: '' });
            }
            _this.loadFiltersController(_this.containers.filtersModal, true);
        }
        loadFiltersController(container, modal = false) {
            var _this = this;
            if (_this.filtersSchema.getFields().length === 0) {
                return;
            }
            let filtersInDirectory, filtersHide;
            if (MapSVG.isPhone) {
                filtersInDirectory = true;
                filtersHide = _this.options.filters.hideOnMobile;
            }
            else {
                filtersInDirectory = (_this.options.menu.on && _this.controllers.directory && _this.options.menu.location === _this.options.filters.location);
                filtersHide = _this.options.filters.hide;
            }
            var scrollable = modal || (!filtersInDirectory && (['leftSidebar', 'rightSidebar'].indexOf(_this.options.filters.location) !== -1));
            this.filtersRepository = _this.options.filters.source === 'regions' ? _this.regionsRepository : _this.objectsRepository;
            this.controllers.filters = new FiltersController({
                container: container,
                query: this.filtersRepository.query,
                mapsvg: _this,
                schema: _this.filtersSchema,
                template: Handlebars.compile('<div class="mapsvg-filters-container"></div>'),
                scrollable: scrollable,
                modal: modal,
                withToolbar: MapSVG.isPhone ? false : modal,
                width: $$x(container).hasClass('mapsvg-map-container') ? _this.options.filters.width : '100%',
                showButtonText: _this.options.filters.showButtonText,
                clearButton: _this.options.filters.clearButton,
                clearButtonText: _this.options.filters.clearButtonText,
                events: {
                    'cleared.fields': () => {
                        _this.deselectAllRegions();
                    },
                    'changed.fields': () => {
                        _this.throttle(_this.filtersRepository.reload, 400, _this);
                    },
                    'shown': function (mapsvg) {
                    },
                    'closed': function (mapsvg) {
                    },
                    'loaded': () => {
                        _this.controllers.directory && _this.controllers.directory.updateTopShift();
                    },
                    'click.btn.showFilters': () => {
                        _this.loadFiltersModal();
                    }
                }
            });
            this.controllers.filters._init();
        }
        textSearch(text, fallback = false) {
            var query = new Query({
                filters: { "search": text },
                searchFallback: fallback
            });
            this.filtersRepository.find(query);
        }
        getRegion(id) {
            return this.regions.findById(id);
        }
        getRegions() {
            return this.regions;
        }
        getMarker(id) {
            return this.markers.findById(id);
        }
        checkId(id) {
            var _this = this;
            if (_this.getRegion(id))
                return { error: "This ID is already being used by a Region" };
            else if (_this.getMarker(id))
                return { error: "This ID is already being used by another Marker" };
            else
                return true;
        }
        regionsRedrawColors() {
            var _this = this;
            _this.regions.forEach(function (region) {
                region.setFill();
            });
        }
        destroy() {
            var _this = this;
            if (_this.controllers && _this.controllers.directory) {
                _this.controllers.directory.mobileButtons.remove();
            }
            $$x(_this.containers.map).empty().insertBefore($$x(_this.containers.wrapAll)).attr('style', '').removeClass('mapsvg mapsvg-responsive');
            _this.controllers.popover && _this.controllers.popover.close();
            if (_this.controllers.detailsView)
                _this.controllers.detailsView.destroy();
            $$x(_this.containers.wrapAll).remove();
            return _this;
        }
        getData() {
            return {
                id: this.id,
                title: this.options.title,
                options: this.getOptions(false, false)
            };
        }
        mayBeFitMarkers() {
            var _this = this;
            if (!this.lastTimeFitWas) {
                this.lastTimeFitWas = Date.now() - 99999;
            }
            this.fitDelta = Date.now() - this.lastTimeFitWas;
            if (this.fitDelta > 1000 && !_this.firstDataLoad && !_this.fitOnDataLoadDone && _this.options.fitMarkers) {
                _this.fitMarkers();
                _this.fitOnDataLoadDone = true;
            }
            if (_this.firstDataLoad && _this.options.fitMarkersOnStart) {
                _this.firstDataLoad = false;
                if (_this.options.googleMaps.on && !_this.googleMaps.map) {
                    _this.events.on('googleMapsLoaded', function () {
                        _this.fitMarkers();
                    });
                }
                else {
                    _this.fitMarkers();
                }
            }
            this.lastTimeFitWas = Date.now();
        }
        fitMarkers() {
            var _this = this;
            var dbObjects = _this.objectsRepository.getLoaded();
            if (!dbObjects || dbObjects.length === 0) {
                return;
            }
            if (_this.options.googleMaps.on && typeof google !== "undefined") {
                var lats = [];
                var lngs = [];
                if (dbObjects.length > 1) {
                    dbObjects.forEach(function (object) {
                        if (object.location && object.location.geoPoint) {
                            lats.push(object.location.geoPoint.lat);
                            lngs.push(object.location.geoPoint.lng);
                        }
                    });
                    var minlat = Math.min.apply(null, lats), maxlat = Math.max.apply(null, lats);
                    var minlng = Math.min.apply(null, lngs), maxlng = Math.max.apply(null, lngs);
                    var bbox = new google.maps.LatLngBounds({ lat: minlat, lng: minlng }, { lat: maxlat, lng: maxlng });
                    _this.googleMaps.map.fitBounds(bbox, 0);
                }
                else {
                    if (dbObjects[0].location && dbObjects[0].location.lat && dbObjects[0].location.lng) {
                        var coords = { lat: dbObjects[0].location.lat, lng: dbObjects[0].location.lng };
                        if (_this.googleMaps.map) {
                            _this.googleMaps.map.setCenter(coords);
                            var max = _this.googleMaps.zoomLimit ? 17 : 20;
                            _this.googleMaps.map.setZoom(max);
                        }
                    }
                }
            }
            else {
                if (_this.options.clustering.on) {
                    let arr = [];
                    _this.markersClusters.forEach(function (c) {
                        arr.push(c);
                    });
                    _this.markers.forEach(function (m) {
                        arr.push(m);
                    });
                    return _this.zoomTo(arr);
                }
                else {
                    return _this.zoomTo(_this.markers);
                }
            }
        }
        showUserLocation(callback) {
            var _this = this;
            this.getUserLocation(function (geoPoint) {
                _this.userLocation = null;
                _this.userLocation = new Location({
                    geoPoint: geoPoint,
                    img: MapSVG.urls.root + '/markers/user-location.svg'
                });
                _this.userLocationMarker && _this.userLocationMarker.delete();
                _this.userLocationMarker = new Marker({
                    location: _this.userLocation,
                    mapsvg: _this,
                    width: 15,
                    height: 15
                });
                $$x(_this.userLocationMarker.element).addClass('mapsvg-user-location');
                _this.userLocationMarker.centered = true;
                $$x(_this.containers.scrollpane).append(_this.userLocationMarker.element);
                _this.userLocationMarker.adjustPosition();
                callback && callback(_this.userLocation);
            });
        }
        getUserLocation(callback) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var pos = new GeoPoint(position.coords.latitude, position.coords.longitude);
                    callback && callback(pos);
                });
            }
            else {
                return false;
            }
        }
        getScale() {
            var _this = this;
            var scale2 = $$x(_this.containers.map).width() / _this.viewBox.width;
            return scale2 || 1;
        }
        updateSize() {
            var _this = this;
            _this.scale = _this.getScale();
            _this.controllers.popover && _this.controllers.popover.adjustPosition();
            _this.markersAdjustPosition();
            if (_this.options.labelsRegions.on) {
                _this.labelsRegionsAdjustPosition();
            }
            _this.mapAdjustStrokes();
        }
        getViewBox() {
            return this.viewBox;
        }
        viewBoxSetBySize(width, height) {
            var _this = this;
            width = parseFloat(width);
            height = parseFloat(height);
            _this.setSize(width, height);
            _this._viewBox = _this.viewBoxGetBySize(width, height);
            _this.setViewBox(_this._viewBox);
            $$x(window).trigger('resize');
            _this.setSize(width, height);
            _this.setZoomLevels();
            return _this.viewBox;
        }
        viewBoxGetBySize(width, height) {
            var _this = this;
            var new_ratio = width / height;
            var old_ratio = _this.svgDefault.viewBox.width / _this.svgDefault.viewBox.height;
            var vb = $$x.extend([], _this.svgDefault.viewBox);
            if (new_ratio != old_ratio) {
                if (new_ratio > old_ratio) {
                    vb[2] = _this.svgDefault.viewBox.height * new_ratio;
                    vb[0] = _this.svgDefault.viewBox.x - ((vb[2] - _this.svgDefault.viewBox.width) / 2);
                }
                else {
                    vb[3] = _this.svgDefault.viewBox.width / new_ratio;
                    vb[1] = _this.svgDefault.viewBox.y - ((vb[3] - _this.svgDefault.viewBox.height) / 2);
                }
            }
            return vb;
        }
        viewBoxReset(toInitial) {
            var _this = this;
            if (_this.options.googleMaps.on && _this.googleMaps.map) {
                if (!toInitial) {
                    _this.options.googleMaps.center = null;
                    _this.options.googleMaps.zoom = null;
                }
                if (!_this.options.googleMaps.center || !_this.options.googleMaps.zoom) {
                    var southWest = new google.maps.LatLng(_this.geoViewBox.sw.lat, _this.geoViewBox.sw.lng);
                    var northEast = new google.maps.LatLng(_this.geoViewBox.ne.lat, _this.geoViewBox.ne.lng);
                    var bounds = new google.maps.LatLngBounds(southWest, northEast);
                    _this.googleMaps.map.fitBounds(bounds, 0);
                    _this.options.googleMaps.center = _this.googleMaps.map.getCenter().toJSON();
                    _this.options.googleMaps.zoom = _this.googleMaps.map.getZoom();
                }
                else {
                    _this.googleMaps.map.setZoom(_this.options.googleMaps.zoom);
                    _this.googleMaps.map.setCenter(_this.options.googleMaps.center);
                }
            }
            else {
                if (toInitial) {
                    var v = _this._viewBox || _this.svgDefault.viewBox;
                    _this.zoomLevel = 0;
                    _this._scale = 1;
                    _this.setViewBox(v);
                }
                else {
                    _this.setViewBox();
                }
            }
            return this.viewBox;
        }
        getGeoViewBox() {
            var _this = this;
            var v = _this.viewBox;
            var p1 = new SVGPoint(v.x, v.y);
            var p2 = new SVGPoint(v.x + v.width, v.y);
            var p3 = new SVGPoint(v.x, v.y);
            var p4 = new SVGPoint(v.x, v.y + v.height);
            var leftLon = _this.convertSVGToGeo(p1).lng;
            var rightLon = _this.convertSVGToGeo(p2).lng;
            var topLat = _this.convertSVGToGeo(p3).lat;
            var bottomLat = _this.convertSVGToGeo(p4).lat;
            return [leftLon, topLat, rightLon, bottomLat];
        }
        mapAdjustStrokes() {
            var _this = this;
            this.regions.forEach(region => region.adjustStroke(_this.scale));
        }
        zoomIn(center) {
            var _this = this;
            if (_this.googleMaps.map) {
                if (!_this.isZooming) {
                    var currentZoomInRange = _this.zoomLevel >= _this.options.zoom.limit[0] && _this.zoomLevel <= _this.options.zoom.limit[1];
                    var zoom = _this.googleMaps.map.getZoom();
                    var max = _this.googleMaps.zoomLimit ? 17 : 20;
                    var google_zoom_new = (zoom + 1) > max ? max : zoom + 1;
                    var svg_zoom_new = google_zoom_new - _this.zoomDelta;
                    var newZoomInInRange = svg_zoom_new >= _this.options.zoom.limit[0] && svg_zoom_new <= _this.options.zoom.limit[1];
                    if (currentZoomInRange && !newZoomInInRange) {
                        return false;
                    }
                    _this.isZooming = true;
                    _this.googleMaps.map.setZoom(google_zoom_new);
                    if (center) {
                        var centerGeo = _this.convertSVGToGeo(center);
                        _this.googleMaps.map.setCenter(centerGeo);
                    }
                    _this.zoomLevel = svg_zoom_new;
                }
            }
            else if (_this.canZoom) {
                _this.canZoom = false;
                setTimeout(function () {
                    _this.canZoom = true;
                }, 700);
                _this.zoom(1, center);
            }
        }
        zoomOut(center) {
            var _this = this;
            if (_this.googleMaps.map) {
                if (!_this.isZooming && _this.googleMaps.map.getZoom() - 1 >= _this.options.googleMaps.minZoom) {
                    var currentZoomInRange = _this.zoomLevel >= _this.options.zoom.limit[0] && _this.zoomLevel <= _this.options.zoom.limit[1];
                    var zoom = _this.googleMaps.map.getZoom();
                    var google_zoom_new = (zoom - 1) < 1 ? 1 : (zoom - 1);
                    var svg_zoom_new = google_zoom_new - _this.zoomDelta;
                    var newZoomInInRange = svg_zoom_new >= _this.options.zoom.limit[0] && svg_zoom_new <= _this.options.zoom.limit[1];
                    if (currentZoomInRange && !newZoomInInRange) {
                        return false;
                    }
                    _this.isZooming = true;
                    _this.googleMaps.map.setZoom(google_zoom_new);
                    _this.zoomLevel = svg_zoom_new;
                }
            }
            else if (_this.canZoom) {
                _this.canZoom = false;
                setTimeout(function () {
                    _this.canZoom = true;
                }, 700);
                _this.zoom(-1, center);
            }
        }
        touchZoomMove() {
        }
        touchZoomEnd() {
        }
        zoomTo(mapObjects, zoomToLevel) {
            var _this = this;
            if (typeof mapObjects == 'string') {
                mapObjects = _this.getRegion(mapObjects);
            }
            if (_this.googleMaps.map) {
                if (mapObjects instanceof Marker) {
                    var geoPoint = _this.convertSVGToGeo(mapObjects.svgPoint);
                    _this.googleMaps.map.setZoom(zoomToLevel || 1);
                    _this.googleMaps.map.setCenter({ lat: geoPoint.lat, lng: geoPoint.lng });
                    this.zoomLevel = this.googleMaps.map.getZoom() - this.zoomDelta;
                }
                else {
                    if (mapObjects && mapObjects.length !== undefined) {
                        var rbounds = mapObjects[0].getGeoBounds();
                        var southWest = new google.maps.LatLng(rbounds.sw.lat, rbounds.sw.lng);
                        var northEast = new google.maps.LatLng(rbounds.ne.lat, rbounds.ne.lng);
                        var bounds = new google.maps.LatLngBounds(southWest, northEast);
                        for (var i = 1; i < mapObjects.length - 1; i++) {
                            var rbounds2 = mapObjects[i].getGeoBounds();
                            var southWest2 = new google.maps.LatLng(rbounds2.sw.lat, rbounds2.sw.lng);
                            var northEast2 = new google.maps.LatLng(rbounds2.ne.lat, rbounds2.ne.lng);
                            bounds.extend(southWest2);
                            bounds.extend(northEast2);
                        }
                    }
                    else {
                        var objectBounds = mapObjects.getGeoBounds();
                        var southWest = new google.maps.LatLng(objectBounds.sw.lat, objectBounds.sw.lng);
                        var northEast = new google.maps.LatLng(objectBounds.ne.lat, objectBounds.ne.lng);
                        var bounds = new google.maps.LatLngBounds(southWest, northEast);
                    }
                    _this.googleMaps.map.fitBounds(bounds, 0);
                    if (_this.googleMaps.zoomLimit && (_this.googleMaps.map.getZoom() > 17)) {
                        _this.googleMaps.map.setZoom(17);
                    }
                    this.zoomLevel = this.googleMaps.map.getZoom() - this.zoomDelta;
                }
                return;
            }
            let bbox, viewBoxPrev;
            if (mapObjects instanceof Marker || mapObjects instanceof MarkerCluster) {
                return _this.zoomToMarkerOrCluster(mapObjects, zoomToLevel);
            }
            if (typeof mapObjects == 'object' && mapObjects.length !== undefined) {
                var _bbox;
                if (mapObjects[0] instanceof Region) {
                    bbox = mapObjects[0].getBBox();
                    var xmin = [bbox.x];
                    var ymin = [bbox.y];
                    var w = (bbox.x + bbox.width);
                    var xmax = [w];
                    var h = (bbox.y + bbox.height);
                    var ymax = [h];
                    if (mapObjects.length > 1) {
                        for (var i = 1; i < mapObjects.length; i++) {
                            _bbox = mapObjects[i].getBBox();
                            xmin.push(_bbox.x);
                            ymin.push(_bbox.y);
                            var _w = _bbox.x + _bbox.width;
                            var _h = _bbox.y + _bbox.height;
                            xmax.push(_w);
                            ymax.push(_h);
                        }
                    }
                    var _xmin = Math.min.apply(Math, xmin);
                    var _ymin = Math.min.apply(Math, ymin);
                    var w = Math.max.apply(Math, _xmax) - _xmin;
                    var h = Math.max.apply(Math, _ymax) - _ymin;
                    bbox = new ViewBox(_xmin, _ymin, w, h);
                }
                else if (mapObjects[0] instanceof Marker || mapObjects[0] instanceof MarkerCluster) {
                    var xs = [];
                    var ys = [];
                    if (mapObjects.length === 1) {
                        return _this.zoomToMarkerOrCluster(mapObjects[0]);
                    }
                    mapObjects.forEach(function (object) {
                        xs.push(object.x);
                        ys.push(object.y);
                    });
                    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs);
                    var miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
                    var padding = 10;
                    var point1 = new ScreenPoint(padding, 0);
                    var point2 = new ScreenPoint(0, 0);
                    padding = _this.convertPixelToSVG(point1).x - _this.convertPixelToSVG(point2).x;
                    var width = maxx - minx;
                    var height = maxy - miny;
                    bbox = new ViewBox(minx - padding, miny - padding, width + padding * 2, height + padding * 2);
                }
            }
            else {
                bbox = mapObjects.getBBox();
            }
            var searching = true;
            $$x.each(_this.zoomLevels, function (key, level) {
                if (searching && (viewBoxPrev && viewBoxPrev.x !== undefined)) {
                    if ((viewBoxPrev.width > bbox.width && viewBoxPrev.height > bbox.height)
                        &&
                            (bbox.width > level.viewBox.width || bbox.height > level.viewBox.height)) {
                        _this.zoomLevel = zoomToLevel ? zoomToLevel : parseInt(key + '') - 1;
                        var vb = _this.zoomLevels[_this.zoomLevel].viewBox;
                        var newVb = new ViewBox(bbox.x - vb.width / 2 + bbox.width / 2, bbox.y - vb.height / 2 + bbox.height / 2, vb.width, vb.height);
                        _this.setViewBox();
                        _this._scale = _this.zoomLevels[_this.zoomLevel]._scale;
                        searching = false;
                    }
                }
                viewBoxPrev = level && level.viewBox;
            });
        }
        zoomToMarkerOrCluster(mapObject, zoomToLevel) {
            var _this = this;
            _this.zoomLevel = zoomToLevel || 1;
            var vb = _this.zoomLevels[_this.zoomLevel].viewBox;
            var newViewBox = new ViewBox(mapObject.x - vb.width / 2, mapObject.y - vb.height / 2, vb.width, vb.height);
            _this.setViewBox(newViewBox);
            _this._scale = _this.zoomLevels[_this.zoomLevel]._scale;
            return;
        }
        centerOn(region, yShift) {
            var _this = this;
            if (_this.options.googleMaps.on) {
                yShift = yShift ? (yShift + 12) / _this.getScale() : 0;
                $$x(_this.containers.map).addClass('scrolling');
                var latLng = region.getCenterLatLng(yShift);
                _this.googleMaps.map.panTo(latLng);
                setTimeout(function () {
                    $$x(_this.containers.map).removeClass('scrolling');
                }, 100);
            }
            else {
                yShift = yShift ? (yShift + 12) / _this.getScale() : 0;
                var bbox = region.getBBox();
                var vb = _this.viewBox;
                var newViewBox = new ViewBox(bbox.x - vb.width / 2 + bbox.width / 2, bbox.y - vb.height / 2 + bbox.height / 2 - yShift, vb.width, vb.height);
                _this.setViewBox(newViewBox);
            }
        }
        zoom(delta, center, exact) {
            var _this = this;
            var vWidth = _this.viewBox.width;
            var vHeight = _this.viewBox.height;
            var newViewBox = new ViewBox(0, 0, 0, 0);
            var isInZoomRange = _this.zoomLevel >= _this.options.zoom.limit[0] && _this.zoomLevel <= _this.options.zoom.limit[1];
            if (!exact) {
                var d = delta > 0 ? 1 : -1;
                if (!_this.zoomLevels[_this.zoomLevel + d])
                    return;
                _this._zoomLevel = _this.zoomLevel;
                _this._zoomLevel += d;
                if (isInZoomRange && (_this._zoomLevel > _this.options.zoom.limit[1] || _this._zoomLevel < _this.options.zoom.limit[0]))
                    return false;
                _this.zoomLevel = _this._zoomLevel;
                var z = _this.zoomLevels[_this.zoomLevel];
                _this._scale = z._scale;
                newViewBox = z.viewBox;
            }
            else {
                newViewBox.width = _this._viewBox.width / exact;
                newViewBox.height = _this._viewBox.height / exact;
            }
            var shift = [];
            if (center) {
                var koef = d > 0 ? 0.5 : -1;
                shift = [((center.x - _this.viewBox.x) * koef), ((center.y - _this.viewBox.y) * koef)];
                newViewBox.x = _this.viewBox.x + shift[0];
                newViewBox.y = _this.viewBox.y + shift[1];
            }
            else {
                shift = [(vWidth - newViewBox.width) / 2, (vHeight - newViewBox.height) / 2];
                newViewBox.x = _this.viewBox.x + shift[0];
                newViewBox.y = _this.viewBox.y + shift[1];
            }
            if (_this.options.scroll.limit) {
                if (newViewBox.x < _this.svgDefault.viewBox.x)
                    newViewBox.x = _this.svgDefault.viewBox.x;
                else if (newViewBox.x + newViewBox.width > _this.svgDefault.viewBox.x + _this.svgDefault.viewBox.width)
                    newViewBox.x = _this.svgDefault.viewBox.x + _this.svgDefault.viewBox.width - newViewBox.width;
                if (newViewBox.y < _this.svgDefault.viewBox.y)
                    newViewBox.y = _this.svgDefault.viewBox.y;
                else if (newViewBox.y + newViewBox.height > _this.svgDefault.viewBox.y + _this.svgDefault.viewBox.height)
                    newViewBox.y = _this.svgDefault.viewBox.y + _this.svgDefault.viewBox.height - newViewBox.height;
            }
            _this.setViewBox(newViewBox);
        }
        markerDelete(marker) {
            var _this = this;
            if (_this.editingMarker && _this.editingMarker.id == marker.id) {
                _this.editingMarker = null;
                delete _this.editingMarker;
            }
            if (this.markers.findById(marker.id)) {
                this.markers.findById(marker.id).element.remove();
                this.markers.delete(marker.id);
                marker = null;
            }
            if (_this.markers.length === 0)
                _this.options.markerLastID = 0;
        }
        markersClusterAdd(markersCluster) {
            var _this = this;
            _this.layers.markers.append(markersCluster.node);
            _this.markersClusters.push(markersCluster);
            markersCluster.adjustPosition();
        }
        markerAdd(marker) {
            var _this = this;
            $$x(marker.element).hide();
            marker.adjustPosition();
            _this.layers.markers.append(marker.element);
            _this.markers.push(marker);
            marker.mapped = true;
            setTimeout(function () {
                $$x(marker.element).show();
            }, 100);
        }
        markerRemove(marker) {
            var _this = this;
            if (_this.editingMarker && _this.editingMarker.id == marker.id) {
                _this.editingMarker = null;
                delete _this.editingMarker;
            }
            if (this.markers.findById(marker.id)) {
                this.markers.findById(marker.id).element.remove();
                this.markers.delete(marker.id);
                marker = null;
            }
            if (_this.markers.length === 0)
                _this.options.markerLastID = 0;
        }
        markerId() {
            var _this = this;
            _this.options.markerLastID = _this.options.markerLastID + 1;
            var id = 'marker_' + (_this.options.markerLastID);
            if (_this.getMarker(id))
                return _this.markerId();
            else
                return id;
        }
        labelsRegionsAdjustPosition() {
            var _this = this;
            if (!$$x(_this.containers.map).is(":visible")) {
                return;
            }
            _this.regions.forEach(function (region) {
                if (!region.center) {
                    region.center = region.getCenterSVG();
                }
                var pos = _this.convertSVGToPixel(region.center);
                if (region.textLabel)
                    region.textLabel.style.transform = 'translate(-50%,-50%) translate(' + pos.x + 'px,' + pos.y + 'px)';
            });
        }
        markersAdjustPosition() {
            var _this = this;
            _this.markers.forEach(function (marker) {
                marker.adjustPosition();
            });
            _this.markersClusters.forEach(function (cluster) {
                cluster.adjustPosition();
            });
            if (_this.userLocationMarker) {
                _this.userLocationMarker.adjustPosition();
            }
        }
        markerMoveStart() {
        }
        markerMove(dx, dy) {
        }
        markerMoveEnd() {
        }
        setEditingMarker(marker) {
            var _this = this;
            _this.editingMarker = marker;
            if (!_this.editingMarker.mapped) {
                _this.editingMarker.needToRemove = true;
                _this.markerAdd(_this.editingMarker);
            }
        }
        unsetEditingMarker() {
            var _this = this;
            if (_this.editingMarker && _this.editingMarker.needToRemove) {
                _this.markerRemove(_this.editingMarker);
            }
            _this.editingMarker = null;
        }
        getEditingMarker() {
            var _this = this;
            return _this.editingMarker;
        }
        scrollStart(e, mapsvg) {
            var _this = this;
            if ($$x(e.target).hasClass('mapsvg-btn-map') || $$x(e.target).closest('.mapsvg-gauge').length)
                return false;
            if (_this.editMarkers.on && $$x(e.target).hasClass('mapsvg-marker'))
                return false;
            e.preventDefault();
            var ce = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0] ? e.originalEvent.touches[0] : e;
            _this.scrollStarted = true;
            this.scroll = {
                tx: _this.scroll.tx || 0,
                ty: _this.scroll.ty || 0,
                vxi: _this.viewBox.x,
                vyi: _this.viewBox.y,
                x: ce.clientX,
                y: ce.clientY,
                dx: 0,
                dy: 0,
                vx: 0,
                vy: 0,
                gx: ce.clientX,
                gy: ce.clientY,
                touchScrollStart: 0
            };
            if (e.type.indexOf('mouse') === 0) {
                $$x(document).on('mousemove.scroll.mapsvg', function (e) {
                    _this.scrollMove(e);
                });
                if (_this.options.scroll.spacebar) {
                    $$x(document).on('keyup.scroll.mapsvg', function (e) {
                        if (e.keyCode == 32) {
                            _this.scrollEnd(e, mapsvg);
                        }
                    });
                }
                else {
                    $$x(document).on('mouseup.scroll.mapsvg', function (e) {
                        _this.scrollEnd(e, mapsvg);
                    });
                }
            }
        }
        scrollMove(e) {
            var _this = this;
            e.preventDefault();
            if (!_this.isScrolling) {
                _this.isScrolling = true;
                $$x(_this.containers.map).addClass('scrolling');
            }
            var ce = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0] ? e.originalEvent.touches[0] : e;
            var scrolled = _this.panBy((_this.scroll.gx - ce.clientX), (_this.scroll.gy - ce.clientY));
            if (_this.googleMaps.map && (scrolled.x || scrolled.y)) {
                var point = _this.googleMaps.map.getCenter();
                var projection = _this.googleMaps.overlay.getProjection();
                var pixelpoint = projection.fromLatLngToDivPixel(point);
                pixelpoint.x += scrolled.x ? _this.scroll.gx - ce.clientX : 0;
                pixelpoint.y += scrolled.y ? _this.scroll.gy - ce.clientY : 0;
                point = projection.fromDivPixelToLatLng(pixelpoint);
                _this.googleMaps.map.setCenter(point);
            }
            _this.scroll.gx = ce.clientX;
            _this.scroll.gy = ce.clientY;
            _this.scroll.dx = (_this.scroll.x - ce.clientX);
            _this.scroll.dy = (_this.scroll.y - ce.clientY);
            var vx = _this.scroll.vxi + _this.scroll.dx / _this.scale;
            var vy = _this.scroll.vyi + _this.scroll.dy / _this.scale;
            if (_this.options.scroll.limit) {
                if (vx < _this.svgDefault.viewBox.x)
                    vx = _this.svgDefault.viewBox.x;
                else if (_this.viewBox.width + vx > _this.svgDefault.viewBox.x + _this.svgDefault.viewBox.width)
                    vx = (_this.svgDefault.viewBox.x + _this.svgDefault.viewBox.width - _this.viewBox.width);
                if (vy < _this.svgDefault.viewBox.y)
                    vy = _this.svgDefault.viewBox.y;
                else if (_this.viewBox.height + vy > _this.svgDefault.viewBox.y + _this.svgDefault.viewBox.height)
                    vy = (_this.svgDefault.viewBox.y + _this.svgDefault.viewBox.height - _this.viewBox.height);
            }
            _this.scroll.vx = vx;
            _this.scroll.vy = vy;
        }
        scrollEnd(e, mapsvg, noClick) {
            var _this = this;
            setTimeout(function () {
                _this.scrollStarted = false;
                _this.isScrolling = false;
            }, 100);
            _this.googleMaps && _this.googleMaps.overlay && _this.googleMaps.overlay.draw();
            $$x(_this.containers.map).removeClass('scrolling');
            $$x(document).off('keyup.scroll.mapsvg');
            $$x(document).off('mousemove.scroll.mapsvg');
            $$x(document).off('mouseup.scroll.mapsvg');
            if (noClick !== true && Math.abs(_this.scroll.dx) < 5 && Math.abs(_this.scroll.dy) < 5) {
                if (_this.editMarkers.on)
                    _this.clickAddsMarker && _this.markerAddClickHandler(e);
                else if (_this.region_clicked)
                    _this.regionClickHandler(e, _this.region_clicked);
            }
            _this.viewBox.x = _this.scroll.vx || _this.viewBox.x;
            _this.viewBox.y = _this.scroll.vy || _this.viewBox.y;
        }
        panBy(x, y) {
            var _this = this;
            var tx = _this.scroll.tx - x;
            var ty = _this.scroll.ty - y;
            var scrolled = { x: true, y: true };
            if (_this.options.scroll.limit) {
                var svg = $$x(_this.containers.svg)[0].getBoundingClientRect();
                var bounds = $$x(_this.containers.map)[0].getBoundingClientRect();
                if ((svg.left - x > bounds.left && x < 0) || (svg.right - x < bounds.right && x > 0)) {
                    tx = _this.scroll.tx;
                    scrolled.x = false;
                }
                if ((svg.top - y > bounds.top && y < 0) || (svg.bottom - y < bounds.bottom && y > 0)) {
                    ty = _this.scroll.ty;
                    scrolled.y = false;
                }
            }
            $$x(_this.containers.scrollpane).css({
                'transform': 'translate(' + tx + 'px,' + ty + 'px)'
            });
            _this.scroll.tx = tx;
            _this.scroll.ty = ty;
            return scrolled;
        }
        scrollRegionClickHandler(e, region) {
            this.region_clicked = region;
        }
        touchStart(_e, mapsvg) {
            var _this = this;
            _e.preventDefault();
            if (_this.scrollStarted) {
                _this.scrollEnd(_e, mapsvg, true);
            }
            var e = _e.originalEvent;
            if (_this.options.zoom.fingers && e.touches && e.touches.length == 2) {
                _this.touchZoomStart = true;
                _this.scaleDistStart = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            }
            else if (e.touches && e.touches.length == 1) {
                _this.scrollStart(_e, mapsvg);
            }
            $$x(document).on('touchmove.scroll.mapsvg', function (e) {
                e.preventDefault();
                _this.touchMove(e, _this);
            }).on('touchend.scroll.mapsvg', function (e) {
                e.preventDefault();
                _this.touchEnd(e, _this);
            });
        }
        ;
        touchMove(_e, mapsvg) {
            var _this = this;
            _e.preventDefault();
            var e = _e.originalEvent;
            if (_this.options.zoom.fingers && e.touches && e.touches.length == 2) {
                if (!MapSVG.ios) {
                    e.scale = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY) / _this.scaleDistStart;
                }
                if (e.scale != 1 && _this.canZoom) {
                    var d = e.scale > 1 ? 1 : -1;
                    var cx = e.touches[0].pageX >= e.touches[1].pageX ? e.touches[0].pageX - (e.touches[0].pageX - e.touches[1].pageX) / 2 - $$x(_this.containers.svg).offset().left : e.touches[1].pageX - (e.touches[1].pageX - e.touches[0].pageX) / 2 - $$x(_this.containers.svg).offset().left;
                    var cy = e.touches[0].pageY >= e.touches[1].pageY ? e.touches[0].pageY - (e.touches[0].pageY - e.touches[1].pageY) - $$x(_this.containers.svg).offset().top : e.touches[1].pageY - (e.touches[1].pageY - e.touches[0].pageY) - $$x(_this.containers.svg).offset().top;
                    var center = _this.convertPixelToSVG(new ScreenPoint(cx, cy));
                    if (d > 0)
                        _this.zoomIn(center);
                    else
                        _this.zoomOut(center);
                }
            }
            else if (e.touches && e.touches.length == 1) {
                _this.scrollMove(_e);
            }
        }
        ;
        touchEnd(_e, mapsvg) {
            var _this = this;
            _e.preventDefault();
            var e = _e.originalEvent;
            if (_this.touchZoomStart) {
                _this.touchZoomStart = false;
            }
            else if (_this.scrollStarted) {
                _this.scrollEnd(_e, mapsvg);
            }
            $$x(document).off('touchmove.scroll.mapsvg');
            $$x(document).off('touchend.scroll.mapsvg');
        }
        ;
        getSelected() {
            return this.selected_id;
        }
        ;
        selectRegion(id, skipDirectorySelection) {
            var _this = this;
            let region;
            if (typeof id == "string") {
                region = _this.getRegion(id);
            }
            else {
                region = id;
            }
            if (!region)
                return false;
            var ids;
            if (_this.options.multiSelect && !_this.editRegions.on) {
                if (region.selected) {
                    _this.deselectRegion(region);
                    if (!skipDirectorySelection && _this.options.menu.on) {
                        if (_this.options.menu.source == 'database') {
                            if (region.objects && region.objects.length) {
                                var ids = region.objects.map(function (obj) {
                                    return obj.id.toString();
                                });
                            }
                        }
                        else {
                            var ids = [region.id];
                        }
                        _this.controllers.directory.deselectItems();
                    }
                    return;
                }
            }
            else if (_this.selected_id.length > 0) {
                _this.deselectAllRegions();
                if (!skipDirectorySelection && _this.options.menu.on) {
                    if (_this.options.menu.source == 'database') {
                        if (region.objects && region.objects.length) {
                            var ids = region.objects.map(function (obj) {
                                return obj.id.toString();
                            });
                        }
                    }
                    else {
                        var ids = [region.id];
                    }
                    _this.controllers.directory.deselectItems();
                }
            }
            _this.selected_id.push(region.id);
            region.select();
            var skip = _this.options.actions.region.click.filterDirectory;
            if (!skip && !skipDirectorySelection && _this.options.menu.on && _this.controllers && _this.controllers.directory) {
                if (_this.options.menu.source == 'database') {
                    if (region.objects && region.objects.length) {
                        var ids = region.objects.map(function (obj) {
                            return obj.id.toString();
                        });
                    }
                    else {
                        var ids = [region.id];
                    }
                }
                else {
                    var ids = [region.id];
                }
                _this.controllers.directory.selectItems(ids);
            }
            if (_this.options.actions.region.click.addIdToUrl && !_this.options.actions.region.click.showAnotherMap) {
                window.location.hash = "/m/" + region.id;
            }
        }
        deselectAllRegions() {
            var _this = this;
            $$x.each(_this.selected_id, function (index, id) {
                _this.deselectRegion(_this.getRegion(id));
            });
        }
        deselectRegion(region) {
            var _this = this;
            if (!region)
                region = _this.getRegion(_this.selected_id[0]);
            if (region) {
                region.deselect();
                var i = $$x.inArray(region.id, _this.selected_id);
                _this.selected_id.splice(i, 1);
            }
            if (_this.options.actions.region.click.addIdToUrl) {
                if (window.location.hash.indexOf(region.id) !== -1) {
                    history.replaceState(null, null, ' ');
                }
            }
        }
        highlightRegions(regions) {
            var _this = this;
            regions.forEach(function (region) {
                if (region && !region.selected && !region.disabled) {
                    _this.highlightedRegions.push(region);
                    region.highlight();
                }
            });
        }
        unhighlightRegions() {
            var _this = this;
            _this.highlightedRegions.forEach(function (region) {
                if (region && !region.selected && !region.disabled)
                    region.unhighlight();
            });
            _this.highlightedRegions = [];
        }
        selectMarker(marker) {
            var _this = this;
            if (!(marker instanceof Marker))
                return false;
            _this.deselectAllMarkers();
            marker.select();
            _this.selected_marker = marker;
            $$x(_this.layers.markers).addClass('mapsvg-with-marker-active');
            if (_this.options.menu.on && _this.options.menu.source == 'database') {
                _this.controllers.directory.deselectItems();
                _this.controllers.directory.selectItems(marker.object.id);
            }
        }
        deselectAllMarkers() {
            var _this = this;
            _this.selected_marker && _this.selected_marker.deselect();
            $$x(_this.layers.markers).removeClass('mapsvg-with-marker-active');
        }
        deselectMarker(marker) {
            if (marker) {
                marker.deselect();
            }
        }
        highlightMarker(marker) {
            var _this = this;
            $$x(_this.layers.markers).addClass('mapsvg-with-marker-hover');
            marker.highlight();
            _this.highlighted_marker = marker;
        }
        unhighlightMarker() {
            var _this = this;
            $$x(_this.layers.markers).removeClass('mapsvg-with-marker-hover');
            _this.highlighted_marker && _this.highlighted_marker.unhighlight();
        }
        convertMouseToSVG(e) {
            var _this = this;
            var mc = MapSVG.mouseCoords(e);
            var x = mc.x - $$x(_this.containers.svg).offset().left;
            var y = mc.y - $$x(_this.containers.svg).offset().top;
            var screenPoint = new ScreenPoint(x, y);
            return _this.convertPixelToSVG(screenPoint);
        }
        convertSVGToPixel(svgPoint) {
            var _this = this;
            var scale = _this.getScale();
            var shiftX = 0, shiftY = 0;
            if (_this.options.googleMaps.on) {
                if ((_this.viewBox.x - _this.svgDefault.viewBox.x) > _this.svgDefault.viewBox.width) {
                    var worldMapWidth = ((_this.svgDefault.viewBox.width / _this.mapLonDelta) * 360);
                    shiftX = worldMapWidth * Math.floor((_this.viewBox.x - _this.svgDefault.viewBox.x) / _this.svgDefault.viewBox.width);
                }
            }
            let screenPoint = new ScreenPoint((svgPoint.x - _this.svgDefault.viewBox.x + shiftX) * scale, (svgPoint.y - _this.svgDefault.viewBox.y + shiftY) * scale);
            return screenPoint;
        }
        convertPixelToSVG(screenPoint) {
            var _this = this;
            var scale = _this.getScale();
            return new SVGPoint(screenPoint.x / scale + _this.svgDefault.viewBox.x, screenPoint.y / scale + _this.svgDefault.viewBox.y);
        }
        convertGeoToSVG(coords) {
            var _this = this;
            var x = (coords.lng - _this.geoViewBox.sw.lng) * (_this.svgDefault.viewBox.width / _this.mapLonDelta);
            var lat = coords.lat * 3.14159 / 180;
            var worldMapWidth = ((_this.svgDefault.viewBox.width / _this.mapLonDelta) * 360) / (2 * 3.14159);
            var mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(_this.mapLatBottomDegree)) / (1 - Math.sin(_this.mapLatBottomDegree))));
            var y = _this.svgDefault.viewBox.height - ((worldMapWidth / 2 * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat)))) - mapOffsetY);
            x += _this.svgDefault.viewBox.x;
            y += _this.svgDefault.viewBox.y;
            return (new SVGPoint(x, y));
        }
        convertSVGToGeo(point) {
            var _this = this;
            let tx = point.x - _this.svgDefault.viewBox.x;
            let ty = point.y - _this.svgDefault.viewBox.y;
            var worldMapRadius = _this.svgDefault.viewBox.width / _this.mapLonDelta * 360 / (2 * Math.PI);
            var mapOffsetY = (worldMapRadius / 2 * Math.log((1 + Math.sin(_this.mapLatBottomDegree)) / (1 - Math.sin(_this.mapLatBottomDegree))));
            var equatorY = _this.svgDefault.viewBox.height + mapOffsetY;
            var a = (equatorY - ty) / worldMapRadius;
            var lat = 180 / Math.PI * (2 * Math.atan(Math.exp(a)) - Math.PI / 2);
            var lng = _this.geoViewBox.sw.lng + tx / _this.svgDefault.viewBox.width * _this.mapLonDelta;
            lat = parseFloat(lat.toFixed(6));
            lng = parseFloat(lng.toFixed(6));
            return (new GeoPoint(lat, lng));
        }
        pickGaugeColor(gaugeValue) {
            var _this = this;
            var w = (gaugeValue - _this.options.gauge.min) / _this.options.gauge.maxAdjusted;
            var rgba = {
                r: Math.round(_this.options.gauge.colors.diffRGB.r * w + _this.options.gauge.colors.lowRGB.r),
                g: Math.round(_this.options.gauge.colors.diffRGB.g * w + _this.options.gauge.colors.lowRGB.g),
                b: Math.round(_this.options.gauge.colors.diffRGB.b * w + _this.options.gauge.colors.lowRGB.b),
                a: Math.round(_this.options.gauge.colors.diffRGB.a * w + _this.options.gauge.colors.lowRGB.a)
            };
            return rgba;
        }
        isRegionDisabled(id, svgfill) {
            var _this = this;
            if (_this.options.regions[id] && (_this.options.regions[id].disabled || svgfill == 'none')) {
                return true;
            }
            else if ((_this.options.regions[id] == undefined || MapSVG.parseBoolean(_this.options.regions[id].disabled)) &&
                (_this.options.disableAll || svgfill == 'none' || id == 'labels' || id == 'Labels')) {
                return true;
            }
            else {
                return false;
            }
        }
        loadMap(id, container) {
            let mapsRepo = new MapsRepository();
            mapsRepo.findById(id).done((map) => {
                if ($$x(container).find('svg').length) {
                    container.mapSvg().destroy();
                }
                container.mapSvg(map.options);
            });
        }
        regionClickHandler(e, region) {
            var _this = this;
            _this.region_clicked = null;
            var actions = _this.options.actions;
            if (_this.eventsPreventList['click'])
                return;
            if (_this.editRegions.on) {
                _this.selectRegion(region.id);
                _this.regionEditHandler.call(region);
                return;
            }
            if (region instanceof MarkerCluster) {
                _this.zoomTo(region.markers);
                return;
            }
            if (region instanceof Region) {
                _this.selectRegion(region.id);
                if (actions.region.click.zoom) {
                    _this.zoomTo(region, actions.region.click.zoomToLevel);
                }
                if (actions.region.click.filterDirectory) {
                    let query = new Query({ filters: { regions: { table_name: this.regionsRepository.getSchema().name, region_ids: [region.id] } } });
                    _this.objectsRepository.find(query).done(function () {
                        if (_this.controllers.popover) {
                            _this.controllers.popover.redraw(region.forTemplate());
                        }
                        if (_this.controllers.detailsView) {
                            _this.controllers.detailsView.redraw(region.forTemplate());
                        }
                    });
                    _this.updateFiltersState();
                }
                if (actions.region.click.showDetails) {
                    _this.loadDetailsView(region);
                }
                if (actions.region.click.showPopover) {
                    if (actions.region.click.zoom) {
                        setTimeout(function () {
                            _this.showPopover(region);
                        }, 400);
                    }
                    else {
                        _this.showPopover(region);
                    }
                }
                else if (e && e.type.indexOf('touch') !== -1 && actions.region.touch.showPopover) {
                    if (actions.region.click.zoom) {
                        setTimeout(function () {
                            _this.showPopover(region);
                        }, 400);
                    }
                    else {
                        _this.showPopover(region);
                    }
                }
                if (actions.region.click.goToLink) {
                    var linkParts = actions.region.click.linkField.split('.');
                    var url;
                    if (linkParts.length > 1) {
                        var obj = linkParts.shift();
                        var attr = '.' + linkParts.join('.');
                        if (obj == 'Region') {
                            if (region.data) {
                                try {
                                    url = eval('region.data' + attr);
                                }
                                catch (err) {
                                    console.log("No such field as region.data" + attr);
                                }
                            }
                        }
                        else {
                            if (region.objects && region.objects[0]) {
                                try {
                                    url = eval('region.objects[0]' + attr);
                                }
                                catch (err) {
                                    console.log("No such field as region.objects[0]" + attr);
                                }
                            }
                        }
                        if (url && !_this.disableLinks) {
                            if (_this.editMode) {
                                alert('Redirect: ' + url + '\nLinks are disabled in the preview.');
                                return true;
                            }
                            if (actions.region.click.newTab) {
                                var win = window.open(url, '_blank');
                                win.focus();
                            }
                            else {
                                window.location.href = url;
                            }
                        }
                    }
                }
                if (actions.region.click.showAnotherMap) {
                    if (_this.editMode) {
                        alert('"Show another map" action is disabled in the preview');
                        return true;
                    }
                    var linkParts = actions.region.click.showAnotherMapField.split('.');
                    var url;
                    if (linkParts.length > 1) {
                        var obj = linkParts.shift();
                        var attr = '.' + linkParts.join('.');
                        var map_id;
                        if (obj == 'Region') {
                            if (region.data)
                                map_id = eval('region.data' + attr);
                        }
                        else {
                            if (region.objects && region.objects[0])
                                map_id = eval('region.objects[0]' + attr);
                        }
                        if (map_id) {
                            var container = actions.region.click.showAnotherMapContainerId ? $$x('#' + actions.region.click.showAnotherMapContainerId)[0] : $$x(_this.containers.map)[0];
                            _this.loadMap(map_id, container);
                        }
                    }
                }
                if (_this.events['click.region'])
                    try {
                        _this.events['click.region'].call(region, e, _this);
                    }
                    catch (err) {
                        console.log(err);
                    }
            }
            else if (region instanceof Marker) {
                _this.selectMarker(region);
                var passingObject = region.object;
                if (actions.marker.click.zoom) {
                    _this.zoomTo(region, actions.marker.click.zoomToLevel);
                }
                if (actions.marker.click.filterDirectory) {
                    let query = new Query({ filters: { id: region.object.id } });
                    _this.objectsRepository.find(query);
                    _this.updateFiltersState();
                }
                if (actions.marker.click.showDetails)
                    _this.loadDetailsView(passingObject);
                if (actions.marker.click.showPopover) {
                    if (actions.marker.click.zoom) {
                        setTimeout(function () {
                            _this.showPopover(passingObject);
                        }, 500);
                    }
                    else {
                        _this.showPopover(passingObject);
                    }
                }
                else if (e && e.type.indexOf('touch') !== -1 && actions.marker.touch.showPopover) {
                    if (actions.marker.click.zoom) {
                        setTimeout(function () {
                            _this.showPopover(passingObject);
                        }, 500);
                    }
                    else {
                        _this.showPopover(passingObject);
                    }
                }
                if (actions.marker.click.goToLink) {
                    var linkParts = actions.marker.click.linkField.split('.');
                    var url;
                    if (linkParts.length > 1) {
                        var obj = linkParts.shift();
                        var attr = '.' + linkParts.join('.');
                        try {
                            url = eval('passingObject' + attr);
                        }
                        catch (err) {
                            console.log("MapSVG: No such field as passingObject" + attr);
                        }
                        if (url && !_this.disableLinks)
                            if (_this.editMode) {
                                alert('Redirect: ' + url + '\nLinks are disabled in the preview.');
                                return true;
                            }
                        if (actions.marker.click.newTab) {
                            var win = window.open(url, '_blank');
                            win.focus();
                        }
                        else {
                            window.location.href = url;
                        }
                    }
                }
                if (_this.events['click.marker']) {
                    try {
                        _this.events['click.marker'].call(region, e, _this);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            }
        }
        fileExists(url) {
            if (url.substr(0, 4) == "data")
                return true;
            var http = new XMLHttpRequest();
            http.open('HEAD', url, false);
            http.send();
            return http.status != 404;
        }
        getStyle(elem, prop) {
            if (elem.currentStyle) {
                return elem.currentStyle.margin;
            }
            else if (window.getComputedStyle) {
                if (window.getComputedStyle.getPropertyValue) {
                    return window.getComputedStyle(elem, null).getPropertyValue(prop);
                }
                else {
                    return window.getComputedStyle(elem)[prop];
                }
            }
        }
        hideMarkersExceptOne(id) {
            var _this = this;
            var objects = _this.objectsRepository.getLoaded();
            objects.forEach(function (object) {
                if ((id != object.id) && object.location && object.location.marker) {
                    object.location.marker.hide();
                }
            });
            $$x(_this.containers.wrap).addClass('mapsvg-edit-marker-mode');
        }
        showMarkers() {
            var _this = this;
            _this.markers.forEach(function (m) {
                m.show();
            });
            $$x(_this.containers.wrap).removeClass('mapsvg-edit-marker-mode');
        }
        markerAddClickHandler(e) {
            var _this = this;
            if ($$x(e.target).hasClass('mapsvg-marker'))
                return false;
            var mc = MapSVG.mouseCoords(e);
            var x = mc.x - $$x(_this.containers.svg).offset().left;
            var y = mc.y - $$x(_this.containers.svg).offset().top;
            var screenPoint = new ScreenPoint(x, y);
            var svgPoint = _this.convertPixelToSVG(screenPoint);
            var geoPoint = _this.convertSVGToGeo(svgPoint);
            if (!$$x.isNumeric(x) || !$$x.isNumeric(y))
                return false;
            var location = new Location({
                svgPoint: svgPoint,
                geoPoint: geoPoint,
                img: _this.options.defaultMarkerImage
            });
            if (_this.editingMarker) {
                _this.editingMarker.setPoint(svgPoint);
                return;
            }
            var marker = new Marker({
                location: location,
                mapsvg: this
            });
            _this.markerAdd(marker);
            _this.markerEditHandler && _this.markerEditHandler.call(marker);
        }
        setDefaultMarkerImage(src) {
            var _this = this;
            _this.options.defaultMarkerImage = src;
        }
        setMarkerImagesDependency() {
            var _this = this;
            _this.locationField = _this.objectsRepository.schema.getFieldByType('location');
            if (_this.locationField.markersByFieldEnabled && _this.locationField.markerField && Object.values(_this.locationField.markersByField).length > 0) {
                this.setMarkersByField = true;
            }
            else {
                this.setMarkersByField = false;
            }
        }
        getMarkerImage(fieldValueOrObject, location) {
            var _this = this;
            var fieldValue;
            if (this.setMarkersByField) {
                if (typeof fieldValueOrObject === 'object') {
                    fieldValue = fieldValueOrObject[_this.locationField.markerField];
                }
                else {
                    fieldValue = fieldValueOrObject;
                }
                if (_this.locationField.markersByField[fieldValue]) {
                    return _this.locationField.markersByField[fieldValue];
                }
            }
            return (location && location.img) ? location.img : (this.options.defaultMarkerImage ? this.options.defaultMarkerImage : MapSVG.urls.root + 'markers/_pin_default.png');
        }
        setMarkersEditMode(on, clickAddsMarker) {
            var _this = this;
            _this.editMarkers.on = MapSVG.parseBoolean(on);
            _this.clickAddsMarker = _this.editMarkers.on;
            _this.setEventHandlers();
        }
        setRegionsEditMode(on) {
            var _this = this;
            _this.editRegions.on = MapSVG.parseBoolean(on);
            _this.deselectAllRegions();
            _this.setEventHandlers();
        }
        setEditMode(on) {
            var _this = this;
            _this.editMode = on;
        }
        setDataEditMode(on) {
            var _this = this;
            _this.editData.on = MapSVG.parseBoolean(on);
            _this.deselectAllRegions();
            _this.setEventHandlers();
        }
        download() {
            var _this = this;
            var downloadForm;
            if ($$x('#mdownload').length === 1) {
                downloadForm = $$x('#mdownload');
            }
            else {
                downloadForm = $$x('<form id="mdownload" action="/wp-content/plugins/mapsvg-dev/download.php" method="POST"><input type="hidden" name="svg_file" value="0" /><input type="hidden" name="svg_title"></form>');
                downloadForm.appendTo('body');
            }
            downloadForm.find('input[name="svg_file"]').val($$x(_this.containers.svg).prop('outerHTML'));
            downloadForm.find('input[name="svg_title"]').val(_this.options.title);
            setTimeout(function () {
                jquery('#mdownload').submit();
            }, 500);
        }
        showTooltip(html) {
            var _this = this;
            if (html.length) {
                $$x(_this.containers.tooltip).html(html);
                $$x(_this.containers.tooltip).addClass('mapsvg-tooltip-visible');
            }
        }
        popoverAdjustPosition() {
            var _this = this;
            if (!$$x(_this.containers.popover) || !$$x(_this.containers.popover).data('point'))
                return;
            var pos = _this.convertSVGToPixel($$x(_this.containers.popover).data('point'));
            $$x(_this.containers.popover)[0].style.transform = 'translateX(-50%) translate(' + pos[0] + 'px,' + pos[1] + 'px)';
        }
        showPopover(object) {
            var _this = this;
            var mapObject = object instanceof Region ? object : (object.location && object.location.marker && object.location.marker ? object.location.marker : null);
            if (!mapObject)
                return;
            var point;
            if (mapObject instanceof Marker) {
                point = mapObject.svgPoint;
            }
            else {
                point = mapObject.getCenterSVG();
            }
            _this.controllers.popover && _this.controllers.popover.destroy();
            _this.controllers.popover = new PopoverController({
                container: _this.containers.popover,
                point: point,
                yShift: mapObject instanceof Marker ? mapObject.height : 0,
                template: object instanceof Region ? _this.templates.popoverRegion : _this.templates.popoverMarker,
                mapsvg: _this,
                data: object.getData(this.regionsRepository.schema.name),
                mapObject: mapObject,
                scrollable: true,
                withToolbar: MapSVG.isPhone && _this.options.popovers.mobileFullscreen ? false : true,
                events: {
                    'shown'(mapsvg) {
                        if (_this.options.popovers.centerOn) {
                            var shift = $$x(this.containers.main).height() / 2;
                            if (_this.options.popovers.centerOn && !(MapSVG.isPhone && _this.options.popovers.mobileFullscreen)) {
                                _this.centerOn(mapObject, shift);
                            }
                        }
                        try {
                            _this.events['shown.popover'] && _this.events['shown.popover'].call(this, _this);
                        }
                        catch (err) {
                            console.log(err);
                        }
                        _this.popoverShowingFor = mapObject;
                        _this.events.trigger('popoverShown');
                    },
                    'closed'(mapsvg) {
                        _this.options.popovers.resetViewboxOnClose && _this.viewBoxReset(true);
                        _this.popoverShowingFor = null;
                        try {
                            _this.events['closed.popover'] && _this.events['closed.popover'].call(this, mapsvg);
                        }
                        catch (err) {
                            console.log(err);
                        }
                        _this.events.trigger('popoverClosed');
                    },
                    'resize'() {
                        if (_this.options.popovers.centerOn) {
                            var shift = $$x(this.containers.main).height() / 2;
                            if (_this.options.popovers.centerOn && !(MapSVG.isPhone && _this.options.popovers.mobileFullscreen)) {
                                _this.centerOn(mapObject, shift);
                            }
                        }
                    }
                }
            });
            _this.controllers.popover._init();
        }
        hidePopover() {
            var _this = this;
            _this.controllers.popover && _this.controllers.popover.close();
        }
        hideTip() {
            var _this = this;
            $$x(_this.containers.tooltip).removeClass('mapsvg-tooltip-visible');
        }
        popoverOffHandler(e) {
            var _this = this;
            if (_this.isScrolling || $$x(e.target).closest('.mapsvg-popover').length || $$x(e.target).hasClass('mapsvg-btn-map'))
                return;
            this.controllers.popover && this.controllers.popover.close();
        }
        mouseOverHandler(e, object) {
            var _this = this;
            if (_this.eventsPreventList['mouseover']) {
                return;
            }
            if (_this.options.tooltips.on) {
                var name;
                if (object instanceof Region) {
                    name = 'tooltipRegion';
                }
                if (object instanceof Marker) {
                    name = 'tooltipMarker';
                }
                if (_this.popoverShowingFor !== object) {
                    _this.showTooltip(_this.templates[name](object.getData(this.regionsRepository.schema.name)));
                }
            }
            let ids;
            if (_this.options.menu.on) {
                if (_this.options.menu.source == 'database') {
                    if ((object instanceof Region) && object.objects.length) {
                        ids = object.objects.map(function (obj) {
                            return obj.id;
                        });
                    }
                    if (object instanceof Marker) {
                        ids = [object.object.id];
                    }
                }
                else {
                    if ((object instanceof Region)) {
                        ids = [object.id];
                    }
                    if (this instanceof Marker && object.object.regions && object.object.regions.length) {
                        ids = object.object.regions.map(function (obj) {
                            return obj.id;
                        });
                    }
                }
                _this.controllers.directory.highlightItems(ids);
            }
            if (object instanceof Region) {
                if (!object.selected)
                    object.highlight();
                if (_this.events['mouseover.region']) {
                    try {
                        _this.events['mouseover.region'].call(object, e, _this);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            }
            else {
                _this.highlightMarker(object);
                if (_this.events['mouseover.marker']) {
                    try {
                        _this.events['mouseover.marker'].call(object, e, _this);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            }
        }
        mouseOutHandler(e, object) {
            var _this = this;
            if (_this.eventsPreventList['mouseout']) {
                return;
            }
            if (_this.options.tooltips.on)
                _this.hideTip();
            if (object instanceof Region) {
                if (!object.selected)
                    object.unhighlight();
                if (_this.events['mouseout.region']) {
                    try {
                        _this.events['mouseout.region'].call(object, e, _this);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            }
            else {
                _this.unhighlightMarker();
                if (_this.events['mouseout.marker']) {
                    try {
                        _this.events['mouseout.marker'].call(object, e, _this);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            }
            if (_this.options.menu.on) {
                _this.controllers.directory.unhighlightItems();
            }
        }
        eventsPrevent(event) {
            var _this = this;
            _this.eventsPreventList[event] = true;
        }
        eventsRestore(event) {
            var _this = this;
            if (event) {
                _this.eventsPreventList[event] = false;
            }
            else {
                _this.eventsPreventList = {};
            }
        }
        setEventHandlers() {
            var _this = this;
            $$x(_this.containers.map).off('.common.mapsvg');
            $$x(_this.containers.scrollpane).off('.common.mapsvg');
            $$x(document).off('keydown.scroll.mapsvg');
            $$x(document).off('mousemove.scrollInit.mapsvg');
            $$x(document).off('mouseup.scrollInit.mapsvg');
            if (_this.editMarkers.on) {
                $$x(_this.containers.map).on('touchstart.common.mapsvg mousedown.common.mapsvg', '.mapsvg-marker', function (e) {
                    e.originalEvent.preventDefault();
                    var marker = _this.getMarker($$x(this).attr('id'));
                    var startCoords = MapSVG.mouseCoords(e);
                    marker.drag(startCoords, _this.scale, function () {
                        if (_this.mapIsGeo) {
                            var svgPoint = new SVGPoint(this.x + this.width / 2, this.y + (this.height - 1));
                            this.geoCoords = _this.convertSVGToGeo(svgPoint);
                        }
                        _this.markerEditHandler && _this.markerEditHandler.call(this, true);
                        this.events.trigger('change', this);
                    }, function () {
                        _this.markerEditHandler && _this.markerEditHandler.call(this);
                        this.events.trigger('change', this);
                    });
                });
            }
            if (!_this.editMarkers.on) {
                $$x(_this.containers.map).on('mouseover.common.mapsvg', '.mapsvg-region', function (e) {
                    var id = $$x(this).attr('id');
                    _this.mouseOverHandler.call(_this, e, _this.getRegion(id));
                }).on('mouseleave.common.mapsvg', '.mapsvg-region', function (e) {
                    var id = $$x(this).attr('id');
                    _this.mouseOutHandler.call(_this, e, _this.getRegion(id));
                });
            }
            if (!_this.editRegions.on) {
                $$x(_this.containers.map).on('mouseover.common.mapsvg', '.mapsvg-marker', function (e) {
                    var id = $$x(this).attr('id');
                    _this.mouseOverHandler.call(_this, e, _this.getMarker(id));
                }).on('mouseleave.common.mapsvg', '.mapsvg-marker', function (e) {
                    var id = $$x(this).attr('id');
                    _this.mouseOutHandler.call(_this, e, _this.getMarker(id));
                });
            }
            if (_this.options.scroll.spacebar) {
                $$x(document).on('keydown.scroll.mapsvg', function (e) {
                    if (document.activeElement.tagName !== 'INPUT' && !_this.isScrolling && e.keyCode == 32) {
                        e.preventDefault();
                        $$x(_this.containers.map).addClass('mapsvg-scrollable');
                        $$x(document).on('mousemove.scrollInit.mapsvg', function (e) {
                            _this.isScrolling = true;
                            $$x(document).off('mousemove.scrollInit.mapsvg');
                            _this.scrollStart(e, _this);
                        }).on('keyup.scroll.mapsvg', function (e) {
                            if (e.keyCode == 32) {
                                $$x(document).off('mousemove.scrollInit.mapsvg');
                                $$x(_this.containers.map).removeClass('mapsvg-scrollable');
                            }
                        });
                    }
                });
            }
            else if (!_this.options.scroll.on) {
                if (!_this.editMarkers.on) {
                    $$x(_this.containers.map).on('touchstart.common.mapsvg', '.mapsvg-region', function (e) {
                        _this.scroll.touchScrollStart = $$x(window).scrollTop();
                    });
                    $$x(_this.containers.map).on('touchstart.common.mapsvg', '.mapsvg-marker', function (e) {
                        _this.scroll.touchScrollStart = $$x(window).scrollTop();
                    });
                    $$x(_this.containers.map).on('touchend.common.mapsvg mouseup.common.mapsvg', '.mapsvg-region', function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (_this.scroll.touchScrollStart === undefined || _this.scroll.touchScrollStart === $$x(window).scrollTop()) {
                            _this.regionClickHandler.call(_this, e, _this.getRegion($$x(this).attr('id')));
                        }
                    });
                    $$x(_this.containers.map).on('touchend.common.mapsvg mouseup.common.mapsvg', '.mapsvg-marker', function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (_this.scroll.touchScrollStart === undefined || _this.scroll.touchScrollStart === $$x(window).scrollTop()) {
                            _this.regionClickHandler.call(_this, e, _this.getMarker($$x(this).attr('id')));
                        }
                    });
                    $$x(_this.containers.map).on('touchend.common.mapsvg mouseup.common.mapsvg', '.mapsvg-marker-cluster', function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (!_this.scroll.touchScrollStart || _this.scroll.touchScrollStart == $$x(window).scrollTop()) {
                            var cluster = $$x(this).data("cluster");
                            _this.zoomTo(cluster.markers);
                        }
                    });
                }
                else {
                    if (_this.clickAddsMarker)
                        $$x(_this.containers.map).on('touchend.common.mapsvg mouseup.common.mapsvg', function (e) {
                            if (e.cancelable) {
                                e.preventDefault();
                            }
                            _this.markerAddClickHandler(e);
                        });
                }
            }
            else {
                $$x(_this.containers.map).on('touchstart.common.mapsvg mousedown.common.mapsvg', function (e) {
                    if ($$x(e.target).hasClass('mapsvg-popover') || $$x(e.target).closest('.mapsvg-popover').length) {
                        if ($$x(e.target).hasClass('mapsvg-popover-close')) {
                            if (e.type == 'touchstart') {
                                if (e.cancelable) {
                                    e.preventDefault();
                                }
                            }
                        }
                        return;
                    }
                    if (e.type == 'touchstart') {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    }
                    let obj;
                    if (e.target && $$x(e.target).attr('class') && $$x(e.target).attr('class').indexOf('mapsvg-region') != -1) {
                        obj = _this.getRegion($$x(e.target).attr('id'));
                        _this.scrollRegionClickHandler.call(_this, e, obj);
                    }
                    else if (e.target && $$x(e.target).attr('class') && $$x(e.target).attr('class').indexOf('mapsvg-marker') != -1 && $$x(e.target).attr('class').indexOf('mapsvg-marker-cluster') === -1) {
                        if (_this.editMarkers.on) {
                            return;
                        }
                        obj = _this.getMarker($$x(e.target).attr('id'));
                        _this.scrollRegionClickHandler.call(_this, e, obj);
                    }
                    else if (e.target && $$x(e.target).attr('class') && $$x(e.target).attr('class').indexOf('mapsvg-marker-cluster') != -1) {
                        if (_this.editMarkers.on) {
                            return;
                        }
                        obj = ($$x(e.target).data('cluster'));
                        _this.scrollRegionClickHandler.call(_this, e, obj);
                    }
                    if (e.type == 'mousedown') {
                        _this.scrollStart(e, _this);
                    }
                    else {
                        _this.touchStart(e, _this);
                    }
                });
            }
        }
        setLabelsRegions(options) {
            var _this = this;
            options = options || _this.options.labelsRegions;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            $$x.extend(true, _this.options, { labelsRegions: options });
            if (_this.options.labelsRegions.on) {
                _this.regions.forEach(function (region) {
                    if (!region.textLabel) {
                        region.textLabel = jquery('<div class="mapsvg-region-label" />')[0];
                        $$x(_this.containers.scrollpane).append(region.textLabel);
                    }
                    try {
                        $$x(region.textLabel).html(_this.templates.labelRegion(region.forTemplate()));
                    }
                    catch (err) {
                        console.error('MapSVG: Error in the "Region Label" template');
                    }
                });
                _this.labelsRegionsAdjustPosition();
            }
            else {
                _this.regions.forEach(function (region) {
                    if (region.textLabel) {
                        $$x(region.textLabel).remove();
                        region.textLabel = null;
                        delete region.textLabel;
                    }
                });
            }
        }
        deleteLabelsMarkers() {
            var _this = this;
            _this.markers.forEach(function (marker) {
                if (marker.textLabel) {
                    marker.textLabel.remove();
                    marker.textLabel = null;
                    delete marker.textLabel;
                }
            });
        }
        setLabelsMarkers(options) {
            var _this = this;
            options = options || _this.options.labelsMarkers;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            $$x.extend(true, _this.options, { labelsMarkers: options });
            if (_this.options.labelsMarkers.on) {
                _this.markers.forEach(function (marker) {
                    if (!marker.textLabel) {
                        marker.textLabel = jquery('<div class="mapsvg-marker-label" data-object-id="' + marker.object.id + '"/>')[0];
                        $$x(_this.containers.scrollpane).append(marker.textLabel);
                    }
                    try {
                        $$x(marker.textLabel).html(_this.templates.labelMarker(marker.object));
                    }
                    catch (err) {
                        console.error('MapSVG: Error in the "Marker Label" template');
                    }
                });
                _this.markersAdjustPosition();
            }
            else {
                _this.deleteLabelsMarkers();
            }
        }
        addLayer(name) {
            var _this = this;
            _this.layers[name] = $$x('<div class="mapsvg-layer mapsvg-layer-' + name + '"></div>')[0];
            _this.containers.layers.appendChild(_this.layers[name]);
            return _this.layers[name];
        }
        getDb() {
            return this.objects;
        }
        getDbRegions() {
            return this.regions;
        }
        regionAdd(svgObject) {
            var _this = this;
            var region = new Region(svgObject, _this);
            region.setStatus(1);
            _this.regions.push(region);
            return region;
        }
        regionDelete(id) {
            if (this.regions.findById(id)) {
                this.regions.findById(id).elem.remove();
                this.regions.delete(id);
            }
            else if ($$x('#' + id).length) {
                $$x('#' + id).remove();
            }
        }
        reloadRegions() {
            var _this = this;
            _this.regions.clear();
            $$x(_this.containers.svg).find('.mapsvg-region').removeClass('mapsvg-region');
            $$x(_this.containers.svg).find('.mapsvg-region-disabled').removeClass('mapsvg-region-disabled');
            $$x(_this.containers.svg).find('path, polygon, circle, ellipse, rect').each(function (index) {
                var elem = this;
                if ($$x(elem).closest('defs').length)
                    return;
                if (elem.getAttribute('id')) {
                    if (!_this.options.regionPrefix || (_this.options.regionPrefix && elem.getAttribute('id').indexOf(_this.options.regionPrefix) === 0)) {
                        var region = new Region(elem, _this);
                        _this.regions.push(region);
                    }
                }
            });
        }
        reloadRegionsFull() {
            var _this = this;
            var statuses = _this.regionsRepository.getSchema().getFieldByType('status');
            _this.regions.forEach(function (region) {
                let _region;
                _region = _this.regionsRepository.getLoaded().findById(region.id);
                if (_region) {
                    region.setData(_region);
                    if (statuses && _region.status !== undefined && _region.status !== null) {
                        region.setStatus(_region.status);
                    }
                }
                else {
                    if (_this.options.filters.filteredRegionsStatus || _this.options.filters.filteredRegionsStatus === 0) {
                        region.setStatus(_this.options.filters.filteredRegionsStatus);
                    }
                }
            });
            _this.loadDirectory();
            _this.setGauge();
            _this.setLayersControl();
            _this.setGroups();
            if (_this.options.labelsRegions.on) {
                _this.setLabelsRegions();
            }
        }
        updateOutdatedOptions(options) {
            if (options.menu && (options.menu.position || options.menu.customContainer)) {
                if (options.menu.customContainer) {
                    options.menu.location = 'custom';
                }
                else {
                    options.menu.position = options.menu.position === 'left' ? 'left' : 'right';
                    options.menu.location = options.menu.position === 'left' ? 'leftSidebar' : 'rightSidebar';
                    if (!options.containers || !options.containers[options.menu.location]) {
                        options.containers = options.containers || {};
                        options.containers[options.menu.location] = { on: false, width: '200px' };
                    }
                    options.containers[options.menu.location].width = options.menu.width;
                    if (MapSVG.parseBoolean(options.menu.on)) {
                        options.containers[options.menu.location].on = true;
                    }
                }
                delete options.menu.position;
                delete options.menu.width;
                delete options.menu.customContainer;
            }
            if (options.detailsView && (options.detailsView.location === 'near' || options.detailsView.location === 'top')) {
                options.detailsView.location = 'map';
            }
            if (!options.controls) {
                options.controls = {};
                options.controls.zoom = options.zoom && options.zoom.on && (!options.zoom.buttons || options.zoom.buttons.location !== 'hide');
                options.controls.location = options.zoom && options.zoom.buttons && options.zoom.buttons.location !== 'hide' ? options.zoom.buttons.location : 'right';
            }
            if (options.colors && !options.colors.markers) {
                options.colors.markers = {
                    base: { opacity: 100, saturation: 100 },
                    hovered: { opacity: 100, saturation: 100 },
                    unhovered: { opacity: 100, saturation: 100 },
                    active: { opacity: 100, saturation: 100 },
                    inactive: { opacity: 100, saturation: 100 }
                };
            }
            if (options.tooltipsMode) {
                options.tooltips.mode = options.tooltipsMode;
                delete options.tooltipsMode;
            }
            if (options.popover) {
                options.popovers = options.popover;
                delete options.popover;
            }
        }
        init() {
            var _this = this;
            if (this.options.source === '') {
                throw new Error('MapSVG: please provide SVG file source.');
            }
            if (!('remove' in Element.prototype)) {
                Element.prototype.remove = function () {
                    if (this.parentNode) {
                        this.parentNode.removeChild(this);
                    }
                };
            }
            Math.hypot = Math.hypot || function () {
                var y = 0;
                var length = arguments.length;
                for (var i = 0; i < length; i++) {
                    if (arguments[i] === Infinity || arguments[i] === -Infinity) {
                        return Infinity;
                    }
                    y += arguments[i] * arguments[i];
                }
                return Math.sqrt(y);
            };
            SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function (toElement) {
                return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
            };
            this.setEvents(this.options.events);
            this.events.trigger('beforeLoad');
            this.setCss();
            this.containers.map.classList.add('mapsvg', 'no-transitions');
            if (this.options.colors && this.options.colors.background) {
                this.containers.map.style.background = this.options.colors.background;
            }
            this.setContainers(_this.options.containers);
            this.setColors();
            this.containers.loading = document.createElement('div');
            this.containers.loading.className = 'mapsvg-loading';
            this.containers.loading.innerHTML = this.options.loadingText;
            this.containers.map.appendChild(this.containers.loading);
            this.addLayer('markers');
            this.addLayer('popovers');
            $$x(_this.containers.loading).css({
                'margin-left'() {
                    return -($$x(this).outerWidth(false) / 2) + 'px';
                },
                'margin-top'() {
                    return -($$x(this).outerHeight(false) / 2) + 'px';
                }
            });
            if (_this.options.googleMaps.on) {
                $$x(_this.containers.map).addClass('mapsvg-google-map-loading');
            }
            if (_this.options.extension && $$x().mapSvg.extensions && $$x().mapSvg.extensions[_this.options.extension]) {
                var ext = $$x().mapSvg.extensions[_this.options.extension];
                ext && ext.common(_this);
            }
            $$x.ajax({ url: _this.options.source + '?v=' + _this.options.svgFileVersion }).fail(function (resp) {
                if (resp.status == 404) {
                    alert('File not found: ' + _this.options.source + '\n\nIf you moved MapSVG from another server please read the following tutorial:\nhttps://mapsvg.com/tutorials/4.0.x/6/');
                }
                else {
                    alert('Can\'t load SVG file. Please contact support.');
                }
            }).done(function (xmlData) {
                var svgTag = $$x(xmlData).find('svg');
                _this.containers.svg = svgTag[0];
                if (svgTag.attr('width') && svgTag.attr('height')) {
                    _this.svgDefault.width = parseFloat(svgTag.attr('width').replace(/px/g, ''));
                    _this.svgDefault.height = parseFloat(svgTag.attr('height').replace(/px/g, ''));
                    _this.svgDefault.viewBox = svgTag.attr('viewBox') ? new ViewBox(svgTag.attr('viewBox').split(' ')) : new ViewBox(0, 0, _this.svgDefault.width, _this.svgDefault.height);
                }
                else if (svgTag.attr('viewBox')) {
                    _this.svgDefault.viewBox = new ViewBox(svgTag.attr('viewBox').split(' '));
                    _this.svgDefault.width = _this.svgDefault.viewBox.width;
                    _this.svgDefault.height = _this.svgDefault.viewBox.height;
                }
                else {
                    alert('MapSVG needs width/height or viewBox parameter to be present in SVG file.');
                    return false;
                }
                var geo = svgTag.attr("mapsvg:geoViewBox") || svgTag.attr("mapsvg:geoviewbox");
                if (geo) {
                    let geoParts = geo.split(" ").map(p => parseFloat(p));
                    if (geoParts.length == 4) {
                        _this.mapIsGeo = true;
                        _this.geoCoordinates = true;
                        let sw = new GeoPoint(geoParts[3], geoParts[0]);
                        let ne = new GeoPoint(geoParts[1], geoParts[2]);
                        _this.geoViewBox = new GeoViewBox(sw, ne);
                        _this.mapLonDelta = _this.geoViewBox.ne.lng - _this.geoViewBox.sw.lng;
                        _this.mapLatBottomDegree = _this.geoViewBox.sw.lat * 3.14159 / 180;
                    }
                }
                if (_this.options.viewBox && _this.options.viewBox.length == 4) {
                    _this._viewBox = new ViewBox(_this.options.viewBox);
                }
                else {
                    _this._viewBox = new ViewBox(_this.svgDefault.viewBox);
                }
                svgTag.attr('preserveAspectRatio', 'xMidYMid meet');
                svgTag.removeAttr('width');
                svgTag.removeAttr('height');
                _this.reloadRegions();
                $$x(_this.containers.scrollpane).append(svgTag);
                _this.setSize(_this.options.width, _this.options.height, _this.options.responsive);
                if (_this.options.disableAll) {
                    _this.setDisableAll(true);
                }
                _this.setViewBox(_this._viewBox);
                _this.setResponsive(_this.options.responsive);
                _this.setScroll(_this.options.scroll, true);
                _this.setZoom(_this.options.zoom);
                _this.setControls(_this.options.controls);
                _this.setGoogleMaps();
                _this.setTooltips(_this.options.tooltips);
                _this.setPopovers(_this.options.popovers);
                if (_this.options.cursor)
                    _this.setCursor(_this.options.cursor);
                _this.setTemplates(_this.options.templates);
                if (!_this.options.backend && _this.options.extension && $$x().mapSvg.extensions && $$x().mapSvg.extensions[_this.options.extension]) {
                    var ext = $$x().mapSvg.extensions[_this.options.extension];
                    ext && ext.frontend(_this);
                }
                _this.filtersSchema = new Schema({ fields: _this.options.filtersSchema });
                _this.objectsRepository.events.on('loaded', function () {
                    _this.fitOnDataLoadDone = false;
                    _this.addLocations();
                    _this.attachDataToRegions();
                    _this.loadDirectory();
                    if (_this.options.labelsMarkers.on) {
                        _this.setLabelsMarkers();
                    }
                    _this.events.trigger('dataLoaded');
                    _this.updateFiltersState();
                });
                _this.objectsRepository.events.on('schemaChanged', function () {
                    _this.objectsRepository.reload();
                });
                _this.objectsRepository.events.on('updated', function (obj) {
                    _this.attachDataToRegions(obj);
                    if (_this.options.menu.on && _this.controllers.directory) {
                        _this.loadDirectory();
                    }
                });
                _this.objectsRepository.events.on('created', function (obj) {
                    _this.attachDataToRegions(obj);
                });
                _this.objectsRepository.events.on('deleted', function (id) {
                    _this.attachDataToRegions();
                    if (_this.options.menu.on && _this.controllers.directory) {
                        _this.loadDirectory();
                    }
                });
                _this.regionsRepository.events.on('loaded', function () {
                    _this.reloadRegionsFull();
                    _this.events.trigger('regionsLoaded');
                });
                _this.regionsRepository.events.on('updated', function (regionData) {
                    _this.reloadRegionsFull();
                });
                _this.setMenu();
                _this.setFilters();
                if (_this.options.menu.filterout.field) {
                    var f = {};
                    f[_this.options.menu.filterout.field] = _this.options.menu.filterout.val;
                    if (_this.options.menu.source == 'regions') ;
                    else {
                        _this.objectsRepository.query.setFilterOut(f);
                    }
                }
                _this.setEventHandlers();
                if (!_this.id) {
                    _this.final();
                    return;
                }
                if (!_this.options.data_regions || !_this.options.data_objects) {
                    _this.regionsRepository.find().done(function (regions) {
                        if (_this.options.database.loadOnStart || _this.editMode) {
                            _this.objectsRepository.find().done(function (data) {
                                _this.final();
                            });
                        }
                        else {
                            _this.final();
                        }
                    });
                }
                else {
                    _this.regionsRepository.loadDataFromResponse(_this.options.data_regions);
                    if (_this.editMode || _this.options.database.loadOnStart) {
                        _this.objectsRepository.loadDataFromResponse(_this.options.data_objects);
                    }
                    delete _this.options.data_regions;
                    delete _this.options.data_objects;
                }
                _this.final();
            });
            return _this;
        }
        final() {
            var _this = this;
            if (_this.options.googleMaps.on && !_this.googleMaps.map) {
                _this.events.on('googleMapsLoaded', function () {
                    _this.final();
                });
                return;
            }
            let match = RegExp('[?&]mapsvg_select=([^&]*)').exec(window.location.search);
            if (match) {
                var select = decodeURIComponent(match[1].replace(/\+/g, ' '));
                _this.selectRegion(select);
            }
            if (window.location.hash) {
                var query = window.location.hash.replace('#/m/', '');
                var region = _this.getRegion(query);
                if (region && _this.options.actions.map.afterLoad.selectRegion) {
                    _this.regionClickHandler(null, region);
                }
            }
            setTimeout(function () {
                _this.updateSize();
                setTimeout(function () {
                    $$x(_this.containers.map).removeClass('no-transitions');
                }, 200);
            }, 100);
            _this.events.trigger('afterLoad');
            $$x(_this.containers.loading).hide();
            MapSVG.addInstance(_this);
        }
        createForm(options) {
            return new FormBuilder(options);
        }
        getApiUrl(path) {
            var server = new Server();
            return server.getUrl(path);
        }
    }
    MapSVGMap.MapSVG = MapSVG;

    exports.MapSVGMap = MapSVGMap;
    exports.globals = MapSVG;
    exports.location = Location;
    exports.map = MapSVGMap;
    exports.mapsRepository = MapsRepository;
    exports.marker = Marker;
    exports.repository = Repository;
    exports.schemaRepository = SchemaRepository;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=mapsvg-front.umd.js.map
