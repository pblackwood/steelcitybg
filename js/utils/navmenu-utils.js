_ = require('lodash');
var AppStore = require('../stores/app-store');

// This file encapsulates business rules that control which menu items should show
// in the nav menu under various conditions

// The nav menu code wants three string arrays: addList, editList, and moveList.
// They can be empty but they must be defined.

// These are the factors which can affect the resulting lists:
// editable, shared, selected, and multi-selected

// For each of the templates below, use the node type of the node that wants a nav menu
// to retrieve an object whose properties are potential list elemements. Evaluate the code
// for each property to determine if that property name should be in the list.

var addListTemplates = {
    manifest: {
        category: 'props.editable',
        props2d: 'props.editable',
        props: 'props.editable',
        prop: 'props.editable'
    },
    category: {
        category: 'props.editable && !props.searchResult',
        props2d: 'props.editable && !props.searchResult',
        props: 'props.editable && !props.searchResult',
        prop: 'props.editable && !props.searchResult'
    },
    props2d: {
        row: 'props.editable && !props.searchResult',
        col: 'props.editable && !props.extended'
    },
    props: {
        prop: 'props.editable && parentProps.node.type != "props2d" && !props.searchResult'
    },
    folder: {
        folder: true
    }
};

// TODO, reinstate the convert menu ("wrench")

var editListTemplates = {
    manifest: {
        lock: '!node.isNew && !NavMenuUtils.isLocked(node) && !props.searchResult',
        unlock: 'NavMenuUtils.isLockedByUser(node) && !props.searchResult'
    },
    category: {
        extend: 'parentProps.editable && props.shared && !props.extended && !parentProps.extended && !props.searchResult && !node.isNew',
        manageExtension: 'parentProps.editable && props.extended && !props.searchResult && (!props.shared || props.editable)',
        override: 'parentProps.editable && parentProps.extended && !props.extended && !props.extensionType && !props.searchResult && !parentProps.searchResult',
        restore: 'parentProps.editable && parentProps.extended && props.extensionType == "override" && !props.searchResult && !parentProps.searchResult',
        edit: 'parentProps.editable && props.shared && !props.editable && !NavMenuUtils.isLockedByOther(node) && !props.searchResult && !node.isNew',
        makeLocal: 'parentProps.editable && props.shared && !props.extended && !parentProps.extended && !props.searchResult && !node.isNew',
        lock: '!node.isNew && !NavMenuUtils.isLocked(node) && !props.searchResult',
        unlock: 'NavMenuUtils.isLockedByUser(node) && !props.searchResult',
        //wrench: 'props.editable && !props.searchResult',
        copy: 'props.searchResult && node.cguid'
    },
    props2d: {
        extend: 'parentProps.editable && props.shared && !props.extended && !parentProps.extended && !props.searchResult && !node.isNew',
        manageExtension: 'parentProps.editable && props.extended && !props.searchResult && (!props.shared || props.editable)',
        override: 'parentProps.editable && parentProps.extended && !props.extended && !props.extensionType && !props.searchResult && !parentProps.searchResult',
        restore: 'parentProps.editable && parentProps.extended && props.extensionType == "override" && !props.searchResult && !parentProps.searchResult',
        //wrench: 'props.editable && !props.searchResult',
        edit: 'parentProps.editable && props.shared && !props.editable && !NavMenuUtils.isLockedByOther(node) && !props.searchResult && !node.isNew',
        makeLocal: 'parentProps.editable && props.shared && !props.extended && !parentProps.extended && !props.searchResult && !node.isNew',
        lock: '!node.isNew && !NavMenuUtils.isLocked(node) && !props.searchResult',
        unlock: 'NavMenuUtils.isLockedByUser(node) && !props.searchResult',
        copy: 'props.searchResult && node.cguid'
    },
    props: {
        extend: 'parentProps.editable && props.shared && !props.extended && !parentProps.extended && !props.searchResult && !node.isNew',
        manageExtension: 'parentProps.editable && props.extended && !props.searchResult && (!props.shared || props.editable)',
        override: 'parentProps.editable && parentProps.extended && !props.extended && !props.extensionType && !props.searchResult && !parentProps.searchResult',
        restore: 'parentProps.editable && parentProps.extended && props.extensionType == "override" && !props.searchResult && !parentProps.searchResult',
        //wrench: 'props.editable && parent.type != "props2d" && !props.searchResult',
        edit: 'parentProps.editable && props.shared && !props.editable && !NavMenuUtils.isLockedByOther(node) && !props.searchResult && !node.isNew',
        makeLocal: 'parentProps.editable && props.shared && !props.extended && !parentProps.extended && !props.searchResult && !node.isNew',
        lock: '!node.isNew && !NavMenuUtils.isLocked(node) && !props.searchResult && !parentProps.searchResult && (parentProps.node.type === "category" || parentProps.node.type === "manifest")',
        unlock: 'NavMenuUtils.isLockedByUser(node) && !props.searchResult',
        copy: 'props.searchResult && node.cguid'
    },
    prop: {
        override: 'parentProps.editable && parentProps.extended && !props.extended && !props.extensionType && !props.searchResult && !parentProps.searchResult',
        restore: 'parentProps.editable && parentProps.extended && props.extensionType == "override" && !props.searchResult && !parentProps.searchResult && !parentProps.searchResult',
        //wrench: 'props.editable && parent.type != "props" && !props.searchResult',
        edit: 'parentProps.editable && props.shared && !props.editable && !NavMenuUtils.isLockedByOther(node) && (!parentProps.extended || parentProps.node.type === "category") && !props.searchResult && !parentProps.searchResult && !node.isNew',
        makeLocal: 'parentProps.editable && props.shared && !parentProps.extended && !props.searchResult && !parentProps.searchResult && !node.isNew',
        lock: '!node.isNew && !NavMenuUtils.isLocked(node) && !props.searchResult && !parentProps.searchResult && (parentProps.node.type === "category" || parentProps.node.type === "manifest")',
        unlock: 'NavMenuUtils.isLockedByUser(node) && !props.searchResult && !parentProps.searchResult',
        copy: 'props.searchResult && node.cguid'
    }
};

