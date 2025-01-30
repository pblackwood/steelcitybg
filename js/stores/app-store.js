var AppWebApiUtils = require('../utils/app-web-api-utils');
var AppUtils = require('../utils/app-utils');
var AppKeys = require('../utils/app-keys');
var AppDispatcher = require('../dispatchers/app-dispatcher');
var AppConstants = require('../constants/app-constants');
var AppActions = require('../actions/app-actions');
var AppView = require('../components/app-view');
var Config = require('../properties/props');
var Stack = require('../utils/stack');
var Notify = require('../utils/notify');
var ContentStore = require('./ContentStore');

var uuid = require('node-uuid');
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = "change";

var _manifest;
var _clipboard;
var _recentManifests = [];
var _recentManifestTree;
var _tagCache;
var _contentSearchResults;
var _newestNodeId;

var _userConfirmation = {};
var _userInputRequest = {};
var _userInfoMessage = {};
var _contentLockRequest = {};
var _fileOpenRequest = {};
var _fileSaveRequest = {};
var _appBlockRequest = {};
var _manageExtendsRequest = {};
var _contentImportMessage = {};

var SELECTION_TYPE = {
    EDITOR: 0,
    SEARCH: 1
};

var _selection = {
    type: SELECTION_TYPE.EDITOR,
    ids: []
};

// The editor content and related functions
var _editorContent = new ContentStore();

// Search results content and related functions
var _searchContent = new ContentStore();

// A hash table to map nodeid => collapsed state in the tree view and editor view independently.
var _collapsedHash = _initCollapsedHash();

// Maintains an array of N copies of the key store objects.
var _undoStack = new Stack(Config.undoStackMaxSize);

// Allows the user to undo the last N undos.
var _redoStack = new Stack(Config.undoStackMaxSize);

// Helps with re-rendering after an undo
var _undoInProgress;

// Prevents a second manifest from trying to load
var _manifestLoading = false;

// Should the UI show the welcome modal?
var _showWelcome = Config.showWelcome || !Config.defaultManifest;

// The currently authenticated user
var _currentUser = "";

var _collapseDefaults = {
    prop: true,
    props: true,
    props2d: true,
    category: false,
    manifest: false
};

function _saveManifest(callback) {
    // Check if the manifest has any empty keys
    _manifest.emptyKey = _editorContent.findEmptyKey(_manifest);
    if (_manifest.emptyKey) {
        var parentPath = _manifest.emptyKey === "root" ? "at the top level" : "parent is " + _manifest.emptyKey.substring(5);
        _requestConfirmation("Invalid Keys Found",
            "At least one empty key was found. (" + parentPath + ") You can save your work but the content may not have the structure you intended.",
            "Continue?",
            _saveManifestConfirmed,
            callback
        )
    } else {
        _userConfirmation.data = callback;
        _saveManifestConfirmed(true);
    }
}

function _saveManifestConfirmed(answer) {
    if (answer) {
        // Check if the save needs a filename
        if (_manifest && _manifest.isNew) {
            _requestFileSaveRequest("Document name needed",
                "Locate and name your new document.",
                "Enter Name",
                null,
                _recentManifestTree,
                _saveManifestWithResponse,
                _userConfirmation.data
            )
        } else {
            _fileSaveRequest.data = _userConfirmation.data;
            _saveManifestWithResponse(null);
        }
    }
}

function _saveManifestWithResponse(newManifestName) {
    if (newManifestName) {
        // The name came from the user when a manifest was new
        if (_validateManifestName(newManifestName)) {
            _manifest.isNew = false;
            _editorContent.renameNode(_manifest, newManifestName);
            _addToRecentManifests(_manifest);
            _addToRecentManifestTree(_manifest);
        } else {
            AppStore.emitChange();
            return;
        }
    }

    _blockTheApp(false, Config.appBlockDefaultTimeout);

    // TODO think about a server-side solution for this
    _editorContent.beforeSaveHook(_manifest);

    var tempManifest = _.assign({}, _manifest);
    tempManifest.value = _editorContent.generateValue(_manifest);

    AppWebApiUtils.saveManifest(_manifest.id, tempManifest,
        // This is the replacer function to control JSON going to the server.
        function (key, value) {
            switch (key) {
                case "id":
                    return this.type === "manifest" ? value : undefined;
                case "editable":
                case "lockedBy":
                case "hasEdits":
                case "emptyKey":
                case "isNew":
                case "loaded":
                case "original":
                case "parentId":
                    return undefined;
                default:
                    return value;
            }
        },
        function (msg) {
            // will be called on successful save
            _unblockTheApp(true);
            Notify.success(msg);
            _clearEdited();

            // TODO think about a server-side solution for this
            _editorContent.afterSaveHook(_manifest);

            // "data" in this case is a callback function
            if (_fileSaveRequest.data) {
                _fileSaveRequest.data(true);
            }
            _resetFileSaveRequest();
            AppStore.emitChange();
        },
        function (title, msg) {
            // will be called on error save
            _unblockTheApp(true);
            Notify.error(msg.hasOwnProperty('message') ? msg.message : msg);

            // TODO think about a server-side solution for this
            _editorContent.afterSaveHook(_manifest);

            // "data" in this case is a callback function
            if (_fileSaveRequest.data) {
                _fileSaveRequest.data(false);
            }
            _resetFileSaveRequest();
            AppStore.emitChange();
        }
    );
}

// Will be called when user says "Save As..." instead of "Save"
function _saveManifestAs(callback) {
    if (_manifest.isNew) {
        // When the file is new, save as behaves just like save.
        _saveManifest(callback);
    } else {
        // Check if the manifest has any empty keys
        _manifest.emptyKey = _editorContent.findEmptyKey(_manifest);
        if (_manifest.emptyKey) {
            var parentPath = _manifest.emptyKey === "root" ? "at the top level" : "parent is " + _manifest.emptyKey.substring(5);
            _requestConfirmation("Invalid Keys Found",
                "At least one empty key was found. (" + parentPath + ") You can save your work but the content may not have the structure you intended.",
                "Continue?",
                _saveManifestAsConfirmed,
                callback
            )
        } else {
            _userConfirmation.data = callback;
            _saveManifestAsConfirmed(true);
        }
    }
}

function _saveManifestAsConfirmed(answer) {
    if (answer) {
        _requestFileSaveRequest("Document name needed",
            "Locate and name your new document.",
            "Enter Name",
            "Copy all content into the new document instead of sharing content.",
            _recentManifestTree,
            _saveManifestAsWithResponse,
            function (success) {
                // Intercept the normal callback so we can reload the document to pull in up-to-the-minute refs
                if (success) {
                    _selectManifest(_manifest.id);
                }
                if (_userConfirmation.data) {
                    _userConfirmation.data(success);
                }
            }
        )
    }
}

function _saveManifestAsWithResponse(newManifestName, makeClone) {
    if (!_validateManifestName(newManifestName)) {
        return;
    }
    if (makeClone) {
        _editorContent.dereferenceNode(_manifest, true);
    }
    _saveManifestWithResponse(newManifestName);
}

