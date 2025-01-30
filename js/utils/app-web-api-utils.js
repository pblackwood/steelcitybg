var $ = require('jquery');
var AppActions = require('../actions/app-actions');
var AppServerActions = require('../actions/app-server-actions');
var Config = require('../properties/props');
var request = require('superagent');

var AppWebApiUtils = {

    requestHeaders: Config.authorizationString ?
        {
            'Content-Type': 'application/json',
            Authorization: Config.authorizationString
        } :
        {
            'Content-Type': 'application/json'
        },

    // TODO, temp because the server is returning large langs arrays
    reviver: function (key, value) {
        if (key === 'langs') {
            return undefined;
        } else {
            return value;
        }
    },

    getManifest: function (manifestName, successCallback, errorCallback) {
        var url = Config.contentDictionaryStateEndpoint + "/" + manifestName;
        var data = {
            format: "jsonauthoring"
        };
        request.get(url)
            .set(this.requestHeaders)
            .query(data)
            .end(function (err, res) {
                if (err == null) {
                    AppActions.endTiming("Load manifest", true);
                    // TODO because the server is returning large langs arrays
                    res.body = JSON.parse(res.text, AppWebApiUtils.reviver);
                    AppActions.startTiming("Render manifest", true, "Render manifest " + manifestName);
                    AppServerActions.receiveManifest(res.body);
                    successCallback();
                } else {
                    errorCallback("Internal Error");
                }
            });
    },

    getComponent: function (options, errorCallback) {
        var url = Config.contentDictionaryEndpoint + "/" + options.targetType + "/" + options.targetId;
        request.get(url)
            .set(this.requestHeaders)
            .query({
                format: "jsonauthoring"
            })
            .end(function (err, res) {
                if (err == null) {
                    // TODO temp because the server is returning large langs arrays
                    res.body = JSON.parse(res.text, AppWebApiUtils.reviver);

                    // The key may or may not be needed, but this gives it a default
                    res.body.key = options.targetKey;
                    // Workaround for server not returning the CGUID in the response
                    res.body.cguid = options.targetId;
                    AppServerActions.receiveComponent(options, res.body);
                } else {
                    errorCallback(res.status, res.statusText || "Error retrieving content.", AppWebApiUtils.getErrorMessage(res));
                }
            });
    },

    getRecentManifests: function (errorCallback) {
        var url = Config.contentDictionaryStateEndpoint;
        request.get(url)
            .set(this.requestHeaders)
            .end(function (err, res) {
                if (err == null) {
                    AppServerActions.receiveRecentManifests(res.body);
                } else {
                    errorCallback("Internal Error");
                }
            });
    },

    clearManifestCheckoutLock: function (manifestName, successCallback, errorCallback) {
        var url = Config.contentDictionaryStateEndpoint + "/" + manifestName;
        var data = {
            breakCheckoutLock: true
        };
        request.get(url)
            .set(this.requestHeaders)
            .query(data)
            .end(function (err, res) {
                if (err == null) {
                    successCallback();
                } else {
                    errorCallback("Error closing manifest", AppWebApiUtils.getErrorMessage(res));
                }
            });
    },

    // Use this only from the window.unload event handler, because it blocks the browser
    closeManifestBlocked: function (manifestName, callback) {
        var url = Config.contentDictionaryStateEndpoint + "/" + manifestName;
        var data = {
            breakCheckoutLock: true
        };
        $.ajax(url, {
            headers: this.requestHeaders,
            data: data,
            async: false,
            complete: callback
        });
    },

    saveManifest: function (manifestName, manifest, stringifyReplacer, successCallback, errorCallback) {
        var url = Config.contentDictionaryStateEndpoint + "/" + manifestName;
        var data = JSON.stringify({
            payload: manifest
        }, stringifyReplacer);
        request.put(url)
            .set(this.requestHeaders)
            .send(data)
            .end(function (err, res) {
                if (err == null) {
                    successCallback("Saved manifest: " + manifestName + ".");
                } else {
                    errorCallback("Error saving manifest: " + manifestName + ".", AppWebApiUtils.getErrorMessage(res));
                }
            });
    },

    getAllTags: function (successCallback, errorCallback) {
        request.get(Config.contentDictionaryTagsEndpoint)
            .set(this.requestHeaders)
            .end(function (err, res) {
                if (err == null) {
                    successCallback(res.body);
                } else {
                    errorCallback("Error retrieving tag list", res);
                }
            });
    },

    searchContent: function (query, successCallback, errorCallback, matchCase, page, pageSize) {
        request.get(Config.contentDictionarySearchEndpoint)
            .set(this.requestHeaders)
            .query({
                format: "jsonauthoring",
                query: query,
                // TODO, orderBy is not implemented yet
                matchCase: matchCase,
                page: page,
                pageSize: pageSize
            })
            .end(function (err, res) {
                if (err == null) {
                    successCallback(res.body);
                } else {
                    errorCallback("Error searching for content.", res);
                }
            });
    },

    lockContent: function (id, contentType, exclusive, successCallback, errorCallback) {
        var url = Config.contentDictionaryLockEndpoint + "/" + contentType + "/" + id;
        var data = JSON.stringify({
            skipLocked: !exclusive
        });
        request.put(url)
            .set(this.requestHeaders)
            .send(data)
            .end(function (err, res) {
                if (err == null) {
                    successCallback("Content Locked: " + id + ".");
                } else {
                    errorCallback(res.status, "Error locking content: " + id + ".", AppWebApiUtils.getErrorMessage(res));
                }
            });
    },

    unlockContent: function (id, contentType, exclusive, successCallback, errorCallback) {
        var url = Config.contentDictionaryLockEndpoint + "/" + contentType + "/" + id;
        var data = JSON.stringify({
            unlock: true,
            skipLocked: !exclusive
        });
        request.put(url)
            .set(this.requestHeaders)
            .send(data)
            .end(function (err, res) {
                if (err == null) {
                    successCallback("Content Unlocked: " + id + ".");
                } else {
                    errorCallback(res.status, "Error unlocking content: " + id + ".", AppWebApiUtils.getErrorMessage(res));
                }
            });
    },

    isContentLocked: function (id, contentType, successCallback, errorCallback) {
        var url = Config.contentDictionaryLockEndpoint + "/" + contentType + "/" + id;
        request.get(url)
            .set(this.requestHeaders)
            .end(function (err, res) {
                if (err == null) {
                    successCallback(res.body);
                } else {
                    errorCallback("Error checking lock", AppWebApiUtils.getErrorMessage(res));
                }
            });
    },

    getExportTranslationUrl: function (manifestId, baseLang, targetLang) {
        var url = Config.contentDictionaryExportEndpoint + '/' + manifestId + '?lang=' + baseLang;
        if (targetLang) {
            url += '&targetLang=' + targetLang;
        }
        return url;
    },

    importManifest: function (file, lang, successCallback, errorCallback) {
        var req = request.post(Config.contentDictionaryImportEndpoint)
            .attach('file', file, file.name)
            .field('lang', lang);
        if (Config.authorizationString) {
            req.set('Authorization', Config.authorizationString);
        }
        req.end(function (err, res) {
            if (err == null) {
                successCallback();
            } else {
                errorCallback("Error importing", AppWebApiUtils.getErrorMessage(res));
            }
        });
    },

    getErrorMessage: function (res) {
        if (res.text) {
            var errorObj = JSON.parse(res.text);
            if (errorObj.message) {
                return errorObj.message;
            }
        } else if (res.statusText) {
            return res.statusText;
        }
    }
}

module.exports = AppWebApiUtils;
