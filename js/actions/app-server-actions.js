var AppConstants = require('../constants/app-constants');
var AppDispatcher = require('../dispatchers/app-dispatcher');

var AppServerActions = {
    receiveManifest: function (response) {
        AppDispatcher.handleServerAction({
            actionType: AppConstants.RECEIVE_MANIFEST,
            response: response
        });
    },
    receiveRecentManifests: function (manifestNames) {
        AppDispatcher.handleServerAction({
            actionType: AppConstants.RECEIVE_RECENT_MANIFESTS,
            manifestNames: manifestNames
        });
    },
    receiveComponent: function (options, childContent) {
        AppDispatcher.handleServerAction({
            actionType: AppConstants.PASTE_COMPONENT,
            options: options,
            child: childContent
        });
    }
}

module.exports = AppServerActions;
