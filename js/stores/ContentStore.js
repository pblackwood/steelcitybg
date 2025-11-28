/**
 * Provides isolated storage for editor and search content.
 * Provides an API for manipulating content.
 */
var uuid = require('node-uuid');
var Config = require('../properties/props');
var AppUtils = require('../utils/app-utils');

function _generateId() {
    return 1 * _.uniqueId();
}

function _generateGuid() {
    return uuid.v4();
}

function _assignGuid(node) {
    node.cguid = node.cguid || _generateGuid();
}

function _assignId(node) {
    node.id = node.id || _generateId();
}

function _assignKey(node) {
    node.key = node.key || "";
}

function _assignParent(node, parent) {
    if (parent) {
        node.parentId = parent.id;
    }
}

function _isValueAnArray(obj) {
    return obj.value && obj.value instanceof Array;
}

// Recursively read in every node of an incoming manifest,
// assign node ids, and store in the node map.
function _readNode(element, parent, nodeMap) {
    delete element.langs;
    var node = _createNode(element, parent);
    if (node) {
        nodeMap[node.id] = node;

        // Back-fill the ids into the manifest for speed in the next step
        element.id = node.id;
        element.cguid = node.cguid;

        switch (node.type) {
            case "prop":
                return;
            default:
                for (var i = 0; i < element.value.length; ++i) {
                    _readNode(element.value[i], node, nodeMap);
                }
                break;
        }
    }
}

// Recursively read in every component of an incoming manifest,
// create shallow values, and store in the content map.
function _readContent(element, parent, nodeMap, contentMap) {
    var content = contentMap[element.cguid];
    if (!content) {
        content = _createContent(element, parent);
        if (content) {
            contentMap[content.cguid] = content;
            delete content.cguid;
            switch (element.type) {
                case "prop":
                    return;
                default:
                    element.value.forEach(function (child) {
                        var node = nodeMap[child.id];
                        if (node) {
                            content.value.push(node);
                        }
                        _readContent(child, content, nodeMap, contentMap);
                    });
                    break;
            }
            if (element.hasOwnProperty("extends")) {
                _overrideChildren(content, nodeMap);
                _reorderChildren(content, nodeMap);
                _includeExcludeChildren(content, nodeMap);
            }
        }
    }
}

function Manifest(obj) {
    _.assign(this, obj);
}

function Category(obj) {
    _.assign(this, obj);
}

function Props2d(obj) {
    _.assign(this, obj);
}

function Props(obj) {
    _.assign(this, obj);
}

function Prop(obj) {
    _.assign(this, obj);
}

function Include(obj) {
    _.assign(this, obj);
}

function Exclude(obj) {
    _.assign(this, obj);
}

function _createNode(obj, parent) {
    var node;
    switch (obj.type) {
        case "manifest":
            node = new Manifest(obj);
            break;
        case "category":
            node = new Category(obj);
            break;
        case "props2d":
            node = new Props2d(obj);
            break;
        case "props":
            node = new Props(obj);
            break;
        case "prop":
            node = new Prop(obj);
            break;
        case "include":
        case "exclude":
            return null;
    }
    _assignId(node);
    _assignGuid(node);
    _assignKey(node);
    _assignParent(node, parent);
    delete node.value;
    return node;
}

function _createContent(obj, parent) {
    var content;
    switch (obj.type) {
        case "manifest":
            content = new Manifest(obj);
            content.value = [];
            break;
        case "category":
            content = new Category(obj);
            content.value = [];
            break;
        case "props2d":
            content = new Props2d(obj);
            content.value = [];
            break;
        case "props":
            content = new Props(obj);
            content.value = [];
            break;
        case "prop":
            content = new Prop(obj);
            break;
        case "include":
            parent.includes = parent.includes || [];
            parent.includes.push(obj.key);
            return null;
        case "exclude":
            parent.excludes = parent.excludes || [];
            parent.excludes.push(obj.key);
            return null;
    }
    delete content.key;
    return content;
}

function _removeId(element) {
    delete element.id;
    if (_isValueAnArray(element)) {
        element.value.forEach(function (child) {
            _removeId(child);
        });
    }
}

function _removeExtensionChildren(element) {
    element.value = element.value.filter(function (child) {
        return (child.type != 'include' && child.type != 'exclude' && !child.extension);
    });
}

// Preserve the position of the original child which has been overridden
function _overrideChildren(content, nodeMap) {
    var overrides = content.value.filter(function (child) {
        return child.extension == 'override';
    });
    overrides.forEach(function (override) {
        // Get index of current position of override
        var overrideIndex = _.findIndex(content.value, function (ch) {
            return ch.id == override.id;
        });

        // Get index of current position of original
        var origIndex = _.findIndex(content.value, function (ch) {
            return ch.key == override.key && ch.id != override.id;
        });

        if (origIndex) {
            // Replace original with override
            content.value.splice(origIndex, 1, override);

            // Remove override from parent (this preserves the user's order)
            content.value.splice(overrideIndex, 1);
        }
    });
}