function _validateManifestName(name) {
    if (name) {
        name = name.trim();
    }
    if (name && name.length > 0) {
        var regex = /^[a-z0-9.]+$/i
        if (!regex.test(name)) {
            _fileSaveRequest.validationMessage = "Names can contain only letters, numbers, and \'.\'";
        } else {
            var exists = false;
            for (var i = 0; i < _recentManifests.length; ++i) {
                if (_recentManifests[i].id === name) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                _fileSaveRequest.validationMessage = "This manifest already exists. Choose a different name.";
            } else {
                return true;
            }
        }
    } else {
        _fileSaveRequest.validationMessage = "The document name is required";
    }
    return false;
}

function _removeNew(node) {
    if (node.isNew) {
        delete node.editable;
    }
    delete node.isNew;
}

// Close the current document and reset the store to leave a blank screen.
function _closeManifest() {
    if (_manifest && _manifest.hasEdits) {
        // Alert user they are about to lose their changes
        _requestConfirmation("Edits Detected",
            "You have made changes to the current document. Your changes will be lost if you close the document.",
            "Continue?",
            _closeManifestConfirmed
        )
    } else {
        _closeManifestConfirmed(true);
    }
}

function _closeManifestConfirmed(answer) {
    if (answer) {
        _clearManifestCheckoutLock();
        _clearManifest();
        _showWelcome = true;
    }
    _resetConfirmation();
}

function _clearManifestCheckoutLock() {
    if (_manifest) {
        AppWebApiUtils.clearManifestCheckoutLock(_manifest.id,
            function (response) {
                // will be called on success
            },
            function (title, message) {
                // will be called on error
                Notify.error(message || title);
            }
        );
    }
}

function _receiveManifest(serverResponse) {
    var rawManifest = serverResponse.payload;
    rawManifest.type = "manifest";
    rawManifest.key = "root";
    rawManifest.editable = serverResponse.editable;
    rawManifest.lockedBy = serverResponse.lockedBy;
    _currentUser = serverResponse.currentUser;
    AppUtils.setCurrentUser(_currentUser);

    if (!rawManifest.editable) {
        // Alert user the doc is locked.
        _requestConfirmation("Document is Locked",
            "This document is locked by " + rawManifest.lockedBy + " and cannot be edited.",
            "Would you like to open it in read-only mode?",
            _receiveManifestConfirmed,
            rawManifest
        )
    } else {
        _receiveManifestConfirmed(true, rawManifest);
    }
}

function _receiveManifestConfirmed(answer, rawManifest) {
    if (answer) {
        if (rawManifest == undefined) {
            rawManifest = _userConfirmation.data;
        }
        if (_manifest && _manifest.id != rawManifest.id) {
            _clearManifestCheckoutLock();
            _clearManifest();
            AppStore.emitChange();
        }

        _editorContent.initContent(rawManifest);
        _manifest = _editorContent.rootNode;
        _manifest.persistentLock = rawManifest.persistentLock;
        _manifest.persistentLockOwner = rawManifest.persistentLockOwner;
        _manifest.editable = (rawManifest.editable && !rawManifest.persistentLock);
        _manifest.lockedBy = rawManifest.lockedBy;
        _manifest.currentUser = rawManifest.currentUser;
        _showWelcome = false;
        _undoStack.clear();
        AppStore.emitChange();
    }
}

// Must be called when an existing manifest in the editor is being replaced with a new one.
function _clearManifest() {
    _manifest = null;
    _clearEdited();
    _selection.ids.length = 0;
    _clipboard = null;
    _collapsedHash[AppView.EDITOR.value] = {};
    _collapsedHash[AppView.TREE.value] = {};
}

function _initCollapsedHash() {
    var hash = {};
    hash[AppView.EDITOR.value] = {};
    hash[AppView.TREE.value] = {};
    hash[AppView.SEARCH.value] = {};
    return hash;
}

function _saveKey(id, key) {
    var result = _editorContent.findNode(id);
    if (result.key != key) {
        _tagForUndo();
        _markEdited();
        result.key = key;
    }
}

function _dumpSelection() {
    return JSON.stringify(_selection, function (key, value) {
        if (key === "type") {
            return value ? "SEARCH" : "EDITOR";
        } else {
            return value;
        }
    }, 2);
}

function _dumpManifest() {
    return _editorContent.dumpValue(_manifest);
}

function _markEdited() {
    _manifest.hasEdits = true;
}

function _clearEdited() {
    if (_manifest) {
        _manifest.hasEdits = false;
    }
}

function _saveTableColumnKey(tableId, colId, colIndex, key) {
    _tagForUndo();
    _markEdited();
    var table = _editorContent.findContentById(tableId);
    for (var i = 0; i < table.value.length; i++) {
        var row = _editorContent.findContentById(table.value[i].id);
        var col = row.value[colIndex];
        col.key = key;
    }
    AppStore.emitChange();
}

function _savePropValue(id, propValue) {
    var result = _editorContent.findContentById(id);
    if (result.value != propValue) {
        _tagForUndo();
        _markEdited();
        result.value = propValue;
    }
}

function _moveUp(id) {
    _tagForUndo();
    _editorContent.moveUp(id);
    _markEdited();
}

function _moveDown(id) {
    _tagForUndo();
    _editorContent.moveDown(id);
    _markEdited();
}

function _moveLeft(tableId, colIndex) {
    _tagForUndo();
    _editorContent.moveLeft(tableId, colIndex);
    _markEdited();
}

function _moveRight(tableId, colIndex) {
    _tagForUndo();
    _editorContent.moveRight(tableId, colIndex);
    _markEdited();
}

function _moveSelectedUp() {
    if (_selection.ids.length > 0) {
        _moveUp(_selection.ids[0]);
    }
}

function _moveSelectedDown() {
    if (_selection.ids.length > 0) {
        _moveDown(_selection.ids[0]);
    }
}

function _moveSelectedLeft() {
    if (_selection.ids.length > 0) {
        _moveLeft(_selection.ids[0]);
    }
}

function _moveSelectedRight() {
    if (_selection.ids.length > 0) {
        _moveRight(_selection.ids[0]);
    }
}

function _addCategory(parentId, view) {
    _tagForUndo();
    var newId = _editorContent.addContent(parentId, "category");
    _newestNodeId = newId;
    _markEdited();

    // Force component to expand when you add to it
    _collapsedHash[view.value][parentId] = false;
    return newId;
}

function _addProps2d(parentId, numRows, numCols, view) {
    _tagForUndo();
    var newId = _editorContent.addContent(parentId, "props2d");
    _newestNodeId = newId;
    for (var i = 0; i < (numRows || 0); ++i) {
        _addProps(newId, numCols || 0, false, view);
    }
    _markEdited();

    // Force component to expand when you add to it
    _collapsedHash[view.value][parentId] = false;
    return newId;
}

function _addProps(parentId, numProp, standAlone, view) {
    if (standAlone) {
        _tagForUndo();
    }
    var newId = _editorContent.addContent(parentId, "props");
    if (standAlone) {
        _newestNodeId = newId;
    }
    for (var i = 0; i < (numProp || 0); ++i) {
        _addProp(newId, false, view);
    }
    _markEdited();

    // Force component to expand when you add to it
    _collapsedHash[view.value][parentId] = false;
    return newId;
}

