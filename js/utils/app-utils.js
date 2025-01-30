var React = require('react');
var _ = require('lodash');
var currentUser = "";

// See isShared(). The key is the parent type, the value is a boolean "is the child shared?"
var shared = {
    manifest: 'node.refs && node.refs.length > 1',
    category: '(node.refs && node.refs.length > 1) || (props.shared && !props.extended && !node.hasOwnProperty("extension"))',
    props2d: false,
    props: false
};

// See isEditable(). The key is the parent type, the value is a boolean "is the child editable?"
var editable = {
    manifest: '!AppUtils.isLockedByOther(node) && (node.editable || !(node.refs && node.refs.length > 1))',
    category: '!AppUtils.isLockedByOther(node) && !props.searchResult && ((props.editable && (node.editable || !(node.refs && node.refs.length > 1)) || (props.extended && props.editable && (node.extension === "add" || node.extension === "override"))))',
    props2d: '!AppUtils.isLockedByOther(node) && !props.searchResult && (props.editable && (!props.extended || (props.extended && (node.extension === "add" || node.extension === "override"))))',
    props: '!AppUtils.isLockedByOther(node) && !props.searchResult && (props.editable && (!props.extended || (props.extended && (node.extension === "add" || node.extension === "override"))))'
};

// See isKeyEditable(). The key is the parent type, the value is a boolean "is the child's key editable?"
var keyEditable = {
    manifest: 'props.editable',
    category: '(props.editable && (!props.extended || node.extension === "add"))',
    props2d: '(props.editable && (!props.extended || node.extension === "add"))',
    props: '(props.editable && (!props.extended || node.extension === "add"))'
};

// See getComponentClassNames(). The key is the node type, the nested keys are CSS classes to potentially include when rendering
var componentClassNames = {
    manifest: {
        row: true,
        manifestComponent: true,
        componentSelected: 'state.selected',
        componentLocked: 'props.checkedOut',
        useCommon: false
    },
    category: {
        row: true,
        categoryComponent: true,
        useCommon: true
    },
    props2d: {
        row: true,
        props2dComponent: true,
        useCommon: true
    },
    props: {
        row: true,
        propsComponent: true,
        useCommon: true
    },
    prop: {
        row: true,
        propComponent: true,
        useCommon: true
    },
    tableRow: {
        componentAdd: 'props.extensionType === "add"',
        componentInclude: 'props.extensionType === "include"',
        componentExclude: 'props.extensionType === "exclude"',
        componentOverride: 'props.extensionType === "override"',
        useCommon: false
    },
    tableRowHeader: {
        row: true,
        tableColumn: true,
        componentReadOnly: '!props.editable',
        componentSelected: 'state.selected',
        componentHighlighted: 'state.highlighted',
        useCommon: false
    },
    common: {
        componentAdd: 'props.extensionType === "add"',
        componentInclude: 'props.extensionType === "include"',
        componentExclude: 'props.extensionType === "exclude"',
        componentOverride: 'props.extensionType === "override"',
        componentReadOnly: '!props.editable',
        componentShared: '!props.editable && (props.shared || parentProps.shared)',
        //componentShared: 'props.shared',
        componentSelected: 'state.selected',
        componentHighlighted: 'state.highlighted',
        componentEditable: 'node.editable'
    }
};

// This is the model for the tree-based file chooser the user sees when they start the app.
function DocPath(name) {
    this.name = name;
    this.type = "file";
    this.expanded = false;
    this.parent = null;
    this.selected = false;
    this.children = [];

    this.addPath = function (path) {
        var child;
        if (path.length == 1) {
            child = new DocPath(path[0]);
            child.parent = this;
            this.children.push(child);
            this.children.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            this.type = "folder";
        } else {
            for (var i = 0; i < this.children.length; ++i) {
                child = this.children[i];
                if (child.name === path[0] && child.type === "folder") {
                    path = path.slice(1);
                    child.addPath(path);
                    this.type = "folder";
                    return;
                }
            }
            child = new DocPath(path[0]);
            child.parent = this;
            this.children.push(child);
            this.type = "folder";
            path = path.slice(1);
            child.addPath(path);
        }
    };

    this.recoverPath = function () {
        if (this.parent == null) {
            return "";
        } else {
            var path = this.parent.recoverPath();
            return path ? (path + '.' + this.name) : this.name;
        }
    };

    this.addChild = function (type, name) {
        var child = new DocPath(name);
        child.parent = this;
        child.type = type;
        this.expanded = true;
        this.children.push(child);
        this.children.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        return child;
    }

    this.removeChild = function (node) {
        if (node.type === "file" || node.children.length == 0) {
            var index = _.findIndex(this.children, function (child) {
                return child.name == node.name;
            });
            if (index != -1) {
                this.children.splice(index, 1);
            }
        }
        return this;
    }

}

