"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    s[19] = hexDigits.substr(s[19] | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
}
exports.createUUID = createUUID;
function getAuthCodeFromLocation(location) {
    var url = new URL(location);
    var params = url.search.substring(1).split("&");
    for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
        var param = params_1[_i];
        var _a = param.split("="), key = _a[0], value = _a[1];
        if (key === "code") {
            return value;
        }
    }
}
exports.getAuthCodeFromLocation = getAuthCodeFromLocation;
function decodeToken(str) {
    str = str.split(".")[1];
    str = str.replace("/-/g", "+");
    str = str.replace("/_/g", "/");
    switch (str.length % 4) {
        case 0:
            break;
        case 2:
            str += "==";
            break;
        case 3:
            str += "=";
            break;
        default:
            throw new Error("Invalid token");
    }
    str = (str + "===").slice(0, str.length + (str.length % 4));
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    str = decodeURIComponent(escape(atob(str)));
    return JSON.parse(str);
}
exports.decodeToken = decodeToken;
