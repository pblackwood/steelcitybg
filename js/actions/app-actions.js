var AppConstants = require('../constants/app-constants.js');
var AppDispatcher = require('../dispatchers/app-dispatcher.js');
var Config = require('../properties/props');
var moment = require('moment');

var timing = {};

var AppActions = {
    startTiming: function (name, logit, displayName) {
        timing[name] = {};
        timing[name].timestamp = moment().format("x");
        timing[name].displayName = displayName;
        if (logit && Config.printDebugTimings) {
            console.log("Start timing for: " + (displayName || name));
        }
    },
    endTiming: function (name, logit) {
        var elapsedMs = 0;
        if (timing.hasOwnProperty(name)) {
            elapsedMs = (moment().format("x") - timing[name].timestamp);
            if (logit && Config.printDebugTimings) {
                console.log("End timing for: " + (timing[name].displayName || name) + ", elapsed ms = " + elapsedMs);
            }
            //delete timing[name];
        }
        return elapsedMs;
    },
    createManifest: function (unlock) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.CREATE_MANIFEST,
            unlock: unlock
        });
    },
    saveManifest: function (callback) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SAVE_MANIFEST,
            callback: callback
        });
    },
    saveManifestAs: function (callback) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SAVE_MANIFEST_AS,
            callback: callback
        });
    },
    openManifest: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.OPEN_MANIFEST
        });
    },
    closeManifest: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.CLOSE_MANIFEST
        });
    },
    saveKey: function (id, key) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SAVE_KEY,
            id: id,
            key: key
        });
    },
    saveTableColumnKey: function (tableId, colId, colIndex, key) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SAVE_TABLE_COLUMN_KEY,
            id: tableId,
            colId: colId,
            colIndex: colIndex,
            key: key
        });
    },
    savePropValue: function (id, propValue) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SAVE_PROP_VALUE,
            id: id,
            propValue: propValue
        });
    },
    addCategory: function (id, view) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_CATEGORY,
            id: id,
            view: view
        });
    },
    addProp: function (id, view) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_PROP,
            id: id,
            view: view
        });
    },
    addProps: function (id, view) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_PROPS,
            id: id,
            view: view
        });
    },
    addProps2d: function (id, view) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_PROPS2D,
            id: id,
            view: view
        });
    },
    addTableRow: function (id, view) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_TABLE_ROW,
            id: id,
            view: view
        });
    },
    addTableColumn: function (id, view) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_TABLE_COLUMN,
            id: id,
            view: view
        });
    },
    removeTableColumn: function (tableId, colIndex) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REMOVE_TABLE_COLUMN,
            tableId: tableId,
            colIndex: colIndex
        });
    },
    addDoctreeFolder: function (parentNode, callback) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_DOCTREE_FOLDER,
            parentNode: parentNode,
            callback: callback
        });
    },
    removeDoctreeFolder: function (node, callback) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REMOVE_DOCTREE_FOLDER,
            node: node,
            callback: callback
        });
    },
    remove: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REMOVE,
            id: id
        });
    },
    removeMultiple: function (ids) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REMOVE_MULTIPLE,
            ids: ids
        });
    },
    removeSelected: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REMOVE_SELECTED
        });
    },
    excludeFromShared: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.EXCLUDE_FROM_SHARED,
            id: id
        });
    },
    restoreToShared: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.RESTORE_TO_SHARED,
            id: id
        });
    },
    moveUp: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_UP,
            id: id
        });
    },
    moveDown: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_DOWN,
            id: id
        });
    },
    moveSelectedUp: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_SELECTED_UP
        });
    },
    moveSelectedDown: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_SELECTED_DOWN
        });
    },
    moveLeft: function (tableId, colIndex) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_LEFT,
            tableId: tableId,
            colIndex: colIndex
        });
    },
    moveRight: function (tableId, colIndex) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_RIGHT,
            tableId: tableId,
            colIndex: colIndex
        });
    },
    moveSelectedLeft: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_SELECTED_LEFT
        });
    },
    moveSelectedRight: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.MOVE_SELECTED_RIGHT
        });
    },
    selectComponent: function (id, ctrl, shift) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SELECT_COMPONENT,
            id: id,
            ctrl: ctrl,
            shift: shift
        });
    },
    selectTreeNode: function (node) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SELECT_TREE_NODE,
            node: node
        });
    },
    convertToCategory: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.CONVERT_TO_CATEGORY,
            id: id
        });
    },
    convertToProps2d: function (ids) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.CONVERT_TO_PROPS2D,
            ids: ids
        });
    },
    convertToProps: function (ids) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.CONVERT_TO_PROPS,
            ids: ids
        });
    },
    unwrapChildren: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.UNWRAP_CHILDREN,
            id: id
        });
    },
    cutSelectedComponent: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.CUT_COMPONENT
        });
    },
    copySelectedComponent: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.COPY_COMPONENT
        });
    },
    pasteIntoSelectedComponent: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.PASTE_COMPONENT
        });
    },
    copyComponent: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.COPY_COMPONENT,
            id: id
        });
    },
    copyText: function (text) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.COPY_TEXT,
            text: text
        });
    },
    dereferenceContent: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.DEREFERENCE_CONTENT,
            id: id
        });
    },
    requestSharedEdit: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REQUEST_SHARED_EDIT,
            id: id
        });
    },
    extend: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.EXTEND,
            id: id
        });
    },

    override: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.OVERRIDE,
            id: id
        });
    },
    removeOverride: function (id) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REMOVE_OVERRIDE,
            id: id
        });
    },
    includeChildren: function (parentId, children) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.INCLUDE_OR_EXCLUDE_CHILDREN,
            parentId: parentId,
            children: children,
            includeFlag: true
        });
    },
    excludeChildren: function (parentId, children) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.INCLUDE_OR_EXCLUDE_CHILDREN,
            parentId: parentId,
            children: children,
            includeFlag: false
        });
    },
    getRecentManifests: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REQUEST_RECENT_MANIFESTS
        });
    },
    selectManifest: function (name) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SELECT_MANIFEST,
            name: name
        });
    },
    userConfirmation: function (answer) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.USER_CONFIRMATION,
            answer: answer
        });
    },
    userInputResponse: function (textResponse, booleanResponse) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.USER_INPUT_RESPONSE,
            textResponse: textResponse,
            booleanResponse: booleanResponse
        });
    },
    fileSaveResponse: function (textResponse, booleanResponse) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.FILE_SAVE_RESPONSE,
            textResponse: textResponse,
            booleanResponse: booleanResponse
        });
    },
    userMessageDismissed: function (response) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.USER_MESSAGE_DISMISSED
        });
    },
    userFileModalClosed: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.USER_FILE_MODAL_CLOSED
        });
    },
    userManageExtensionModalOpen: function (node) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.USER_MANAGE_EXTENSION_MODAL_OPEN,
            node: node
        });
    },
    userManageExtensionModalClosed: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.USER_MANAGE_EXTENSION_MODAL_CLOSED
        });
    },

    requestContentSearch: function (query, matchCase, page, pageSize, collapsed) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REQUEST_CONTENT_SEARCH,
            query: query,
            matchCase: matchCase,
            page: page,
            pageSize: pageSize,
            collapsed: collapsed
        });
    },

    collapseAll: function (view, content, collapsed) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.COLLAPSE_ALL,
            view: view,
            content: content,
            collapsed: collapsed
        });
    },

    undo: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.UNDO
        });
    },

    redo: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REDO
        });
    },

    exportManifest: function (manifestId, baseLang, targetLang) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.EXPORT_MANIFEST,
            manifestId: manifestId,
            baseLang: baseLang,
            targetLang: targetLang
        });
    },

    importManifest: function (file, lang) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.IMPORT_MANIFEST,
            file: file,
            lang: lang
        });
    },

    getAllTags: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REQUEST_ALL_TAGS
        });
    },

    addTag: function (id, tag) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.ADD_TAG,
            id: id,
            tag: tag
        });
    },

    removeTag: function (id, tag) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.REMOVE_TAG,
            id: id,
            tag: tag
        });
    },

    lockContent: function (id, exclusive) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.LOCK_CONTENT,
            id: id,
            exclusive: exclusive
        });
    },

    unlockContent: function (id, exclusive) {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.UNLOCK_CONTENT,
            id: id,
            exclusive: exclusive
        });
    },

    showAboutMessage: function () {
        AppDispatcher.handleViewAction({
            actionType: AppConstants.SHOW_ABOUT_MESSAGE
        });
    }

}

module.exports = AppActions;