function _addProp(parentId, standAlone, view) {
    if (standAlone) {
        _tagForUndo();
    }
    var newId = _editorContent.addContent(parentId, "prop");
    if (standAlone) {
        _newestNodeId = newId;
    }
    _markEdited();

    // Force component to expand when you add to it
    _collapsedHash[view.value][parentId] = false;
    return newId;
}

function _addTableRow(parentId, view) {
    _tagForUndo();
    var rowId = _editorContent.addContent(parentId, "row");
    _newestNodeId = rowId;
    _markEdited();

    // Force component to expand when you add to it
    _collapsedHash[view.value][parentId] = false;
    return rowId;
}

function _addTableColumn(parentId, view) {
    _tagForUndo();
    var colId = _editorContent.addContent(parentId, "col");
    _newestNodeId = colId;

    // Force component to expand when you add to it
    _collapsedHash[view.value][parentId] = false;
    _markEdited();
}

function _addTag(id, tag) {
    var node = _editorContent.findNode(id);
    if (!node.tags) {
        node.tags = [];
    }
    if (!AppUtils.contains(node.tags, tag)) {
        node.tags.push(tag);
        if (!AppUtils.contains(_tagCache, tag)) {
            _tagCache.push(tag);
            _tagCache.sort();
        }
    }
}

function _addDoctreeFolder(parentNode, callback) {
    AppUtils.addTreeFolder(parentNode, callback);
}

function _removeDoctreeFolder(node, callback) {
    AppUtils.removeTreeNode(node, callback);
}

function _removeTag(id, tag) {
    var node = _editorContent.findNode(id);
    if (node.tags) {
        var index = node.tags.indexOf(tag);
        if (index != -1) {
            node.tags.splice(index, 1);
        }
        if (node.tags.length === 0) {
            delete node.tags;
        }
    }
}

function _remove(id) {
    if (_editorContent.isRemovable(id)) {
        _tagForUndo();
        // Alert user this is destructive
        _requestConfirmation("Delete Content",
            "This will delete the selected content and all child content.",
            "Do you really want to do this?",
            _removeConfirmed,
            id
        )
    }
}

function _removeConfirmed(answer) {
    if (answer) {
        var id = _userConfirmation.data;
        var child = _editorContent.findNode(id);
        if (_editorContent.removeFromParent(child)) {
            _markEdited();
        }
    }
}

function _removeTableColumn(tableId, colIndex) {
    _tagForUndo();
    // Alert user this is destructive
    _requestConfirmation("Delete Column",
        "This will delete this column from all rows.",
        "Do you really want to do this?",
        _removeTableColumnConfirmed,
        {
            tableId: tableId,
            colIndex: colIndex
        }
    )
}

function _removeTableColumnConfirmed(answer) {
    if (answer) {
        var ids = _userConfirmation.data;
        var table = _editorContent.findContentById(ids.tableId);
        var colIndex = ids.colIndex;
        for (var i = 0; i < table.value.length; i++) {
            var row = _editorContent.findContentById(table.value[i].id);
            var col = row.value[colIndex];
            _editorContent.removeFromParent(col);
        }
        _markEdited();
    }
}

function _removeMultiple(ids) {
    _tagForUndo();
    // Alert user this is destructive
    _requestConfirmation("Delete Content",
        "This will delete the selected content and all child content.",
        "Do you really want to do this?",
        _removeMultipleConfirmed,
        ids
    )
}

function _removeMultipleConfirmed(answer) {
    if (answer) {
        var ids = _userConfirmation.data.slice(0);
        ids.map(function (id) {
            var node = _editorContent.findNode(id);
            if (node.type != "manifest") {
                // Can't delete the manifest but it might be selected
                _userConfirmation.data = id;
                _removeConfirmed(true);
            }
        });
    }
}

function _removeSelected() {
    _tagForUndo();
    // Alert user this is destructive
    _requestConfirmation("Delete Content",
        "This will delete the selected content and all child content.",
        "Do you really want to do this?",
        _removeSelectedConfirmed,
        _selection.ids
    )
}

function _removeSelectedConfirmed(answer) {
    if (answer) {
        _removeMultipleConfirmed(true);
    }
}

function _cutSelectedComponent() {
    if (_selection.ids.length == 1) {
        _tagForUndo();
        // prevent cutting the whole manifest
        if (_selection.ids[0] != _manifest.id) {
            var node = _editorContent.findNode(_selection.ids[0]);
            _copyToClipboard(node, true);
            _editorContent.removeFromParent(node);
            _markEdited();
        }
    }
}

// Will be called after the server returns child content
function _paste(options, child) {
    var newId = _editorContent.pasteFromServer(options, child);
    _newestNodeId = newId;
}

function _pasteIntoSelectedComponent() {
    if (_selection.ids.length == 1 && _clipboard) {
        var parent = _editorContent.findNode(_selection.ids[0]);
        if (parent && _isPasteValid(parent.type, _clipboard.type)) {
            _tagForUndo();
            _markEdited();
            if (_clipboard.local) {
                // This was cut from the local document
                var child = _editorContent.findNode(_clipboard.id);
                var existingChild = _editorContent.findNodeByGuid(_clipboard.cguid);
                if (existingChild) {
                    if (_getPasteStyle(true) == 'clone') {
                        child = _editorContent.cloneNodeAndContent(child, true, true);
                        child.key = "";
                    } else {
                        child = _editorContent.cloneNode(child);
                        child.key = "";
                    }
                }
                _editorContent.addToParent(parent.id, child);
                _newestNodeId = child.id;
                //_editorContent.dumpNodeMap();
                //_editorContent.dumpContentMap();
            } else {
                // Not local. Add dummy component with spinner in it, then call server to get the content
                var childId = _editorContent.addContent(_selection.ids[0], _clipboard.type);
                var child = _editorContent.findNode(childId);
                child.pending = true;

                // Call the server for child content by GUID.
                AppWebApiUtils.getComponent({
                        containerId: _selection.ids[0],
                        targetId: _clipboard.cguid,
                        targetType: _clipboard.type,
                        targetKey: _clipboard.key,
                        placeholderId: childId
                    },
                    function (statusCode, title, message) {
                        // will be called on server error
                        Notify.error(message || title);
                        AppStore.emitChange();
                    });
            }
        }
    }
}

function _getPasteStyle(local) {
    var pasteStyle = Config.pasteStyle;
    if (!pasteStyle || pasteStyle === 'default') {
        pasteStyle = local ? "clone" : "ref";
    }
    return pasteStyle;
}

function _copyComponent(id) {
    if (id) {
        // This was copied from search results
        var node = _searchContent.findNode(id);
        _copyToClipboard(node, false);
    } else {
        // This is being copied from the local manifest
        id = _selection.ids[0];
        if (id != _manifest.id) {
            var node = _editorContent.findNode(id);
            _copyToClipboard(node, true);
        }
    }
}