var moveListTemplates = {
    category: {
        up: 'parentProps.editable && (!parentProps.extended || props.extensionType === "add")',
        down: 'parentProps.editable && (!parentProps.extended || props.extensionType === "add")'
    },
    props2d: {
        up: 'parentProps.editable && (!parentProps.extended || props.extensionType === "add")',
        down: 'parentProps.editable && (!parentProps.extended || props.extensionType === "add")'
    },
    props: {
        up: 'parentProps.editable && (!parentProps.extended || props.extensionType === "add")',
        down: 'parentProps.editable && (!parentProps.extended || props.extensionType === "add")'
    },
    prop: {
        up: 'parentProps.editable && !props.hasOwnProperty("colIndex") && (!parentProps.extended || props.extensionType === "add")',
        down: 'parentProps.editable && !props.hasOwnProperty("colIndex") && (!parentProps.extended || props.extensionType === "add")',
        left: 'parentProps.editable && !isNaN(props.colIndex)',
        right: 'parentProps.editable && !isNaN(props.colIndex)'
    }
};

var deleteListTemplates = {
    category: {
        delete: 'parentProps.editable && !props.searchResult && !parentProps.searchResult && (!parentProps.extended || props.extensionType === "add")'
    },
    props2d: {
        delete: 'parentProps.editable && !props.searchResult && !parentProps.searchResult && (!parentProps.extended || props.extensionType === "add")'
    },
    props: {
        delete: 'parentProps.editable && !props.searchResult && !parentProps.searchResult && (!parentProps.extended || props.extensionType === "add")'
    },
    prop: {
        delete: 'parentProps.editable && !props.searchResult && !parentProps.searchResult && (!parentProps.extended || props.extensionType === "add")'
    },
    folder: {
        delete: 'node.children.length == 0'
    }
};

var tagsReadOnlyTemplates = {
    manifest: {
        tags: false
    },
    category: {
        tags: '!props.editable && !props.searchResult && !props.extended'
    },
    props2d: {
        tags: '!props.editable && !props.searchResult && !props.extended'
    },
    props: {
        tags: '!props.editable && !props.searchResult && parentProps.node.type != "props2d" && !props.extended'
    },
    prop: {
        tags: '!props.editable && !props.searchResult && !parentProps.searchResult && !props.hasOwnProperty("colIndex") && !props.extended'
    }
};