var AppUtils = {

    selectedNode: null,

    treeify: function (list) {
        var docRoot = new DocPath("root");
        list.forEach(function (val) {
            var chunks = val.split(".");
            docRoot.addPath(chunks);
        });
        //AppUtils.dumpPath(docRoot, 0);
        docRoot.children.forEach(function (node) {
            node.expanded = true;
        });
        return docRoot;
    },

    addToTree: function (tree, docpath) {
        var chunks = docpath.split(".");
        tree.addPath(chunks);
    },

    addTreeFolder: function (parentNode, callback) {
        var child = parentNode.addChild("folder", "");
        if (callback) {
            callback("addFolder", child);
        }
    },

    removeTreeNode: function (node, callback) {
        var parent = node.parent;
        if (parent) {
            parent.removeChild(node);
        }
        if (callback) {
            callback(parent);
        }
    },

    selectTreeNode: function (node) {
        if (this.selectedNode) {
            this.selectedNode.selected = false;
        }
        this.selectedNode = node;
        this.selectedNode.selected = true;
    },

    isTreeNodeSelected: function (node) {
        if (this.selectedNode) {
            this.selectedNode.selected = false;
        }
        this.selectedNode = node;
        this.selectedNode.selected = true;
    },

    dumpPath: function (path, indent) {
        var spaces = "";
        for (var i = 0; i < indent; ++i) {
            spaces += " ";
        }
        console.log(spaces + path.name + "[" + path.type + ", parent=" + (path.parent ? path.parent.name : "null") + "]");
        path.children.forEach(function (child) {
            AppUtils.dumpPath(child, indent + 2);
        });
    },

    // Returns true if the array contains the given object
    contains: function (array, obj) {
        for (var i = 0; i < array.length; i++) {
            if (_.isEqual(array[i], obj)) {
                return true;
            }
        }
        return false;
    },

    // Remove the object from the array if it exists, otherwise do nothing
    removeArrayItem: function (array, obj) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === obj) {
                array.splice(i, 1);
                return;
            }
        }
    },

    // Return an array with the provided target missing if found, otherwise a copy of the array
    filterArrayItem: function (array, target) {
        return array.filter(function (element) {
            return element != target;
        });
    },

    // Clone a generic object where the exact structure is not known.
    clone: function (obj) {
        return _.cloneDeep(obj);
    },

    getTags: function (tags, q, matchCase) {
        var results = [];

        tags.forEach(function (tag) {
            results.push(<span className="tag drawer-tag" dangerouslySetInnerHTML={{__html: tag}}></span>);
        });
        return results;
    },

    addMarkup: function (tag, value) {
        return value.replace(new RegExp("<div class='match'>", 'g'), tag.start).replace(new RegExp('</div>', 'g'), tag.end);
    },

    removeMarkup: function (value) {
        return value.replace(new RegExp("<div class='match'>", 'g'), '').replace(new RegExp('</match>', 'g'), '');
    },

    tokenizeQuery: function (query) {
        var tokens = query.match(/(\"[^\"]*\")|([^\"^\s]+)/g);
        if (tokens) {
            tokens = tokens.map(function (token) {
                return token.replace(/\"/g, '');
            });
        } else {
            tokens = [null];
        }
        return tokens;
    },

    // Will be called from the container's render function for each child node, to determine if the child is shared.
    isShared: function (containerType, container, node) {
        //console.log("isShared for " + containerType);
        var expression = shared[containerType];
        var props = container.props;
        return (eval(expression));
    },

    // Will be called from the app.js's render function. manifest is the store's _manifest, i.e. it's a node.
    isManifestEditable: function (manifest) {
        return manifest.editable && !AppUtils.isLockedByOther(manifest);
    },

    // Will be called from the app.js's render function. manifest is the store's _manifest, i.e. it's a node.
    isManifestCheckedOut: function (manifest) {
        return !manifest.editable;
    },

    // Will be called from the container's render function for each child node, to determine if the child is editable.
    isEditable: function (containerType, container, node) {
        //console.log("isEditable for " + containerType);
        var expression = editable[containerType];
        var props = container.props;
        var parentProps = props.parent ? props.parent.props : null;
        return (eval(expression));
    },

    // Will be called from the container's render function for each child node, to determine if the child's key is editable.
    isKeyEditable: function (containerType, container, node) {
        //console.log("isKeyEditable for " + containerType);
        var expression = keyEditable[containerType];
        var props = container.props;
        var parentProps = props.parent ? props.parent.props : null;
        return (eval(expression));
    },

    // Will be called from the container's render function for each child node, to determine if the child is locked.
    isLocked: function (node) {
        return node.hasOwnProperty("lock");
    },

    // Will be called from the container's render function for each child node, to determine the child's CSS classes.
    getComponentClassNames: function (component, nodeType) {
        var list = [];
        var useCommon = false;
        var type = nodeType;
        if (!type) {
            var node = component.props.node;
            type = node.type;
        }
        //console.log("getComponentClassNames for " + type);
        var template = componentClassNames[type];
        if (template) {
            var props = component.props;
            var state = component.state;
            var parentProps = props.parent ? props.parent.props : null;
            for (var className in template) {
                if (className === "useCommon" && eval(template[className.toString()])) {
                    useCommon = true;
                } else if (eval(template[className.toString()])) {
                    list.push(className.toString());
                }
            }
            if (useCommon) {
                template = componentClassNames["common"];
                for (var className in template) {
                    if (eval(template[className.toString()])) {
                        list.push(className.toString());
                    }
                }
            }
        }
        return list.join(" ");
    },

    setCurrentUser: function (user) {
        currentUser = user;
    },

    isLockedByUser: function (node) {
        return node.hasOwnProperty("lock") && node.lock.owner === currentUser;
    },

    isLockedByOther: function (node) {
        return node.hasOwnProperty("lock") && node.lock.owner !== currentUser;
    }


};

module.exports = AppUtils;