function _copyToClipboard(node, local) {
    _clipboard = {};
    _clipboard.id = node.id;
    _clipboard.key = node.key;
    _clipboard.type = node.type;
    _clipboard.cguid = node.cguid;
    _clipboard.local = local;
}

function _copyFromClipboard() {
    var node = {};
    node.id = _clipboard.id;
    node.key = _clipboard.key;
    node.type = _clipboard.type;
    node.cguid = _clipboard.cguid;
    node.local = _clipboard.local;
    return node;
}

function _isPasteValid(parentType, childType) {
    switch (parentType) {
        case "manifest":
            return true;
        case "category":
            return true;
        case "props":
            return childType == "prop";
        case "props2d":
            return false;
        case "prop":
            return false;
    }
}

function _requestSharedEdit(id) {
    var node = _editorContent.findNode(id);
    if (node.refs && node.refs.length > 1) {
        _requestConfirmation("Shared Content",
            "This content is being used by other documents. Editing it will affect all of these documents.",
            "Continue?",
            _requestSharedEditConfirmed,
            id
        );
    } else {
        _userConfirmation.data = id;
        _requestSharedEditConfirmed(true)
    }
}

function _requestSharedEditConfirmed(answer) {
    if (answer) {
        // Check if this content is locked by another user
        var node = _editorContent.findNode(_userConfirmation.data);
        if (!node.hasOwnProperty("lock")) {
            _isLockedByOther(node.id, node.type,
                function (lock) {
                    _unblockTheApp(true);
                    if (lock && lock.owner != _currentUser) {
                        Notify.error("This content is locked by " + lock.owner + " and cannot be edited.");
                        _editorContent.lockContent(node, lock.owner);
                    } else {
                        node.editable = true;
                    }
                    AppStore.emitChange();
                });
        } else {
            node.editable = true;
        }
    }
}

function _extendComponent(id) {
    var node = _editorContent.findNode(id);
    if (node && node.hasOwnProperty("refs") && !node.hasOwnProperty("extends")) {
        _requestConfirmation("Extend this Component?",
            "You are creating new content which will contain all of the existing content plus any additions, exclusions, or overrides you make.",
            "Is this what you want to do?",
            _extendComponentConfirmed,
            id
        );
    }
}

function _extendComponentConfirmed(answer) {
    if (answer) {
        _tagForUndo();
        var node = _editorContent.findNode(_userConfirmation.data);
        _editorContent.extend(node);
        _markEdited();
    }
}

function _requestNonExclusiveLock(id) {
    var node = _editorContent.findNode(id);
    if (node) {
        _requestContentLockRequest("Exclusive Lock Failed",
            "The lock operation failed because some child content is already locked by a different user. If you choose to, you can lock only unlocked content. This will not affect the locks held by other users.",
            "Continue?",
            AppActions.lockContent,
            id
        );
    }
}

function _requestNonExclusiveUnlock(id) {
    var node = _editorContent.findNode(id);
    if (node) {
        _requestContentLockRequest("Exclusive Unlock Failed",
            "The unlock operation failed because some child content is locked by a different user. If you choose to, you can unlock only your content. This will not affect the locks held by other users.",
            "Continue?",
            AppActions.unlockContent,
            id
        );
    }
}

function _lockContent(id, exclusive) {
    _resetContentLockRequest();
    var node = _editorContent.findNode(id);
    if (node) {
        _blockTheApp(false, Config.appBlockDefaultTimeout);
        AppWebApiUtils.lockContent(node.type === "manifest" ? node.id : node.cguid, node.type, exclusive,
            function (response) {
                // will be called on success
                _editorContent.lockContent(node, _currentUser);
                Notify.success("Content locked successfully.");
                _unblockTheApp(true);
            },
            function (statusCode, title, message) {
                // will be called on error
                _unblockTheApp(true);
                if (statusCode === 403) {
                    _requestNonExclusiveLock(id);
                    AppStore.emitChange();
                } else {
                    Notify.error(message || title);
                }
            }
        );
    }
}

function _unlockContent(id, exclusive) {
    _resetContentLockRequest();
    var node = _editorContent.findNode(id);
    if (node) {
        _blockTheApp(false, Config.appBlockDefaultTimeout);
        AppWebApiUtils.unlockContent(node.type === "manifest" ? node.id : node.cguid, node.type, exclusive,
            function (response) {
                // will be called on success
                _editorContent.unlockContent(node, _currentUser);
                Notify.success("Content unlocked successfully.");
                _unblockTheApp(true);
            },
            function (statusCode, title, message) {
                // will be called on error
                _unblockTheApp(true);
                if (statusCode === 403) {
                    _requestNonExclusiveUnlock(id);
                    AppStore.emitChange();
                } else {
                    Notify.error(message || title);
                }
            }
        );
    }
}

function _isLockedByOther(id, type, callback) {
    var node = _editorContent.findNode(id);
    if (node) {
        _blockTheApp(true, 10);
        AppWebApiUtils.isContentLocked(node.cguid, type,
            function (lock) {
                if (lock && lock.hasOwnProperty("owner")) {
                    callback(lock);
                } else {
                    callback(null);
                }
            },
            function (title, msg) {
                _unblockTheApp(true);
                Notify.error(msg || title);
            });
    }
}

function _override(id) {
    _tagForUndo();
    _editorContent.override(id);
    _markEdited();
}

function _removeOverride(id) {
    _tagForUndo();
    _editorContent.removeOverride(id);
    _markEdited();
}

function _includeOrExcludeChildren(parentId, children, includeFlag) {
    _tagForUndo();
    _editorContent.includeOrExcludeChildren(parentId, children, includeFlag);
    _markEdited();
}

// The user has requested referenced content to be copied locally into the manifest.
// Confirm that they really want to do this.
function _dereferenceContent(id) {
    _requestConfirmation("Copy Content Locally",
        "This will copy the shared content into your document. Any changes you make will be local, and will not be seen in other manifests.",
        "Is this what you want to do?",
        _dereferenceContentConfirmed,
        id
    )
}

function _dereferenceContentConfirmed(answer, id) {
    if (answer) {
        _tagForUndo();
        id = id || _userConfirmation.data;
        var node = _editorContent.findNode(id);
        if (node.type == 'category') {
            var content = _editorContent.findContentByNode(node);
            if (content.value.length > 0) {
                _requestConfirmation("Copy Child Content?",
                    "",
                    "Do you also want to copy this category's children into your document?",
                    _dereferenceChildContentConfirmed,
                    node.id
                )
                _userConfirmation.keepContent = true;
            }
        } else {
            _editorContent.dereferenceNode(node, true);
            _markEdited();
        }
    }
}

// The user has confirmed they want the node content copied locally into the manifest.
// This is the user's answer to "do you also want all the children copied locally?"
function _dereferenceChildContentConfirmed(answer, id) {
    id = id || _userConfirmation.data;
    var node = _editorContent.findNode(id);
    _editorContent.dereferenceNode(node, answer);
    _userConfirmation.keepContent = false;
    _markEdited();
}