// Reorder so adds show up at the end of the extension
function _reorderChildren(content) {
    var adds = content.value.filter(function (child) {
        return child.extension == 'add';
    });
    adds.forEach(function (add) {
        var index = _.findIndex(content.value, function (ch) {
            return ch.id == add.id;
        });
        content.value.splice(index, 1);
        content.value.push(add);
    });
}

// Preserve the position of the original child which has been included or excluded
function _includeExcludeChildren(content, nodeMap) {
    var arr = content.includes || content.excludes;
    if (arr) {
        var action = content.includes ? "include" : "exclude";
        var list = content.value.filter(function (child) {
            return _.includes(arr, child.key);
        });
        list.forEach(function (child) {
            child.extension = action;
            var node = nodeMap[child.id];
            node.extension = action;
        });
    }
}

function _findNodeByGuidAtNode(root, guid, contentMap) {
    if (root.cguid == guid) {
        return root;
    } else {
        var content = contentMap[root.cguid];
        if (_isValueAnArray(content)) {
            for (var i = 0; i < content.value.length; ++i) {
                var found = _findNodeByGuidAtNode(content.value[i], guid, contentMap);
                if (found) {
                    return found;
                }
            }
        }
    }
    return null;
}

function ContentStore() {

    // A hash table to map nodeid => node.
    this.nodeMap = {};

    // A hash table to map guid => content.
    this.contentMap = {};

    // The root node of the tree, for lookup convenience.
    this.rootNode = null;

    // A hash table to map keypath => nodeid. It's used to check for duplicate keypaths.
    this.keyToIdHash = {};

    // A hash table to map nodeid => keypath. It's used for fast lookup of keypaths.
    this.idToKeyHash = {};

// TODO these should be prototype methods for props2d
//this.addRow = function (key, nodeid, guid) {
//	var row = new Props(key, nodeid, guid);
//	this.value.push(row);
//	row = _contentMap[row.cguid];
//	var colrow = _contentMap[this.value[0].cguid];
//	for (var i = 0; i < colrow.value.length; i++) {
//		row.addProp(colrow.value[i].key);
//	}
//	return row;
//}
//
//this.addColumn = function (key, nodeid, guid) {
//	for (var i = 0; i < this.value.length; i++) {
//		var row = _contentMap[this.value[i].cguid];
//		row.addProp(key);
//	}
//}
// Return only actual props items. Tables can contain other types, like 'include' and 'exclude', because of extension
//this.getTableRows = function () {
//	return this.value.filter(function (row) {
//		return row.type == 'props';
//	});
//}
//
//// Return the "column model", i.e. the first row's value.
//this.getTableColumns = function () {
//	var rows = this.getTableRows();
//	return rows.length > 0 ? rows[0].value : [];
//}
//

// TODO these should be prototype methods for props
// Return only actual prop items. Props values can contain other types,
// like 'include' and 'exclude', because of extension
//this.getListItems = function () {
//	return this.value.filter(function (item) {
//		return item.type == 'prop';
//	});
//},

//this.addProp = function (key, nodeid, guid) {
//	var prop = new Prop(key, nodeid, guid);
//	this.value.push(prop);
//}

    // Init from scratch
    this.initContent = function (rawContent) {
        this.removeContent();
        this.beforeReadHook(rawContent);
        _readNode(rawContent, null, this.nodeMap);
        _readContent(rawContent, null, this.nodeMap, this.contentMap);
        this.rootNode = this.nodeMap[rawContent.id];
        this.afterReadHook(this.rootNode);
        //this.dumpNodeMap();
        //this.dumpContentMap();
    }

    // Append new incoming content to existing content (e.g. incremental search results)
    // this.initContent must have been called prior to calling this
    this.appendContent = function (existingNode, rawContent) {
        this.beforeReadHook(rawContent);
        _readNode(rawContent, null, this.nodeMap);
        _readContent(rawContent, null, this.nodeMap, this.contentMap);
        this.afterReadHook(this.rootNode);
        var existingContent = this.findContentById(existingNode.id);
        var newContent = this.findContentById(rawContent.id);
        Array.prototype.push.apply(existingContent.value, newContent.value);
        //this.dumpNodeMap();
        //this.dumpContentMap();
    }

    // Make a pass over the incoming raw content to process extensions before reading
    this.beforeReadHook = function (rawContent) {
        var baseContent = [];
        this.beforeReadNode(rawContent, baseContent);

        baseContent.forEach(function (base) {
            base.isBase = true;
            base.cguid = base.extends.cguid;
            delete base.extends;
            _removeExtensionChildren(base);
            rawContent.value.push(base);
        });
    }

    this.beforeReadNode = function (rawContent, baseContent) {
        if (rawContent.hasOwnProperty('extends')) {
            baseContent.push(_.cloneDeep(rawContent));
        }
        if (_isValueAnArray(rawContent)) {
            var self = this;
            rawContent.value.forEach(function (child) {
                self.beforeReadNode(child, baseContent);
            })
        }
    }

    // Prume extension bases from the top level
    this.afterReadHook = function (rootNode) {
        var content = this.contentMap[rootNode.cguid];
        content.value = content.value.filter(function (child) {
            return !child.isBase;
        });
    }

    // TODO think about a server-side solution for this
    this.beforeSaveHook = function (root) {
        this.processIncludeExcludeBeforeSave(root);
        //this.dumpNodeMap();
        //this.dumpContentMap();
    }

    // TODO think about a server-side solution for this
    this.afterSaveHook = function (root) {
        this.processIncludeExcludeAfterSave(root);
        //this.dumpNodeMap();
        //this.dumpContentMap();
    }

    this.processIncludeExcludeBeforeSave = function (node) {
        var includes = [];
        this.collectIncludes(node, includes, function (node) {
            return node.extension === "exclude" || node.extension === "include";
        });
        var self = this;
        includes.forEach(function (node) {
            var parent = self.findParentContent(node.id);
            parent.value.push({
                key: node.key,
                type: node.extension
            });
        });
    }

    this.processIncludeExcludeAfterSave = function (node) {
        var content = this.findContentByNode(node);
        if (content && content.hasOwnProperty("extends")) {
            var includes = [];
            content.value.forEach(function (child, i) {
                if (child.type === "exclude" || child.type === "include") {
                    includes.push(i);
                }
            });
            for (var j = includes.length - 1; j >= 0; --j) {
                content.value.splice(includes[j], 1);
            }
        }
        if (content && _isValueAnArray(content)) {
            var self = this;
            content.value.forEach(function (child) {
                self.processIncludeExcludeAfterSave(child);
            });
        }
    }

    this.collectIncludes = function (node, includes, predicate) {
        if (predicate(node)) {
            includes.push(node);
            return;
        }
        var content = this.findContentByNode(node);
        if (_isValueAnArray(content)) {
            var self = this;
            content.value.forEach(function (node) {
                self.collectIncludes(node, includes, predicate);
            });
        }
    }

    // Walk the content tree performing some operation at each node
    this.visit = function (visitFunc, node) {
        visitFunc(node);
        var content = this.findContentByNode(node);
        if (_isValueAnArray(content)) {
            var self = this;
            content.value.forEach(function (node) {
                self.visit(visitFunc, node);
            });
        }
    }

    this.cloneNode = function (node, dereference) {
        var clone;
        switch (node.type) {
            case "manifest":
                clone = new Manifest(node);
                break;
            case "category":
                clone = new Category(node);
                break;
            case "props2d":
                clone = new Props2d(node);
                break;
            case "props":
                clone = new Props(node);
                break;
            case "prop":
                clone = new Prop(node);
                break;
        }
        clone.id = _generateId();
        this.nodeMap[clone.id] = clone;
        delete clone.value;
        delete clone.lock;
        if (dereference) {
            delete clone.extends;
            delete clone.extension;
            this.clearRefs(clone);
        }
        return clone;
    }

    // Create new node and new content with new GUIDs
    this.cloneNodeAndContent = function (node, recursive, dereference) {
        var clone = this.cloneNode(node, dereference);
        clone.cguid = this.cloneContent(clone.id, node.cguid, recursive, dereference);
        return clone;
    }

    // Create new content with new GUIDs
    this.cloneContent = function (nodeId, guid, recursive, dereference) {
        var currentContent = this.findContent(guid);
        var newContent = recursive ? _.cloneDeep(currentContent) : _.clone(currentContent);
        var newGuid = _generateGuid();
        newContent.id = nodeId;
        this.clearRefs(newContent);
        this.contentMap[newGuid] = newContent;
        if (dereference) {
            delete newContent.extends;
            delete newContent.extension;
        }
        if (recursive && _isValueAnArray(currentContent)) {
            for (var i = 0; i < currentContent.value.length; ++i) {
                var child = currentContent.value[i];
                this.removeKeyPath(child.id);
                var newNode = this.cloneNodeAndContent(child, recursive, dereference);
                newNode.parentId = nodeId;
                newContent.value.splice(i, 1, newNode);
            }
        }
        return newGuid;
    }

    // Create new node and new content but keep existing GUIDs
    this.copyNodeAndContent = function (node, parent, recursive) {
        var clone = this.cloneNode(node);
        clone.cguid = this.copyContent(clone.id, node.cguid, parent, recursive);
        return clone;
    }

    // Create new content but keep existing GUIDs
    this.copyContent = function (nodeId, guid, parent, recursive) {
        var currentContent = this.findContent(guid);
        var newContent = _.cloneDeep(currentContent);
        newContent.id = nodeId;
        this.clearRefs(newContent);
        if (!parent) {
            // Only assign a new GUID at the top level
            guid = _generateGuid();
            this.contentMap[guid] = newContent;
        }
        if (recursive && _isValueAnArray(newContent)) {
            for (var i = 0; i < newContent.value.length; ++i) {
                var child = newContent.value[i];
                this.removeKeyPath(child.id);
                var newNode = this.copyNodeAndContent(child, newContent, recursive);
                newNode.parentId = nodeId;
                newContent.value.splice(i, 1, newNode);
            }
        }
        return guid;
    }

    this.renameNode = function (node, newId) {
        node.id = newId;
        this.nodeMap[node.id] = newId;
        var content = this.findContent(node.cguid);
        content.id = newId;
        if (_isValueAnArray(content)) {
            var self = this;
            content.value.forEach(function (child) {
                child.parentId = newId;
            });
        }
    }

    // Will be called as part of an undo. Recreate the node map from the content map.
    // This ensures that node objects in the node map and in the content values
    // are the same objects.
    this.rebuildNodeMap = function (rootNode) {
        for (var guid in this.contentMap) {
            var content = this.contentMap[guid];
            if (_isValueAnArray(content)) {
                var self = this;
                content.value.forEach(function (node) {
                    self.nodeMap[node.id] = node;
                });
            }
        }
        this.nodeMap[rootNode.id] = rootNode;
    }

    // Creates a new node with empty key, and a new content object with empty value,
    // registers them, and then adds the node to a parent array.
    this.addContent = function (parentId, type) {
        switch (type) {
            case "row":
                return this.addTableRow(parentId);
            case "col":
                return this.addTableColumn(parentId);
            default:
                var parent = this.findContentById(parentId);
                var node = _createNode({
                    key: "",
                    type: type,
                    editable: true
                }, parent);
                this.nodeMap[node.id] = node;

                var content = _createContent({
                    id: node.id,
                    type: type,
                    value: type === "prop" ? "" : []
                });
                this.contentMap[node.cguid] = content;
                this.addToParent(parentId, node);
                return node.id;
        }
    }

    // Create a new row (props), then fill in all the columns (prop)
    // Return the node id of the new row
    this.addTableRow = function (parentId) {
        var rowId = this.addContent(parentId, "props");
        var table = this.findContentById(parentId);
        if (table.value.length > 1) {
            var row0 = this.findContentById(table.value[0].id);
            var self = this;
            row0.value.forEach(function (col) {
                var newColId = self.addContent(rowId, "prop");
                var newCol = self.findNode(newColId);
                newCol.key = col.key;
            });
        }
        return rowId;
    }

    // Create a new set of columns (prop), one per row (props)
    // Return the node id of the first new column added
    this.addTableColumn = function (parentId) {
        var table = this.findContentById(parentId);
        var col0Id = null;
        var self = this;
        table.value.forEach(function (row, i) {
            var colId = self.addContent(row.id, "prop");
            if (i === 0) {
                col0Id = colId;
            }
        });
        return col0Id;
    }

    this.lockContent = function (node, username) {
        var content = this.findContentByNode(node);
        if (!content.hasOwnProperty("lock")) {
            content.lock = {
                owner: username
            }
            var nodes = this.findAllNodesByGuid(node.cguid);
            nodes.forEach(function (n) {
                n.lock = {
                    owner: username
                }
            });
        }
        if (_isValueAnArray(content)) {
            var self = this;
            content.value.forEach(function (child) {
                self.lockContent(child, username);
            });
        }
    }

    this.unlockContent = function (node, username) {
        var content = this.findContentByNode(node);
        if (content.lock && content.lock.owner == username) {
            delete content.lock;
            var nodes = this.findAllNodesByGuid(node.cguid);
            nodes.forEach(function (n) {
                delete n.lock;
            });
        }
        if (_isValueAnArray(content)) {
            var self = this;
            content.value.forEach(function (child) {
                self.unlockContent(child, username);
            });
        }
    }

    // True means the user can change its value
    this.isEditable = function (id) {
        var node = this.findNode(id);
        if (AppUtils.isLockedByOther(node)) {
            return false;
        }
        if (node.editable) {
            return true;
        }
        var shared = node.refs && node.refs.length > 1;
        return !node.parentId || (this.isEditable(node.parentId) && !shared);
    }

    // True means it can be removed or reordered within its parent
    this.isRemovable = function (id) {
        var node = this.findNode(id);
        var parentNode = this.findParentNode(id);
        return this.isEditable(node.parentId) && (!parentNode.extends || node.extension === 'add');
    }

    // True means the two components have the same parent
    this.isSibling = function (id1, id2) {
        var parent1 = this.findParentNode(id1);
        var parent2 = this.findParentNode(id2);
        return parent1 && parent2 && parent1.id === parent2.id;
    }

    // True means all components in the array have the same parent
    this.allSiblings = function (arr) {
        if (arr.length > 1) {
            var id1 = arr[0];
            for (var i = 1; i < arr.length; ++i) {
                var id2 = arr[i];
                if (!this.isSibling(id1, id2)) {
                    return false;
                }
            }
        }
        return true;
    }

    this.clearRefs = function (node) {
        delete node.refs;
        if (node.type !== "manifest") {
            // Refs make no sense when you are the child of a list or a table
            var parent = this.findParentNode(node.id);
            if (parent.type != "props" && parent.type != "props2d") {
                node.refs = [];
                node.refs.push(this.rootNode.id);
            }
        }
    }

    this.initRefs = function (node) {
        var content = this.findContentByNode(node);
        if (content.hasOwnProperty("refs")) {
            if (!_.includes(content.refs, this.rootNode.id)) {
                content.refs.push(this.rootNode.id);
            }
        } else {
            content.refs = [];
            content.refs.push(this.rootNode.id);
        }
        content.refs = _.union(content.refs, node.refs);
        var nodes = this.findAllNodesByGuid(node.cguid);
        nodes.forEach(function (n) {
            n.refs = content.refs;
        });
    }

    this.mergeRefs = function (parent, child, recursive) {
        var parentContent = this.findContentByNode(parent);
        var childContent = this.findContentByNode(child);
        childContent.refs = _.union(parentContent.refs, childContent.refs);
        if (recursive && _isValueAnArray(childContent)) {
            var self = this;
            childContent.value.forEach(function (grandchild) {
                self.mergeRefs(child, grandchild, true);
            });
        }
        var nodes = this.findAllNodesByGuid(child.cguid);
        nodes.forEach(function (n) {
            n.refs = childContent.refs;
        });
    }

    this.includeOrExcludeChildren = function (parentId, children, includeOrExclude) {
        var parentContent = this.findContentById(parentId);
        parentContent.value.filter(function (child) {
            return child.extension == 'include' || child.extension == 'exclude';
        }).forEach(function (node) {
            delete node.extension;
        });
        children.forEach(function (child) {
            var node = _.find(parentContent.value, function (n) {
                return child.id == n.id;
            });
            if (node) {
                node.extension = includeOrExclude;
            }
        });
    }

    this.pasteFromServer = function (options, rawContent) {
        var newId;

        // Replace dummy component with spinner in it
        var dummy = this.findNode(options.placeholderId);
        this.removeFromParent(dummy);

        var parent = this.findNode(options.containerId);
        var existingContent = this.findAllNodesByGuid(rawContent.cguid);
        if (existingContent.length > 0) {
            var copy;
            if (Config.pasteStyle == 'clone') {
                // Make an entirely new copy of the node and content with new GUIDs
                copy = this.cloneNodeAndContent(existingContent[0], true, true);
                copy.editable = true;
                copy.isBase = false;
            } else {
                // Make a copy of the node but keep the same GUIDs
                copy = this.cloneNode(rawContent);
            }
            copy.key = "";
            copy.keyEditable = true;
            this.addToParent(parent.id, copy);
            newId = copy.id;
        } else {
            // Read in fresh content for the first time
            this.beforeReadHook(rawContent);
            _readNode(rawContent, parent, this.nodeMap);
            _readContent(rawContent, parent, this.nodeMap, this.contentMap);
            this.afterReadHook(this.rootNode);
            var newNode = this.findNode(rawContent.id);
            this.addToParent(parent.id, newNode);
            newNode.key = "";
            newNode.keyEditable = true;
            delete newNode.isNew;
            if (newNode.type == 'category') {
                this.mergeRefs(parent, newNode, true);
            }
            newId = newNode.id;
        }
        //this.dumpNodeMap();
        //this.dumpContentMap();
        return newId;
    }

    this.dereferenceNode = function (node, recursive) {
        node.cguid = this.cloneContent(node.id, node.cguid, recursive, true);
        node.isNew = true;
        this.clearRefs(node);
    }

    // Return the value for the given node
    this.getValue = function (node, allowableTypes) {
        var value = [];
        var content = this.findContent(node.cguid);
        if (content && allowableTypes) {
            value = content.value.filter(function (child) {
                return _.includes(allowableTypes, child.type);
            });
        } else if (content) {
            value = content.value;
        }
        return value;
    }

    // Return a cloned value for the given node, recursively down
    this.generateValue = function (node) {
        var value = _.cloneDeep(this.getValue(node));
        if (value instanceof Array) {
            var self = this;
            value.forEach(function (child) {
                if (child.type != "include" && child.type != "exclude") {
                    child.value = self.generateValue(child);
                }
            });
        }
        return value;
    }

    // Create a new value, with new GUIDs, recursively down
    this.cloneValue = function (node) {
        if (node.type == "prop") {
            return node.value;
        } else {
            var value = [];
            node.value.forEach(function (child) {
                value.push(this.cloneValue(child));
            });
            return value;
        }
    }

    // Adds an existing node to an existing parent.
    this.addToParent = function (parentId, child) {
        var parent = this.findNode(parentId);
        var parentContent = this.findContentById(parentId);
        if (parentContent.hasOwnProperty("extends")) {
            child.extension = "add";
        }
        switch (parent.type) {
            case 'category':
                this.mergeRefs(parent, child, true);
                break;
            case 'manifest':
                this.initRefs(child);
                break;
        }
        child.parentId = parent.id;
        parentContent.value.push(child);
    }

    this.removeFromParent = function (node) {
        if (this.isRemovable(node.id)) {
            var parent = this.findContentById(node.parentId);
            if (parent) {
                var index = this.findIndex(parent.id, node.id);
                parent.value.splice(index, 1);
                this.removeKeyPath(node.id);
                return true;
            }
        }
        return false;
    }

    this.replaceInParent = function (currentNode, newNode) {
        this.removeKeyPath(currentNode.id);
        var parent = this.findParentContent(currentNode.id);
        var index = _.findIndex(parent.value, function (n) {
            return currentNode.id === n.id;
        });
        parent.value.splice(index, 1, newNode);
        newNode.parentId = parent.id;
    }

    this.findIndex = function (parentId, childId) {
        var parent = this.findContentById(parentId);
        for (var i = 0; i < parent.value.length; ++i) {
            if (parent.value[i].id === childId) {
                return i;
            }
        }
        return -1;
    }

    this.moveUp = function (id) {
        var parent = this.findParentContent(id);
        var srcIndex = this.findIndex(parent.id, id);
        if (srcIndex > 0) {
            this.move(parent, id, srcIndex, -1);
        }
    }

    this.moveDown = function (id) {
        var parent = this.findParentContent(id);
        var srcIndex = this.findIndex(parent.id, id);
        if (srcIndex < parent.value.length - 1) {
            this.move(parent, id, srcIndex, 1);
        }
    }

    this.move = function (parent, id, srcIndex, direction) {
        var srcItem = this.findNode(id);
        var dstItem = parent.value[srcIndex + direction];
        if (!srcItem.extension || (srcItem.extension == "add" && dstItem.extension == "add")) {
            parent.value[srcIndex + direction] = srcItem;
            parent.value[srcIndex] = dstItem;
        }
    }

    this.moveLeft = function (tableId, colIndex) {
        if (colIndex > 0) {
            this.moveTableColumn(tableId, colIndex, -1);
        }
    }

    this.moveRight = function (tableId, colIndex) {
        var table = this.findContentById(tableId);
        if (colIndex < table.value.length - 1) {
            this.moveTableColumn(tableId, colIndex, 1);
        }
    }

    this.moveTableColumn = function (tableId, colIndex, direction) {
        var table = this.findContentById(tableId);
        for (var i = 0; i < table.value.length; i++) {
            var row = this.findContentById(table.value[i].id);
            var dstIndex = colIndex + direction;
            var srcItem = row.value[colIndex];
            var dstItem = row.value[dstIndex];
            row.value[dstIndex] = srcItem;
            row.value[colIndex] = dstItem;
        }
    }

    this.extend = function (node) {
        if (node && !node.extends) {
            var extendsObj = {
                cguid: node.cguid
            };
            if (node.hasOwnProperty("tags")) {
                extendsObj.tags = node.tags.slice();
            }
            var extension = this.copyNodeAndContent(node, null, true);
            extension.extends = extendsObj;
            extension.isNew = true;
            this.clearRefs(extension);
            this.clearRefs(this.findContent(extension.cguid));
            this.findContent(extension.cguid).extends = extendsObj;
            delete extension.tags;

            // Add extension
            this.replaceInParent(node, extension);
            //this.dumpNodeMap();
            //this.dumpContentMap();
        }
    }

    this.override = function (nodeId) {
        var node = this.findNode(nodeId);
        node.cguid = this.cloneContent(node.id, node.cguid, true);
        node.extension = "override";
        node.isNew = true;
        this.clearRefs(node);
        this.clearRefs(this.findContent(node.cguid));
        this.removeKeyPath(node.id);
        //this.dumpNodeMap();
        //this.dumpContentMap();
    }

    this.removeOverride = function (nodeId) {
        var node = this.findNode(nodeId);
        var parentContent = this.findParentContent(nodeId);
        var baseContent = this.findContent(parentContent.extends.cguid);
        if (baseContent) {
            var original = _.find(baseContent.value, function (child) {
                return child.key == node.key;
            });
            if (original) {
                // Get index of current position of override
                var overrideIndex = _.findIndex(parentContent.value, function (ch) {
                    return ch.id == nodeId;
                });

                // Replace override with copy of original
                var copy = this.copyNodeAndContent(original, this.findParentNode(nodeId), true);
                parentContent.value.splice(overrideIndex, 1, copy);
                copy.parentId = parentContent.id;
                this.removeKeyPath(nodeId);
            }
        }
        //this.dumpNodeMap();
        //this.dumpContentMap();
    }

    this.findNode = function (nodeId) {
        return this.nodeMap[nodeId];
    }

    this.findContent = function (guid) {
        return this.contentMap[guid];
    }

    this.findContentById = function (nodeId) {
        var node = this.findNode(nodeId);
        return this.findContentByNode(node);
    }

    this.findContentByNode = function (node) {
        return node.cguid ? this.findContent(node.cguid) : null;
    }

    this.findParentNode = function (nodeId) {
        var node = this.findNode(nodeId);
        return node.parentId ? this.findNode(node.parentId) : null;
    }

    this.findParentContent = function (nodeId) {
        var parent = this.findParentNode(nodeId);
        return parent ? this.findContent(parent.cguid) : null;
    }

    this.findAllNodesByGuid = function (guid) {
        var nodes = [];
        for (var nodeid in this.nodeMap) {
            if (this.nodeMap[nodeid].cguid === guid) {
                nodes.push(this.nodeMap[nodeid]);
            }
        }
        return nodes;
    }

    this.findEmptyKey = function (node) {
        var emptyParentPath = null;
        if (node.key) {
            var content = this.contentMap[node.cguid];
            if (_isValueAnArray(content)) {
                var self = this;
                content.value.forEach(function (child) {
                    var empty = self.findEmptyKey(child);
                    if (empty) {
                        emptyParentPath = empty;
                    }
                });
            }
        } else {
            var parent = this.findParentNode(node.id);
            emptyParentPath = this.idToKeyHash[parent.id];
        }
        return emptyParentPath;
    }

    this.findNodeByGuid = function (root, guid) {
        return _findNodeByGuidAtNode(root, guid, this.contentMap);
    }

    // Returns an array of model object that are only props.
    // As opposed to 'include' or 'exclude'
    this.generateTableRows = function (nodeId) {
        var allValues = this.generateValue(nodeId);
        return allValues.filter(function (row) {
            return row.type === 'props';
        });
    }

    /**
     * Validate a node's key against business rules:
     * <ol>
     *     <li>A key cannot be null or empty</li>
     *     <li>The key path from root to the node must be unique</li>
     *     <li>No spaces</li>
     *     <li>Alphanumeric only</li>
     *     <li>Must start with a letter</li>
     * </ol>
     * @param id
     * @param key
     * @returns object {valid, validationMessage}
     */
    this.validateKey = function (id, key) {
        if (id === this.rootNode.id) {
            key = "root";
        }
        var result = {
            valid: false,
            validationMessage: ""
        };
        if (key && key.length > 0) {
            var newKeyPath = this.initNewKeyPath(id, key);
            var existingId = this.keyToIdHash[newKeyPath];
            var unchanged = (existingId === id);
            if (unchanged) {
                result.valid = true;
                result.validationMessage = "";
            } else {
                if (existingId == undefined) {
                    var regex = /^[0-9]/
                    if (regex.test(key)) {
                        result.valid = false;
                        result.validationMessage = "Keys must start with a letter";
                    } else {
                        regex = /^[a-z0-9]+$/i
                        if (regex.test(key)) {
                            result.valid = true;
                            result.validationMessage = "";
                            this.removeKeyPath(id);
                            this.saveKeyPath(id, newKeyPath);
                        } else {
                            result.valid = false;
                            result.validationMessage = "Keys can contain letters and numbers only";
                        }
                    }
                } else {
                    result.valid = false;
                    result.validationMessage = "This is a duplicate key";
                }
            }
        }
        return result;

    }

    this.saveKeyPath = function (id, keypath) {
        var node = this.findNode(id);
        if (node.type !== 'exclude' && node.type !== 'include') {
            this.keyToIdHash[keypath] = id;
            this.idToKeyHash[id] = keypath;
            var value = this.getValue(node);
            if (value && value instanceof Array) {
                var self = this;
                value.forEach(function (child) {
                    self.saveKeyPath(child.id, keypath + '.' + child.key);
                });
            }
        }
    }

    this.removeKeyPath = function (id) {
        var content = this.findContentById(id);
        var currentKeyPath = this.idToKeyHash[id];
        if (currentKeyPath) {
            if (_isValueAnArray(content)) {
                var self = this;
                content.value.forEach(function (child) {
                    self.removeKeyPath(child.id);
                });
            }
            delete this.keyToIdHash[currentKeyPath];
            delete this.idToKeyHash[id];
        }
    }

    this.initNewKeyPath = function (id, key) {
        var keypath = this.idToKeyHash[id];
        if (keypath) {
            if (key && key.length > 0) {
                var keys = keypath.split(".");
                keys[keys.length - 1] = key;
                keypath = keys.join(".");
            }
        } else {
            var parent = this.findParentNode(id);
            if (parent) {
                var parentPath = this.idToKeyHash[parent.id] || ("" + parent.id);
                keypath = parentPath + '.' + key;
            } else {
                keypath = "root";
            }
        }
        return keypath;
    }

    // Return an array of model object that are prop from first parent object that is props.
    // As opposed to 'include' or 'exclude'
    this.generateTableColumns = function (nodeId) {
        var rows = this.generateTableRows(nodeId);
        var cols = [];
        if (rows.length > 0) {
            cols = rows[0].value.filter(function (col) {
                return col.type === 'prop'
            });
        }
        return cols;
    }

    // Mark for undo
    this.createSnapshot = function () {
        //this.dumpContentMap();
        var snapshot = {
            rootNode: _.cloneDeep(this.rootNode),
            contentMap: _.cloneDeep(this.contentMap)
        }
        return snapshot;
    }

    // Undo
    this.restoreFromSnapshot = function (snapshot) {
        this.removeContent();
        this.rootNode = snapshot.rootNode;
        this.contentMap = snapshot.contentMap;
        this.rebuildNodeMap(this.rootNode);
        this.saveKeyPath(this.rootNode.id, "root");
    }

    // Obliterate all trace of the current content tree and free up the memory
    this.removeContent = function () {
        this.nodeMap = {};
        this.contentMap = {};
        this.rootNode = null;
        this.keyToIdHash = {};
        this.idToKeyHash = {};
    }

    // For use on console
    this.dumpContentMap = function () {
        console.log(JSON.stringify(this.contentMap));
    }

    // For use on console
    this.dumpNodeMap = function () {
        console.log(JSON.stringify(this.nodeMap));
    }

    // For use on output tab
    this.dumpGuidToContentHash = function () {
        var dump = "";
        for (var guid in this.contentMap) {
            dump += (guid + ": " + JSON.stringify(this.contentMap[guid]) + "\n");
        }
        return dump;
    }

    // For use on output tab
    this.dumpIdToNodeHash = function () {
        var dump = "";
        for (var id in this.nodeMap) {
            dump += (id + ": " + JSON.stringify(this.nodeMap[id]) + "\n");
        }
        return dump;
    }

    // For use on output tab
    this.dumpKeyToIdHash = function () {
        var dump = "";
        for (var keypath in this.keyToIdHash) {
            dump += (keypath + ": " + this.keyToIdHash[keypath] + "\n");
        }
        return dump;
    }

    this.dumpIdToKeyHash = function () {
        var dump = "";
        for (var id in this.idToKeyHash) {
            dump += (id + ": " + this.idToKeyHash[id] + "\n");
        }
        return dump;
    }

    this.dumpValue = function (node) {
        var dump = this.generateValue(node.id);
        return dump;
    }

// TODO, previously in app-store, not yet transitioned to nodeids/content model.
//function _convertToCategory(id) {
//	var node = find(id);
//	if (node.type == 'props' || node.type == 'props2d') {
//		_tagForUndo();
//		node.type = 'category';
//		_markEdited();
//	}
//}
//
//function _convertToProps2d(propsIds) {
//	// For this operation to work, all props must be siblings.
//	if (_allSiblings(propsIds)) {
//		_tagForUndo();
//		var parent = findParent(propsIds[0]);
//		var table = new Props2d("");
//		// Find widest "row"
//		var maxCols = 0, widestRow;
//		for (var i = 0; i < propsIds.length; ++i) {
//			var row = find(propsIds[i]);
//			var numCols = Math.max(maxCols, row.value.length);
//			if (numCols > maxCols) {
//				maxCols = numCols;
//				widestRow = row;
//			}
//		}
//		// Make sure number of columns and column keys all match the widest
//		for (var i = 0; i < propsIds.length; ++i) {
//			var row = find(propsIds[i]);
//			if (row.id != widestRow.id) {
//				for (var j = 0; j < widestRow.value.length; ++j) {
//					if (row.value.length < (j + 1)) {
//						row = _clone(row, new Props());
//						row.addProp(widestRow.value[j].key);
//					}
//					else {
//						row.value[j].key = widestRow.value[j].key;
//					}
//				}
//			}
//		}
//		// Add modified rows to new table and remove original rows
//		for (var i = 0; i < propsIds.length; ++i) {
//			var row = find(propsIds[i]);
//			var copyRow = _deepCopy(row);
//			_addToParent(table, copyRow);
//		}
//		for (var i = propsIds.length - 1; i >= 0; --i) {
//			_userConfirmation.data = propsIds[i];
//			_removeConfirmed(true);
//		}
//		_addToParent(parent, table);
//		_selectComponent(table.id, false, false);
//		_markEdited();
//	}
//}
//
//function _convertToProps(propIds) {
//	var parent = findParent(propIds[0]);
//	// For this operation to work, all prop must be siblings.
//	if (_allSiblings(propIds) && (parent.type === "manifest" || parent.type === "category")) {
//		_tagForUndo();
//		var props = new Props("");
//		_addToParent(parent, props);
//
//		// Add props to new list and remove original props
//		for (var i = 0; i < propIds.length; ++i) {
//			var child = find(propIds[i]);
//			var copy = _deepCopy(child);
//			_addToParent(props, copy);
//		}
//		for (var i = propIds.length - 1; i >= 0; --i) {
//			_userConfirmation.data = propIds[i];
//			_removeConfirmed(true);
//		}
//	}
//}
//
//function _unwrapChildren(id) {
//	var node = find(id);
//	if (node) {
//		_tagForUndo();
//		var parent = findParent(id);
//		for (var i = 0; i < node.value.length; ++i) {
//			var child = node.value[i];
//			_removeKeyPath(child.id);
//			_addToParent(parent, child);
//		}
//		node.value = [];
//		_userConfirmation.data = id;
//		_removeConfirmed(true);
//	}
//}

}

module.exports = ContentStore;
