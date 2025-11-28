var React = require('react');
var AppActions = require('../../actions/app-actions');
var AppStore = require('../../stores/app-store');
var AppView = require('../app-view');
var NavMenu = require('../app-navmenu');
var PropKey = require('../app-propkey');
var AppUtils = require('../../utils/app-utils.js');

var Tree = React.createClass({

    displayName: 'Tree',

    getInitialState: function () {
        return {
            selected: AppStore.isSelected(this.props.node.id),
            highlighted: false,
            collapsed: AppStore.getCollapsedState(AppView.TREE, this.props.node.id, this.props.node.type)
        }
    },
    componentWillReceiveProps: function (nextProps) {
        this.setState({
            selected: AppStore.isSelected(nextProps.node.id)
        })
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState({
                selected: AppStore.isSelected(this.props.node.id),
                collapsed: AppStore.getCollapsedState(AppView.TREE, this.props.node.id, this.props.node.type)
            })
        }
    },

    handleClick: function (event) {
        if (this.props.editable) {
            AppActions.selectComponent(this.props.node.id, event.ctrlKey || event.metaKey, event.shiftKey);
        }
    },

    handleHover: function (event) {
        var highlight = (event.type === "mouseenter");
        this.setState({
            highlighted: highlight
        });
        this.props.handleChildHover(highlight);
    },

    handleChildHover: function (childIsHighlighted) {
        this.setState({
            highlighted: !childIsHighlighted
        });
    },

    toggleCollapsed: function (event) {
        event.stopPropagation();
        this.setState({
            collapsed: !this.state.collapsed
        });
        AppStore.setCollapsedState(AppView.TREE, this.props.node.id, !this.state.collapsed);
    },

    saveColKey: function (event, key) {
        AppActions.saveTableColumnKey(this.props.tableId, this.props.node.id, this.props.colIndex, key);
    },

    glyphs: {
        'prop': 'icon-prop',
        'prop-locked': 'icon-prop-locked',
        'props': 'icon-props',
        'props-extended': 'icon-props-extended',
        'props-locked': 'icon-props-locked',
        'props-extended-locked': 'icon-props-extended-locked',
        'props2d': 'icon-props2d',
        'props2d-extended': 'icon-props2d-extended',
        'props2d-locked': 'icon-props2d-locked',
        'props2d-extended-locked': 'icon-props2d-extended-locked',
        'category': 'icon-category',
        'category-extended': 'icon-category-extended',
        'category-locked': 'icon-category-locked',
        'category-extended-locked': 'icon-category-extended-locked',
        'manifest': 'icon-manifest',
        'manifest-locked': 'icon-manifest-locked',
        'row': 'icon-ellipsis-horizontal',
        'col': 'icon-ellipsis-vertical'
    },

    /**
     * Some special handling for tables. In the tree view, we want to display rows & column
     * for the children and grand-children of tables, instead of props & prop
     * Also, show columns only as children of the first row
     * params:
     * parent - tree node
     * child - node
     */
    getChildNodeType: function (parent, child) {
        var childNodeType;
        switch (child.type) {
            case 'prop':
                if (parent.props.nodeType == 'row') {
                    var grandParent = parent.props.parent;
                    var rowIndex = this.findIndex(grandParent.props.node, parent.props.node);
                    childNodeType = (rowIndex == 0 ? 'col' : '');
                    break;
                } else {
                    childNodeType = child.type;
                }
                break;
            case 'props':
                childNodeType = (parent.props.nodeType == 'props2d' ? 'row' : child.type);
                break;

            default:
                childNodeType = child.type;
        }
        return childNodeType;
    },

    findIndex: function (tableNode, rowNode) {
        var rowIndex = -1;
        var rows = this.props.content.getValue(tableNode);
        for (var i = 0; i < rows.length; ++i) {
            if (rows[i].id === rowNode.id) {
                rowIndex = i;
                break;
            }
        }
        return rowIndex;
    },

    render: function () {
        var node = this.props.node;
        var isParentEditable = this.props.editable;
        var refCount = this.props.node.refs ? this.props.node.refs.length : null;
        var nodeRefs = refCount > 1 ? <span className="ref-count">{refCount}</span> : "";
        var nodeIcon = this.props.nodeType;
        var isParentLocked = this.props.locked;
        var arrowClassName = 'tree-view-arrow';
        var containerClassName = 'tree-view-children';
        var lockedClassName = 'locked';

        if (this.state.collapsed) {
            arrowClassName += ' tree-view-arrow-collapsed';
            containerClassName += ' tree-view-children-collapsed';
        }

        if (this.props.extended) {
            nodeIcon += '-extended';
        }

        if (this.props.locked) {
            nodeIcon += '-locked';
        }

        var items;
        if (!this.state.collapsed) {
            var self = this;
            var children = this.props.content.getValue(node);
            if (children instanceof Array) {
                items = children.map(function (child, i) {
                    // See note about special handling for tables above.
                    var childNodeType = self.getChildNodeType(self, child);
                    if (childNodeType) {
                        var tableId = (childNodeType == 'col' ? self.props.parent.props.node.id : undefined);
                        var colIndex = (childNodeType == 'col' ? i : undefined);
                        var isChildShared = AppUtils.isShared(self.props.node.type, self, child);
                        var isChildEditable = AppUtils.isEditable(self.props.node.type, self, child);
                        var isChildKeyEditable = AppUtils.isKeyEditable(self.props.node.type, self, child);
                        var isChildLocked = AppUtils.isLocked(child);
                        var isChildExtended = child.extends;
                        return (
                            <Tree
                                key={child.id}
                                parent={self}
                                node={child}
                                nodeType={childNodeType}
                                handleChildHover={self.handleChildHover}
                                tableId={tableId}
                                colIndex={colIndex}
                                extended={isChildExtended}
                                editable={isChildEditable}
                                shared={isChildShared}
                                keyEditable={isChildKeyEditable}
                                locked={isChildLocked}
                                content={self.props.content}
                            />
                        )
                    }
                });
            }
        }

        var arrow;
        if (node.hasOwnProperty("value") && node.value instanceof Array && node.value.length > 0) {
            arrow =
                <span className={(this.props.className || '') + ' ' + arrowClassName} onClick={this.toggleCollapsed}>
					▾
				</span>
        }

        var navMenu =
            <NavMenu
                className="navMenu"
                node={node}
                component={this}
                parent={this.props.parent}
                tableId={this.props.tableId}
                colIndex={this.props.colIndex}
                view={AppView.TREE}
                active={this.state.selected || this.state.highlighted}
            />

        var nodeView;
        if (this.state.selected) {
            var nodeLabel;
            var parentSaveKey;
            // If the user selects a component AND its key is empty, automatically enter the key editor.
            // Otherwise show the key as a paragraph.
            var editing = this.props.editable && (node.key == undefined || node.key.length == 0);

            if (this.props.nodeType == 'col') {
                // Special handling for column keys
                parentSaveKey = this.saveColKey;
            }
            nodeLabel =
                <PropKey
                    className="tree-view node-label"
                    id={node.id}
                    propKey={this.props.nodeLabel || node.key}
                    keyRef={node.ref}
                    editing={editing}
                    parentSaveKey={parentSaveKey}
                    editable={this.props.keyEditable}
                    autofocus={true}
                    view={AppView.TREE}
                    content={this.props.content}
                />

            nodeView =
                <div
                    className={"tree-view tree-view-node-selected " + (isParentLocked ? lockedClassName : "")}
                    onClick={this.handleClick}>
                    {navMenu}
                    {arrow}
                    {this.glyphs[this.props.nodeType] ? <i className={this.glyphs[nodeIcon]}>{nodeRefs}</i> : ""}
                    {nodeLabel}
                </div>
        } else {
            nodeView =
                <div
                    className={"tree-view tree-view-node " + (isParentLocked ? lockedClassName : " ")}
                    onClick={this.handleClick}>
                    {navMenu}
                    {arrow}
                    {this.glyphs[this.props.nodeType] ?
                        <i className={this.glyphs[nodeIcon]} onClick={this.toggleCollapsed}>{nodeRefs}</i> : ""}
                    <span className="node-label">{this.props.nodeLabel || (node.key ? node.key : "")}</span>
                </div>
        }
        return (
            <div
                className="tree-view"
                onMouseEnter={this.handleHover}
                onMouseLeave={this.handleHover}>
                {nodeView}
                <div className={containerClassName}>
                    {items}
                </div>
            </div>
        )
    }
});

module.exports = Tree;

