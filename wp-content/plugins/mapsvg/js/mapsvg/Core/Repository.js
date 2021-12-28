"use strict";
exports.__esModule = true;
exports.Repository = void 0;
var Repository = /** @class */ (function () {
    function Repository(db, path, mapsvg) {
        this.db = db;
        this.path = path;
        this.mapsvg = mapsvg;
    }
    Repository.prototype.forEach = function (callback) {
        return [].forEach.call(this.objects, callback);
    };
    Repository.prototype.map = function (callback) {
        return [].map.call(this.objects, callback);
    };
    Repository.prototype.create = function (object) {
    };
    Repository.prototype.find = function () {
    };
    Repository.prototype.findById = function (id) { };
    Repository.prototype.update = function (object) {
    };
    Repository.prototype["delete"] = function (id) {
    };
    Repository.prototype.encodeData = function (params) {
        return params;
    };
    Repository.prototype.decodeData = function (params) {
        return params;
    };
    Repository.prototype.getLoaded = function () {
        return this.objects;
    };
    Repository.prototype.getSchema = function () {
        return this.schema;
    };
    return Repository;
}());
exports.Repository = Repository;