function _doContentSearch(query, matchCase, page, pageSize, collapsed) {
    AppWebApiUtils.searchContent(query,
        function (response) {
            // will be called on successful search
            if (response.found > 0) {
                if (page == 1) {
                    _searchContent = new ContentStore();
                    _searchContent.initContent({
                        id: "search.results",
                        type: "manifest",
                        key: "root",
                        value: response.results,
                        found: response.found,
                        query: response.query,
                        pageSize: response.pageSize,
                        page: response.page
                    });
                } else {
                    _searchContent.appendContent(_searchContent.rootNode, {
                        type: "manifest",
                        value: response.results
                    });
                    _searchContent.rootNode.page = response.page;
                }
            } else {
                _searchContent = new ContentStore();
                _searchContent.initContent({
                    id: "search.results",
                    type: "manifest",
                    key: "root",
                    value: [],
                    found: response.found,
                    query: response.query,
                    pageSize: response.pageSize,
                    page: response.page
                });
            }
            _collapseAll(AppView.SEARCH, _searchContent, collapsed);
            AppStore.emitChange();
        },
        function (title, response) {
            // will be called on error search
            Notify.error(response.statusText || title);
            AppStore.emitChange();
        },
        // Case sensitive
        matchCase,
        // Starting page
        page,
        // Page Size
        pageSize
    );
}

function _collapseAll(view, content, collapsed) {
    if (content && content.rootNode) {
        _collapsedHash[view.value] = {};
        var value = content.findContent(content.rootNode.cguid).value;
        value.forEach(function (node) {
            _collapsedHash[view.value][node.id] = collapsed;
        });
    }
}

function _initTagCache() {
    _resetTagCache();
    AppActions.startTiming("Get all tags", true);
    AppWebApiUtils.getAllTags(
        function (response) {
            _tagCache = response;
            AppActions.endTiming("Get all tags", true);
        },
        function (title, response) {
            // will be called on error search
            Notify.error(response.statusText || title);
            AppStore.emitChange();
        });
}

function _resetTagCache() {
    if (_tagCache) {
        _tagCache.length = 0;
    }
    _tagCache = [];
}

function _requestRecentManifests() {
    AppActions.startTiming("Manifest List", true);
    AppWebApiUtils.getRecentManifests(
        function (title, msg) {
            Notify.error("Could not retrieve list of documents. Please try again later.");
            AppStore.emitChange();
        }
    );
}

function _receiveRecentManifests(list) {
    if (list && list.length) {
        AppActions.endTiming("Manifest List", true);

        list.sort();

        _recentManifestTree = AppUtils.treeify(list);
        _recentManifests = list.map(function (fileName) {
            return {
                id: fileName,
                isNew: false,
                hasEdits: false,
                editable: true,
                lockedBy: ""
            };
        });

        if (Config.defaultManifest) {
            _selectManifest(Config.defaultManifest);
        }
        // Only the first time, wait until the manifest list is returned before fetching tags for typeahead
        if (_tagCache == undefined) {
            _initTagCache();
        }
    }
}

function _addToRecentManifests(manifest) {
    _recentManifests.push(manifest);
    _sortRecentManifests();
}

function _sortRecentManifests() {
    _recentManifests.sort(function (m1, m2) {
        var n1 = m1.id;
        var n2 = m2.id;
        return n1.localeCompare(n2);
    });
}

function _addToRecentManifestTree(manifest) {
    AppUtils.addToTree(_recentManifestTree, manifest.id);
}

function _openManifest() {
    if (_manifest && _manifest.hasEdits) {
        // Alert user they are about to lose their changes
        _requestConfirmation("Edits Detected",
            "You have made changes to the current document. Your changes will be lost if you select another document.",
            "Continue?",
            _openManifestConfirmed
        )
    } else {
        _openManifestConfirmed(true);
    }
}

function _openManifestConfirmed(answer) {
    if (answer) {
        _requestFileOpenRequest();
    }
}

function _selectManifest(name) {
    var selectedManifest;
    if (_recentManifests && _recentManifests.length) {
        for (var i = 0; i < _recentManifests.length; ++i) {
            if (_recentManifests[i].id === name) {
                selectedManifest = _recentManifests[i];
                break;
            }
        }
        _manifestLoading = true;
        AppActions.startTiming("Load manifest", true, "Load manifest " + selectedManifest.id);
        AppWebApiUtils.getManifest(selectedManifest.id,
            function () {
                _manifestLoading = false;
                _resetFileOpenRequest();
                AppStore.emitChange();
            },
            function (title, msg) {
                _manifestLoading = false;
                _resetFileOpenRequest();
                Notify.error('Could not retrieve document. Please try again later.');
                AppStore.emitChange();
            }
        );
    }
}

function _createNewManifest() {
    if (_manifest && _manifest.hasEdits) {
        // Alert user they are about to lose their changes
        _requestConfirmation("Edits Detected",
            "You have made changes to the current document. Your changes will be lost if you create a new document.",
            "Continue?",
            _createNewManifestConfirmed
        )
    } else {
        _createNewManifestConfirmed(true);
    }
}

function _createNewManifestConfirmed(answer) {
    if (answer) {
        var newManifest = {
            id: "Untitled",
            isNew: true,
            hasEdits: false,
            editable: true,
            value: [],
            currentUser: _currentUser
        }
        _receiveManifest({
            payload: newManifest,
            editable: true,
            lockedBy: ""
        });
    }
    _resetConfirmation();
}

function _getSelectionType(id) {
    var node = _editorContent.findNode(id);
    return node == null ? SELECTION_TYPE.SEARCH : SELECTION_TYPE.EDITOR;
}

function _selectComponent(id, ctrl, shift) {
    if (shift) {
        // Select a range
        _selectRange(id);
    } else if (ctrl) {
        // Extend the selection by one
        _toggleSelection(id);
    } else {
        // Just select one
        _selectSingleComponent(id);
    }
}

function _selectSingleComponent(id) {
    _selection.type = _getSelectionType(id);
    _selection.ids.length = 0;
    _selection.ids.push(id);
}

function _toggleSelection(id) {
    if (_selection.ids.length > 0) {
        if (_selection.type != _getSelectionType(id)) {
            // Business rule: can't select from both the drawer and the editor at the same time
            return;
        }
        // If you are CTRL-clicking on a component that is already selected, unselect it
        for (var i = 0; i < _selection.ids.length; ++i) {
            if (_selection.ids[i] === id) {
                _selection.ids.splice(i, 1);
                return;
            }
        }
        // You can only extend a selection among siblings
        if (_editorContent.allSiblings(_selection.ids) && _editorContent.isSibling(_selection.ids[0], id)) {
            _selection.ids.push(id);
        } else {
            _selectSingleComponent(id);
        }
    } else {
        _selectSingleComponent(id);
    }
}

