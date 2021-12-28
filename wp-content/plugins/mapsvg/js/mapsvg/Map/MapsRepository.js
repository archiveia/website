"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Repository_1 = require("../Core/Repository");
var MapsRepository = /** @class */ (function (_super) {
    __extends(MapsRepository, _super);
    function MapsRepository() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MapsRepository.prototype.find = function () {
    };
    MapsRepository.prototype.findOne = function () {
    };
    MapsRepository.prototype.update = function () {
    };
    MapsRepository.prototype["delete"] = function () {
    };
    MapsRepository.prototype.encodeData = function (params) {
        return params;
    };
    return MapsRepository;
}(Repository_1.Repository));
exports["default"] = MapsRepository;