var tagsEditableTemplates = {
    manifest: {
        tags: false
    },
    category: {
        tags: '(props.editable || props.extended) && parentProps.editable && !props.searchResult'
    },
    props2d: {
        tags: '(props.editable || props.extended) && parentProps.editable && !props.searchResult'
    },
    props: {
        tags: '((props.editable && parentProps.node.type != "props2d") || props.extended) && parentProps.editable && !props.searchResult'
    },
    prop: {
        tags: 'props.editable && parentProps.node.type != "props" && parentProps.editable && !props.searchResult && !props.hasOwnProperty("colIndex")'
    }
};

var convertTemplates = {
    category: {
        unwrap: true
    },
    props2d: {
        convertToCategory: true
    },
    props: {
        convertToCategory: true,
        convertToProps2d: '!multiSelect || (selected && multiSelect && AppStore.areSiblingsSelected())',
        unwrap: true
    },
    prop: {
        convertToProps: '!multiSelect || (selected && multiSelect && AppStore.areSiblingsSelected())'
    }
};

// Search results are special-cased since they would be represented in every rule.
var NavMenuUtils = {
    getAddList: function (component, parent, node) {
        //console.log("navMenu getAddList for " + node.type);
        return this.getList(component, parent, node, addListTemplates);
    },

    getEditList: function (component, parent, node) {
        //console.log("navMenu getEditList for " + node.type);
        return this.getList(component, parent, node, editListTemplates);
    },

    getMoveList: function (component, parent, node) {
        //console.log("navMenu getMoveList for " + node.type);
        var list = this.getList(component, parent, node, moveListTemplates);
        //list.forEach(function(child) {
        //	console.log("  " + child);
        //});
        //if (node.type == 'prop') {
        //	console.log("  Props:");
        //	for (var p in component.props) {
        //		console.log("  " + p);
        //	}
        //}
        return list;
    },

    getDeleteList: function (component, parent, node) {
        //console.log("navMenu getDeleteList for " + node.type);
        return this.getList(component, parent, node, deleteListTemplates);
    },

    getConvertList: function (component, parent, node) {
        return this.getList(component, parent, node, convertTemplates);
    },

    getTagsEditable: function (component, parent, node) {
        //console.log("navMenu getTagsEditable for " + node.type);
        return this.getList(component, parent, node, tagsEditableTemplates);
    },

    getTagsReadOnly: function (component, parent, node) {
        //console.log("navMenu getTagsReadOnly for " + node.type);
        return this.getList(component, parent, node, tagsReadOnlyTemplates);
    },

    getList: function (component, parent, node, templates) {
        var list = [];
        if (node) {
            var template = templates[node.type];
            if (template) {
                var selected = AppStore.isSelected(node.id);
                var multiSelect = AppStore.isMultiSelect();
                var props = component.props;
                var state = component.state;
                var parentProps = parent ? parent.props : null;
                var parentState = parent ? parent.state : null;
                var manifest = AppStore.getManifest();
                for (var type in template) {
                    if (eval(template[type.toString()])) {
                        list.push(type.toString());
                    }
                }
            }
        }
        return list;
    },

    // For unit-testing
    setAddListTemplate: function (t) {
        addListTemplates = t;
    },

    // For unit-testing
    setEditListTemplate: function (t) {
        editListTemplates = t;
    },

    isLocked: function (node) {
        //console.log("navMenu isLocked for " + node.type);
        return node.hasOwnProperty("lock");
    },

    isLockedByUser: function (node) {
        //console.log("Node type: " + node.type + ", id = " + node.id + ", locked by = " + node.lock.owner + ", current user = " + AppStore.getCurrentUser());
        return node.hasOwnProperty("lock") && node.lock.owner === AppStore.getCurrentUser();
    },

    isLockedByOther: function (node) {
        //console.log("Node type: " + node.type + ", id = " + node.id + ", locked by = " + node.lock.owner + ", current user = " + AppStore.getCurrentUser());
        return node.hasOwnProperty("lock") && node.lock.owner !== AppStore.getCurrentUser();
    }

};

module.exports = NavMenuUtils;