// This is SHIFT-Click where there is already one sibling selected.
function _selectRange(id) {
    if (_selection.ids.length > 0) {
        if (_selection.type != _getSelectionType(id)) {
            // Business rule: can't select from both the drawer and the editor at the same time
            return;
        } else {
            // Currently we only allow select-range for component siblings.
            // So check for that before pushing onto the array.
            if (_editorContent.allSiblings(_selection.ids) && _editorContent.isSibling(_selection.ids[0], id)) {
                var parent = _editorContent.findParentNode(id);
                // 1. get indexes of all selected comp's including the new one
                _selection.ids.push(id);
                var indexes = _selection.ids.map(function (nodeid) {
                    return _editorContent.findIndex(parent.id, nodeid);
                });

                // 2. sort the indexes
                indexes.sort();

                // 3. clear selected components array
                _selection.ids.length = 0;

                // 4. select whole range, inclusive
                var parentContent = _editorContent.findContentByNode(parent);
                for (var i = indexes[0]; i <= indexes[indexes.length - 1]; ++i) {
                    var idInRange = parentContent.value[i].id;
                    if (_editorContent.isRemovable(idInRange)) {
                        _selection.ids.push(idInRange);
                    }
                }
            }
        }
    } else {
        _selectSingleComponent(id);
    }
}

function _showAboutMessage() {
    _requestInfoMessage("About Content Cloud",
        "Version: " + Config.version,
        "Build: " + Config.build,
        Config.copyright,
        "info"
    )
}

function _getStoreSnapshot() {
    return ({
        content: _editorContent.createSnapshot(),
        collapsedHash: _.clone(_collapsedHash),
        selection: _.clone(_selection)
    });
}

function _tagForUndo() {
    if (_undoStack.maxSize > 0) {
        var store = _getStoreSnapshot();
        _undoStack.push(store);
        _redoStack.clear();
    }
}

function _restoreFromUndo(store) {
    _editorContent.restoreFromSnapshot(store.content);
    _collapsedHash = store.collapsedHash;
    _selection = store.selection;
    _clipboard = null;
}

function _undo() {
    if (!_undoStack.isEmpty()) {
        AppActions.startTiming("Undo", true);
        _undoInProgress = true;
        var store = _getStoreSnapshot();
        _redoStack.push(store);
        store = _undoStack.pop();
        _restoreFromUndo(store);
    }
}

// Allow user to undo previous undo
function _redo() {
    if (!_redoStack.isEmpty()) {
        _undoInProgress = true;
        var store = _getStoreSnapshot();
        _undoStack.push(store);
        store = _redoStack.pop();
        _restoreFromUndo(store);
    }
}

function _arrowKeyUp(id) {
    var node = _editorContent.findNode(id);
    if (node) {
        switch (node.type) {
            case "prop":
                break;
        }
    }
}

function _requestConfirmation(heading, description, question, answerFunction, data) {
    _userConfirmation = {
        showModal: true,
        heading: heading,
        description: description,
        question: question,
        answerFunction: answerFunction,
        data: data
    }
    if (Config.alwaysConfirm) {
        _userConfirmation.showModal = false;
        _userConfirmation.answerFunction(true);
    } else if (Config.alwaysDeny) {
        _userConfirmation.showModal = false;
        _userConfirmation.answerFunction(false);
    }
}

function _resetConfirmation() {
    _userConfirmation = {
        showModal: false,
        heading: null,
        description: null,
        question: null,
        answerFunction: null,
        data: null
    }
}

function _requestInputRequest(heading, prompt, placeholder, booleanPrompt, answerFunction, data) {
    _userInputRequest = {
        showModal: true,
        heading: heading,
        prompt: prompt,
        placeholder: placeholder,
        booleanPrompt: booleanPrompt,
        answerFunction: answerFunction,
        data: data,
        validationMessage: ""
    }
}

function _resetInputRequest() {
    _userInputRequest = {
        showModal: false,
        heading: null,
        prompt: null,
        placeholder: null,
        booleanPrompt: null,
        answerFunction: null,
        data: null,
        validationMessage: null
    }
}

function _requestFileSaveRequest(heading, prompt, placeholder, booleanPrompt, manifestTree, answerFunction, data) {
    _fileSaveRequest = {
        showModal: true,
        heading: heading,
        prompt: prompt,
        placeholder: placeholder,
        booleanPrompt: booleanPrompt,
        manifestTree: manifestTree,
        answerFunction: answerFunction,
        data: data,
        validationMessage: ""
    }
}

function _resetFileSaveRequest() {
    _fileSaveRequest = {
        showModal: false,
        heading: null,
        prompt: null,
        placeholder: null,
        booleanPrompt: null,
        manifestTree: null,
        answerFunction: null,
        data: null,
        validationMessage: null
    }
}

function _requestContentLockRequest(heading, prompt, question, onContinue, id) {
    _contentLockRequest = {
        showModal: true,
        heading: heading,
        prompt: prompt,
        question: question,
        onContinue: onContinue,
        id: id
    }
}

function _resetContentLockRequest() {
    _contentLockRequest = {
        showModal: false,
        heading: null,
        prompt: null,
        question: null,
        onContinue: null,
        id: null
    }
}

function _requestInfoMessage(heading, message1, message2, message3, type) {
    _userInfoMessage = {
        showModal: true,
        heading: heading,
        message1: message1,
        message2: message2,
        message3: message3,
        messageType: type
    }
}

function _resetInfoMessage() {
    _userInfoMessage = {
        showModal: false,
        heading: null,
        message1: null,
        message2: null,
        messageType: null
    }
}

function _requestFileOpenRequest() {
    _fileOpenRequest = {
        showModal: true
    }
}

function _resetFileOpenRequest() {
    _fileOpenRequest = {
        showModal: false
    }
}

function _requestManageExtensionRequest(node) {
    var copy = _.cloneDeep(node);
    _manageExtendsRequest = {
        node: copy,
        showModal: true
    }
}

function _resetManageExtensionRequest() {
    _manageExtendsRequest = {
        node: null,
        showModal: false
    }
}

function _requestAppBlockRequest() {
    _appBlockRequest = {
        showModal: true
    }
}

function _resetAppBlockRequest() {
    _appBlockRequest = {
        showModal: false
    }
}

function _blockTheApp(emitEvent, timeout) {
    if (Config.useAppBlock) {
        $(window).bind('keydown', function (event) {
            // ESC will break you out of the spinner
            if (event.which == AppKeys.ESCAPE) {
                event.preventDefault();
                _unblockTheApp(true);
            }
        });
        _requestAppBlockRequest();
        if (emitEvent) {
            // Force a re-render
            AppStore.emitChange();
        }
        setTimeout(function () {
            if (_appBlockRequest.showModal === true) {
                Notify.error("This operation is taking longer than expected. Please contact customer service.");
                _unblockTheApp(true);
            }
        }, timeout * 1000);
    }
}

function _unblockTheApp(emitEvent) {
    if (Config.useAppBlock) {
        _resetAppBlockRequest();
        $(window).unbind('keydown');
        if (emitEvent) {
            // Force a re-render
            AppStore.emitChange();
        }
    }
}

function _exportManifest(manifestId, baseLang, targetLang) {
    var url = AppWebApiUtils.getExportTranslationUrl(manifestId, baseLang, targetLang);
    console.log('Exporter URL: ' + url);
    window.location = url;
}

