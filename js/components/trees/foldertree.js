var React = require('react');
var AppView = require('../app-view');
var AppKeys = require('../../utils/app-keys');
var AppActions = require('../../actions/app-actions');
var AppStore = require('../../stores/app-store');
var Input = require('react-bootstrap').Input;
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
var Button = require('react-bootstrap').Button;
var NavMenu = require('../app-navmenu');

var FolderTree = React.createClass({

    displayName: 'FolderTree',

    getInitialState: function () {
        return {
            selected: this.props.node.selected,
            highlighted: false,
            editing: !this.props.node.name,
            collapsed: !this.props.node.expanded,
            newNodeName: ''
        }
    },

    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },

    componentDidMount: function () {
        if (this.state.editing) {
            $("#newnode").focus();
        }
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState({
                selected: this.props.node.selected
            });
        }
    },

    componentWillReceiveProps: function (newProps) {
        if (!this.state.editing) {
            this.setState({
                newNodeName: newProps.node.name,
                selected: this.props.node.selected
            });
        } else {
            $("#newnode").focus();
        }
    },

    handleClick: function (event) {
        this.setState({
            collapsed: !this.state.collapsed,
            selected: true
        });
        this.props.node.expanded = this.state.collapsed;
        this.props.handleSelection(this.props.node.recoverPath());
        AppActions.selectTreeNode(this.props.node);
    },

    handleNavMenuAction: function (action, newFolder) {
        switch (action) {
            case "addFolder":
                this.setState({
                    collapsed: false
                });
                break;
        }
    },

    handleNewNodeNameChange: function () {
        this.setState({
            newNodeName: this.refs.newNodeInput.getValue()
        });
    },

    handleNewNodeName: function (event) {
        this.props.node.name = this.state.newNodeName;
        this.setState({
            editing: false
        });
    },

    handleHover: function (event) {
        var highlight = (event.type === "mouseenter");
        this.setState({
            highlighted: highlight
        });
        this.props.handleChildHover(highlight);
    },

    handleChildHover: function () {
        this.setState({
            highlighted: false
        });
    },

    handleKeyDown: function (event) {
        switch (event.which) {
            case AppKeys.ENTER:
            case AppKeys.TAB:
                event.preventDefault();
                this.props.node.name = this.refs.newNodeInput.getValue();
                this.setState({
                    editing: false
                });
                break;
        }
    },

    glyphs: {
        open: 'fa fa-folder-o',
        close: 'fa fa-folder-open-o'
    },

    render: function () {
        var containerClassName = 'tree-view-children';
        if (this.state.collapsed) {
            containerClassName += ' tree-view-children-collapsed';
        }

        var children;
        var node = this.props.node;
        if (!this.state.collapsed && node.children.length > 0) {
            var self = this;
            children = node.children.map(function (childNode, i) {
                if (childNode.type === "folder") {
                    return (
                        <FolderTree
                            node={childNode}
                            key={"foldertree" + i}
                            handleSelection={self.props.handleSelection}
                            handleChildHover={self.handleChildHover}
                        />
                    )
                }
            });
        }

        var openclose;
        if (this.state.collapsed) {
            openclose = <i className={this.glyphs['open']}/>
        } else {
            openclose = <i className={this.glyphs['close']}/>
        }

        var navMenu =
            <NavMenu
                className="navMenu"
                node={this.props.node}
                component={this}
                view={AppView.TREE}
                active={this.state.highlighted}
                callback={this.handleNavMenuAction}
            />

        var nodeView;
        if (!this.state.editing && node.name) {
            nodeView =
                <div
                    className={"tree-node " + (this.state.selected ? "selected" : "")}
                    onClick={this.handleClick}
                    onMouseEnter={this.handleHover}
                    onMouseLeave={this.handleHover}>
                    {openclose}
                    <span className="node-name">{node.name}</span>
                    {navMenu}
                </div>
        } else {
            nodeView =
                <div
                    className="tree-node tree-node-input"
                    onMouseEnter={this.handleHover}
                    onMouseLeave={this.handleHover}>
                    {openclose}
                    <Input
                        id="newnode"
                        type="text"
                        value={this.state.newNodeName}
                        placeholder="Enter name"
                        ref="newNodeInput"
                        groupClassName="tree-node-input"
                        onChange={this.handleNewNodeNameChange}
                        onKeyDown={this.handleKeyDown}
                        onMouseOut={this.handleNewNodeName}
                    />
                </div>
        }
        return (
            <div className="folder-tree">
                {nodeView}
                <div className={containerClassName}>
                    {children}
                </div>
            </div>
        )
    }
});

module.exports = FolderTree;

//{navMenu}