function _importManifest(file, lang) {
    _blockTheApp(true, Config.appBlockDefaultTimeout);
    AppWebApiUtils.importManifest(file, lang,
        function () {
            _unblockTheApp(false);
            _contentImportMessage.serverResponseMessage = "Content imported successfully";
            AppStore.emitChange();
        },
        function (title, message) {
            _unblockTheApp(false);
            _contentImportMessage.serverResponseMessage = message || title;
            AppStore.emitChange();
        }
    );
}

var AppStore = _.extend(EventEmitter.prototype, {
    emitChange: function () {
        this.emit(CHANGE_EVENT)
    },

    addChangeListener: function (callback) {
        this.on(CHANGE_EVENT, callback)
    },

    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback)
    },

    dumpManifest: function () {
        return _dumpManifest();
    },

    dumpKeyToIdHash: function () {
        return _editorContent.dumpKeyToIdHash();
    },

    dumpIdToKeyHash: function () {
        return _editorContent.dumpIdToKeyHash();
    },

    dumpIdToNodeHash: function () {
        return _editorContent.dumpIdToNodeHash();
    },

    dumpGuidToContentHash: function () {
        return _editorContent.dumpGuidToContentHash();
    },

    dumpCollapsedHash: function () {
        var dump = "EDITOR:\n";
        dump += JSON.stringify(_collapsedHash[0], null, 2);
        dump += "\nSEARCH:\n";
        dump += JSON.stringify(_collapsedHash[3], null, 2);
        dump += "\nTREE:\n";
        dump += JSON.stringify(_collapsedHash[1], null, 2);
        return dump;
    },

    dumpSelection: function () {
        return _dumpSelection();
    },

    getManifest: function () {
        return _manifest;
    },

    getGeneratedManifest: function () {
        var tempManifest = _.assign({}, _manifest);
        tempManifest.value = _editorContent.generateValue(_manifest);
        return tempManifest;
    },

    getEditorContent: function () {
        return _editorContent;
    },

    // Return the value for the given node
    getNodeValue: function (node) {
        return _editorContent.getNodeValue(node);
    },

    getSearchContent: function () {
        return _searchContent;
    },

    getUndoStack: function () {
        return _undoStack;
    },

    getRedoStack: function () {
        return _redoStack;
    },

    isSelected: function (id) {
        return AppUtils.contains(_selection.ids, id);
    },

    isMultiSelect: function () {
        return _selection.ids.length > 1;
    },

    areSiblingsSelected: function () {
        return _editorContent.allSiblings(_selection.ids);
    },

    getSelectedComponents: function () {
        return _selection.ids;
    },

    getUserConfirmation: function () {
        return _userConfirmation;
    },

    getUserInputRequest: function () {
        return _userInputRequest;
    },

    getFileSaveRequest: function () {
        return _fileSaveRequest;
    },

    getContentLockRequest: function () {
        return _contentLockRequest;
    },

    getFileOpenRequest: function () {
        return _fileOpenRequest;
    },

    getManageExtendsRequest: function () {
        return _manageExtendsRequest;
    },

    getContentImportMessage: function () {
        return _contentImportMessage;
    },

    clearContentImportMessage: function () {
        _contentImportMessage = {};
    },

    getAppBlockRequest: function () {
        return _appBlockRequest;
    },

    getUserInfoMessage: function () {
        return _userInfoMessage;
    },

    getRecentManifests: function () {
        return _recentManifests;
    },

    getManifestTree: function () {
        return _recentManifestTree;
    },

    getCollapsedState: function (view, id, type) {
        var collapsed = _collapsedHash[view.value][id];
        if (collapsed == undefined && view == AppView.TREE) {
            collapsed = _collapseDefaults[type];
            this.setCollapsedState(view, id, collapsed);
        }
        return collapsed;
    },

    setCollapsedState: function (view, id, collapsed) {
        _collapsedHash[view.value][id] = collapsed;
    },

    getContentSearchResults: function () {
        return _contentSearchResults;
    },

    getAllTags: function () {
        return _tagCache;
    },

    getNewestNodeId: function () {
        return _newestNodeId;
    },

    setNewestNodeId: function (id) {
        _newestNodeId = id;
    },

    isNewestNodeId: function (id) {
        return _newestNodeId === id;
    },

    isUndoInProgress: function () {
        return _undoInProgress;
    },

    isManifestLoading: function () {
        return _manifestLoading;
    },

    showWelcome: function () {
        return _showWelcome;
    },

    setUndoInProgress: function (state) {
        _undoInProgress = state;
    },

    getClipboard: function () {
        return _clipboard;
    },

    getCurrentUser: function () {
        return _currentUser;
    },

    isClipboardAvailable: function () {
        return _selection.ids.length > 1 || (_selection.ids.length == 1 && _selection.ids[0] != _manifest.cguid);
    },

    isPasteAvailable: function () {
        return _selection.ids.length == 1 && _clipboard
    },

    beforeUnloadApp: function (event) {
        if (_manifest && _manifest.hasEdits && !Config.localhost) {
            event.returnValue = "There are unsaved changes in the current document.";
            return event.returnValue;
        }
    },

    unloadApp: function (event) {
        if (_manifest) {
            AppWebApiUtils.closeManifestBlocked(_manifest.id, function () {
            });
        }
    },

    // Returns an array of model object that are only props.
    // As opposed to 'include' or 'exclude'
    generateTableRows: function (nodeId) {
        return _editorContent.generateTableRows(nodeId);
    },

    // Return an array of model object that are prop from first parent object that is props.
    // As opposed to 'include' or 'exclude'
    generateTableColumns: function (nodeId) {
        return _editorContent.generateTableColumns(nodeId);
    },

    dispatcherIndex: AppDispatcher.register(function (payload) {
        var action = payload.action;
        switch (action.actionType) {
            case AppConstants.RECEIVE_MANIFEST:
                _receiveManifest(action.response);
                break;

            case AppConstants.SAVE_MANIFEST:
                _saveManifest(action.callback);
                break;

            case AppConstants.SAVE_MANIFEST_AS:
                _saveManifestAs(action.callback);
                break;

            case AppConstants.CLOSE_MANIFEST:
                _closeManifest();
                break;

            case AppConstants.CREATE_MANIFEST:
                _createNewManifest();
                break;

            case AppConstants.OPEN_MANIFEST:
                _openManifest();
                break;

            case AppConstants.SAVE_KEY:
                _saveKey(payload.action.id, payload.action.key);
                break;

            case AppConstants.SAVE_TABLE_COLUMN_KEY:
                _saveTableColumnKey(payload.action.id, payload.action.colId, payload.action.colIndex, payload.action.key);
                break;

            case AppConstants.SAVE_PROP_VALUE:
                _savePropValue(payload.action.id, payload.action.propValue);
                break;

            case AppConstants.ADD_CATEGORY:
                _addCategory(payload.action.id, payload.action.view);
                break;

            case AppConstants.ADD_PROP:
                _addProp(payload.action.id, true, payload.action.view);
                break;

            case AppConstants.ADD_PROPS:
                _addProps(payload.action.id, 1, true, payload.action.view);
                break;

            case AppConstants.ADD_PROPS2D:
                _addProps2d(payload.action.id, 1, 1, payload.action.view);
                break;

            case AppConstants.ADD_TABLE_ROW:
                _addTableRow(payload.action.id, payload.action.view);
                break;

            case AppConstants.ADD_TABLE_COLUMN:
                _addTableColumn(payload.action.id, payload.action.view);
                break;

            case AppConstants.REMOVE_TABLE_COLUMN:
                _removeTableColumn(payload.action.tableId, payload.action.colIndex);
                break;

            case AppConstants.ADD_DOCTREE_FOLDER:
                _addDoctreeFolder(payload.action.parentNode, payload.action.callback);
                break;

            case AppConstants.REMOVE_DOCTREE_FOLDER:
                _removeDoctreeFolder(payload.action.node, payload.action.callback);
                break;

            case AppConstants.REMOVE:
                _remove(payload.action.id);
                break;

            case AppConstants.REMOVE_MULTIPLE:
                _removeMultiple(payload.action.ids);
                break;

            case AppConstants.REMOVE_SELECTED:
                _removeSelected();
                break;

            case AppConstants.MOVE_UP:
                _moveUp(payload.action.id);
                break;

            case AppConstants.MOVE_DOWN:
                _moveDown(payload.action.id);
                break;

            case AppConstants.MOVE_SELECTED_UP:
                _moveSelectedUp();
                break;

            case AppConstants.MOVE_SELECTED_DOWN:
                _moveSelectedDown();
                break;

            case AppConstants.MOVE_LEFT:
                _moveLeft(payload.action.tableId, payload.action.colIndex);
                break;

            case AppConstants.MOVE_RIGHT:
                _moveRight(payload.action.tableId, payload.action.colIndex);
                break;

            case AppConstants.MOVE_SELECTED_LEFT:
                _moveSelectedLeft();
                break;

            case AppConstants.MOVE_SELECTED_RIGHT:
                _moveSelectedRight();
                break;

            case AppConstants.SELECT_COMPONENT:
                _selectComponent(payload.action.id, payload.action.ctrl, payload.action.shift);
                break;

            case AppConstants.SELECT_TREE_NODE:
                AppUtils.selectTreeNode(payload.action.node);
                break;

            case AppConstants.ARROW_KEY_UP:
                _arrowKeyUp(payload.action.id);
                break;

            case AppConstants.ARROW_KEY_DOWN:
                _arrowKeyDown(payload.action.id);
                break;

            case AppConstants.CONVERT_TO_CATEGORY:
                _convertToCategory(payload.action.id);
                break;

            case AppConstants.CONVERT_TO_PROPS:
                _convertToProps(payload.action.ids);
                break;

            case AppConstants.CONVERT_TO_PROPS2D:
                _convertToProps2d(payload.action.ids);
                break;

            case AppConstants.UNWRAP_CHILDREN:
                _unwrapChildren(payload.action.id);
                break;

            case AppConstants.CUT_COMPONENT:
                _cutSelectedComponent();
                break;

            case AppConstants.COPY_COMPONENT:
                _copyComponent(payload.action.id);
                break;

            case AppConstants.PASTE_COMPONENT:
                if (payload.action.options) {
                    _paste(payload.action.options, payload.action.child);
                } else {
                    _pasteIntoSelectedComponent();
                }
                break;

            case AppConstants.DEREFERENCE_CONTENT:
                _dereferenceContent(payload.action.id);
                break;

            case AppConstants.REQUEST_RECENT_MANIFESTS:
                _requestRecentManifests();
                break;

            case AppConstants.RECEIVE_RECENT_MANIFESTS:
                _receiveRecentManifests(payload.action.manifestNames);
                break;

            case AppConstants.SELECT_MANIFEST:
                _selectManifest(payload.action.name);
                break;

            case AppConstants.USER_CONFIRMATION:
                _userConfirmation.answerFunction(payload.action.answer);
                if (!_userConfirmation.keepContent) {
                    _resetConfirmation();
                }
                break;

            case AppConstants.USER_INPUT_RESPONSE:
                if (payload.action.textResponse) {
                    _userInputRequest.answerFunction(payload.action.textResponse, payload.action.booleanResponse);
                } else {
                    _resetInputRequest();
                }
                break;

            case AppConstants.FILE_SAVE_RESPONSE:
                if (payload.action.textResponse) {
                    _fileSaveRequest.answerFunction(payload.action.textResponse, payload.action.booleanResponse);
                } else {
                    _resetFileSaveRequest();
                }
                break;

            case AppConstants.USER_MESSAGE_DISMISSED:
                _resetInfoMessage();
                break;

            case AppConstants.USER_FILE_MODAL_CLOSED:
                _resetFileOpenRequest();
                break;

            case AppConstants.USER_MANAGE_EXTENSION_MODAL_OPEN:
                _requestManageExtensionRequest(payload.action.node);
                break;

            case AppConstants.USER_MANAGE_EXTENSION_MODAL_CLOSED:
                _resetManageExtensionRequest();
                break;

            case AppConstants.REQUEST_CONTENT_SEARCH:
                _doContentSearch(payload.action.query, payload.action.matchCase, payload.action.page, payload.action.pageSize, payload.action.collapsed);
                break;

            case AppConstants.COLLAPSE_ALL:
                _collapseAll(payload.action.view, payload.action.content, payload.action.collapsed);
                break;

            case AppConstants.REQUEST_SHARED_EDIT:
                _requestSharedEdit(payload.action.id);
                break;

            case AppConstants.EXTEND:
                _extendComponent(payload.action.id);
                break;

            case AppConstants.UNDO:
                _undo();
                break;

            case AppConstants.REDO:
                _redo();
                break;

            case AppConstants.EXPORT_MANIFEST:
                _exportManifest(payload.action.manifestId, payload.action.baseLang, payload.action.targetLang);
                break;

            case AppConstants.IMPORT_MANIFEST:
                _importManifest(payload.action.file, payload.action.lang);
                break;

            case AppConstants.OVERRIDE:
                _override(payload.action.id);
                break;

            case AppConstants.REMOVE_OVERRIDE:
                _removeOverride(payload.action.id);
                break;

            case AppConstants.INCLUDE_OR_EXCLUDE_CHILDREN:
                _includeOrExcludeChildren(payload.action.parentId, payload.action.children, payload.action.includeFlag ? "include" : "exclude");
                break;

            case AppConstants.ADD_TAG:
                _addTag(payload.action.id, payload.action.tag);
                break;

            case AppConstants.REMOVE_TAG:
                _removeTag(payload.action.id, payload.action.tag);
                break;

            case AppConstants.LOCK_CONTENT:
                _lockContent(payload.action.id, payload.action.exclusive);
                break;

            case AppConstants.UNLOCK_CONTENT:
                _unlockContent(payload.action.id, payload.action.exclusive);
                break;

            case AppConstants.SHOW_ABOUT_MESSAGE:
                _showAboutMessage();
                break;

        }
        AppStore.emitChange();

        return true;
    })
});

// Set to unlimited listeners. This is harmless according to the events.js docs and will silence the console warning.
AppStore.setMaxListeners(0);

module.exports = AppStore;
