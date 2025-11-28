var React = require('react');

var ButtonGroup = require('react-bootstrap').ButtonGroup;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
var Button = require('react-bootstrap').Button;
var Input = require('react-bootstrap').Input;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;
var Alert = require('react-bootstrap').Alert;
var Config = require('../properties/props');
var NavMenuButton = require('../components/app-navmenubutton');
var NavMenuUtils = require('../utils/navmenu-utils');
var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppUtils = require('../utils/app-utils');
var AppView = require('./app-view');
var TagBox = require('./TagBox');
var TagList = require('./TagList');

var NavMenu = React.createClass({
    getInitialState: function () {
        return {
            active: this.props.active,
            converting: false
        }
    },
    componentWillReceiveProps: function (nextProps) {
        this.setState({
            active: nextProps.active
        });
    },

    handleClick: function (event) {
        event.stopPropagation();
    },
    showNavMenu: function () {
        this.setState({active: true});
    },
    hideNavMenu: function () {
        if (!this.state.converting) {
            // because the convert menu goes out of the boundaries of the nav menu
            this.setState({
                active: this.props.active
            });
        }
    },
    handleAddCategory: function (event) {
        event.stopPropagation();
        AppActions.addCategory(this.props.node.id, this.props.view);
    },
    handleAddProps2d: function (event) {
        event.stopPropagation();
        AppActions.addProps2d(this.props.node.id, this.props.view);
    },
    handleAddProps: function (event) {
        event.stopPropagation();
        AppActions.addProps(this.props.node.id, this.props.view);
    },
    handleAddProp: function (event) {
        event.stopPropagation();
        AppActions.addProp(this.props.node.id, this.props.view);
    },
    handleAddRow: function (event) {
        event.stopPropagation();
        AppActions.addTableRow(this.props.node.id, this.props.view);
    },
    handleAddColumn: function (event) {
        event.stopPropagation();
        AppActions.addTableColumn(this.props.node.id, this.props.view);
    },
    handleAddTag: function (tag) {
        AppActions.addTag(this.props.node.id, tag);
    },
    handleAddFolder: function (event) {
        event.stopPropagation();
        AppActions.addDoctreeFolder(this.props.node, this.props.callback);
    },
    handleRemoveTag: function (tag) {
        AppActions.removeTag(this.props.node.id, tag);
    },
    handleMoveUp: function (event) {
        event.stopPropagation();
        AppActions.moveUp(this.props.node.id);
    },
    handleMoveDown: function (event) {
        event.stopPropagation();
        AppActions.moveDown(this.props.node.id);
    },
    handleMoveLeft: function (event) {
        event.stopPropagation();
        AppActions.moveLeft(this.props.tableId, this.props.colIndex);
    },
    handleMoveRight: function (event) {
        event.stopPropagation();
        AppActions.moveRight(this.props.tableId, this.props.colIndex);
    },
    handleRemove: function (event) {
        event.stopPropagation();
        if (AppStore.isMultiSelect() && AppUtils.contains(AppStore.getSelectedComponents(), this.props.node.id)) {
            AppActions.removeMultiple(AppStore.getSelectedComponents());
        } else if (this.props.colIndex) {
            // removing a table column requires special handling
            var tableNode = this.props.parent.props.node;
            AppActions.removeTableColumn(tableNode.id, this.props.colIndex);
        } else if (this.props.node.type === "folder") {
            AppActions.removeDoctreeFolder(this.props.node, this.props.callback);
        } else {
            AppActions.remove(this.props.node.id);
        }
    },
    handleExclude: function (event) {
        event.stopPropagation();
        AppActions.excludeFromShared(this.props.node.id);
    },
    handleRestore: function (event) {
        event.stopPropagation();
        AppActions.restoreToShared(this.props.node.id);
    },
    handleDereference: function (event) {
        // AKA "clone to local"
        event.stopPropagation();
        AppActions.dereferenceContent(this.props.node.id);
    },
    handleOverride: function (event) {
        event.stopPropagation();
        AppActions.override(this.props.node.id);
    },
    handleRemoveOverride: function (event) {
        event.stopPropagation();
        AppActions.removeOverride(this.props.node.id);
    },
    handleCopy: function (event) {
        event.stopPropagation();
        AppActions.copyComponent(this.props.node.id);
    },
    handleSharedEdit: function (event) {
        event.stopPropagation();
        AppActions.requestSharedEdit(this.props.node.id);
    },
    handleConvert: function (event) {
        event.stopPropagation();
        this.setState({converting: true});
    },
    handleExtend: function (event) {
        event.stopPropagation();
        AppActions.extend(this.props.node.id);
    },
    handleConvertSelection: function (event) {
        event.stopPropagation();
        event.preventDefault();
        var prompt = "Convert To ...";
        var action = this.refs.select.getValue();
        if (action != prompt) {
            switch (action) {
                case "convertToCategory":
                    AppActions.convertToCategory(this.props.node.id);
                    break;
                case "convertToProps2d":
                    AppActions.convertToProps2d(AppStore.getSelectedComponents());
                    break;
                case "convertToProps":
                    AppActions.convertToProps(AppStore.getSelectedComponents());
                    break;
                case "unwrap":
                    AppActions.unwrapChildren(this.props.node.id);
                    break;
            }
            this.setState({converting: false});
        }
    },
    handleConvertBlur: function (event) {
        this.setState({converting: false});
    },
    handleLock: function (event) {
        event.stopPropagation();
        AppActions.lockContent(this.props.node.id, true);
    },
    handleUnlock: function (event) {
        event.stopPropagation();
        AppActions.unlockContent(this.props.node.id, true);
    },
    handleManageExtension: function (event) {
        event.stopPropagation();
        AppActions.userManageExtensionModalOpen(this.props.node);
    },
    getConvertOptions: function (convertList) {
        var options = convertList.map(function (conv, i) {
            switch (conv) {
                case 'convertToCategory':
                    return <option key={"convert" + (i + 1)} value={conv}>Convert to Category</option>
                case 'convertToProps2d':
                    return <option key={"convert" + (i + 1)} value={conv}>Convert to Props Table</option>
                case 'convertToProps':
                    return <option key={"convert" + (i + 1)} value={conv}>Convert to Props List</option>
                case 'unwrap':
                    return <option key={"convert" + (i + 1)} value={conv}>Move Children Up One Level</option>
            }
        });
        options.unshift(<option key="convert0" value='Convert To ...'>Convert To ...</option>);
        options.push(<option key={"convert" + options.length} value='Cancel'>Cancel</option>);
        return options;
    },

    render: function () {

        var self = this, menu, tagBox,
            editButtons, addButtons, movementButtons, deleteButtons,
            editGroup, addGroup, movementGroup, deleteGroup,
            addList = NavMenuUtils.getAddList(this.props.component, this.props.parent, this.props.node),
            editList = NavMenuUtils.getEditList(this.props.component, this.props.parent, this.props.node),
            moveList = NavMenuUtils.getMoveList(this.props.component, this.props.parent, this.props.node),
            deleteList = NavMenuUtils.getDeleteList(this.props.component, this.props.parent, this.props.node),
            tagsList = NavMenuUtils.getTagsReadOnly(this.props.component, this.props.parent, this.props.node),
            tagsBoxList = NavMenuUtils.getTagsEditable(this.props.component, this.props.parent, this.props.node),
            //convertList = NavMenuUtils.getConvertList(this.props.component, this.props.parent, this.props.node),

            addButtons = addList.map(function (name, i) {
                var button;
                switch (name) {
                    case 'prop':
                        button = <NavMenuButton key={"add" + i} glyph="icon-font" buttonStyle="primary"
                                                title="Add Prop"
                                                handler={self.handleAddProp}/>;
                        break;
                    case 'props':
                        button =
                            <NavMenuButton key={"add" + i} glyph="icon-th-list" buttonStyle="primary"
                                           title="Add Prop List"
                                           handler={self.handleAddProps}/>;
                        break;
                    case 'props2d':
                        button =
                            <NavMenuButton key={"add" + i} glyph="icon-th" buttonStyle="primary"
                                           title="Add Prop Table"
                                           handler={self.handleAddProps2d}/>;
                        break;
                    case 'category':
                        button = <NavMenuButton key={"add" + i} glyph="icon-folder-open" buttonStyle="primary"
                                                title="Add Category"
                                                handler={self.handleAddCategory}/>;
                        break;
                    case 'row':
                        button = <NavMenuButton key={"add" + i} glyph="icon-ellipsis-horizontal"
                                                buttonStyle="primary"
                                                title="Add Row"
                                                handler={self.handleAddRow}/>;
                        break;
                    case 'col':
                        button = <NavMenuButton key={"add" + i} glyph="icon-ellipsis-vertical" buttonStyle="primary"
                                                title="Add Column"
                                                handler={self.handleAddColumn}/>;
                        break;
                    case 'folder':
                        button = <NavMenuButton key={"add" + i} glyph="fa fa-folder-open" buttonStyle="warning"
                                                title="Add Folder"
                                                handler={self.handleAddFolder}/>;
                        break;
                }
                return button;
            });

        editButtons = editList.map(function (name, i) {
            var button;
            switch (name) {
                case 'wrench':
                    if (self.state.converting) {
                        // Show the convert menu, not the wrench icon
                        var options = self.getConvertOptions(convertList);
                        button =
                            <form className="convert-menu" key="edit3">
                                <Input
                                    ref="select"
                                    type="select"
                                    onChange={self.handleConvertSelection}
                                    onBlur={self.handleConvertBlur}
                                    onClick={self.handleClick}>
                                    {options}
                                </Input>
                            </form>
                    } else {
                        // Show the wrench icon, not the convert menu
                        button = <NavMenuButton key={"edit" + i} glyph="icon-wrench" buttonStyle="warning"
                                                title="Convert To ..." handler={self.handleConvert}/>;
                    }
                    break;
                case 'copy':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-copy" buttonStyle="primary"
                                       title="Copy Reference"
                                       handler={self.handleCopy}/>;
                    break;
                case 'edit':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-pencil" buttonStyle="warning"
                                       title="Edit Shared Content"
                                       handler={self.handleSharedEdit}/>;
                    break;
                case 'makeLocal':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-download-alt" buttonStyle="primary"
                                       title="Copy to Local"
                                       handler={self.handleDereference}/>;
                    break;
                case 'override':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-cog" buttonStyle="primary"
                                       title="Override"
                                       handler={self.handleOverride}/>;
                    break;
                case 'restore':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-refresh" buttonStyle="primary"
                                       title="Remove Override"
                                       handler={self.handleRemoveOverride}/>;
                    break;
                case 'lock':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-lock" buttonStyle="primary" title="Lock"
                                       handler={self.handleLock}/>;
                    break;
                case 'unlock':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-unlock" buttonStyle="primary" title="Unlock"
                                       handler={self.handleUnlock}/>;
                    break;
                case 'extend':
                    button =
                        <NavMenuButton key={"edit" + i} glyph="icon-code-fork" buttonStyle="primary" title="Extend"
                                       handler={self.handleExtend}/>;
                    break;
                case 'manageExtension':
                    button = <NavMenuButton key={"add" + i} glyph="icon-reorder" buttonStyle="primary"
                                            title="Manage Extension"
                                            handler={self.handleManageExtension}/>;
                    break;
            }
            return button;
        });

        movementButtons = moveList.map(function (name, i) {
            var button;
            switch (name) {
                case 'up':
                    button = <NavMenuButton key={"movement" + i} glyph="icon-chevron-up" buttonStyle="success"
                                            title="Move Up (Ctrl-↑)"
                                            handler={self.handleMoveUp}/>
                    break;
                case 'down':
                    button = <NavMenuButton key={"movement" + i} glyph="icon-chevron-down" buttonStyle="success"
                                            title="Move Down (Ctrl-↓)"
                                            handler={self.handleMoveDown}/>
                    break;
                case 'left':
                    button = <NavMenuButton key={"movement" + i} glyph="icon-chevron-left" buttonStyle="success"
                                            title="Move Left (Ctrl-←)"
                                            handler={self.handleMoveLeft}/>
                    break;
                case 'right':
                    button = <NavMenuButton key={"movement" + i} glyph="icon-chevron-right" buttonStyle="success"
                                            title="Move Right (Ctrl-→)"
                                            handler={self.handleMoveRight}/>
                    break;
            }
            return button;
        });

        deleteButtons = deleteList.map(function (name, i) {
            var button;
            switch (name) {
                case 'delete':
                    button = <NavMenuButton key={"delete" + i}
                                            glyph="icon-remove"
                                            buttonStyle={self.props.node.type === "folder" ? "warning" : "danger"}
                                            title={self.props.node.type === "folder" ? "Delete Folder" : "Delete (Del)"}
                                            handler={self.handleRemove}/>;
                    break;
            }
            return button;
        });

        if (this.state.converting) {
            //editButtons.unshift(convertMenu);
        }

        if (addButtons && addButtons.length) {
            addGroup =
                <ButtonGroup bsSize={this.props.view == AppView.TREE ? "xsmall" : "small"}>
                    {addButtons}
                </ButtonGroup>
        }

        if (editButtons && editButtons.length) {
            editGroup =
                <ButtonGroup bsSize={this.props.view == AppView.TREE ? "xsmall" : "small"}>
                    {editButtons}
                </ButtonGroup>
        }

        if (movementButtons && movementButtons.length) {
            movementGroup =
                <ButtonGroup bsSize={this.props.view == AppView.TREE ? "xsmall" : "small"}>
                    {movementButtons}
                </ButtonGroup>
        }

        if (deleteButtons && deleteButtons.length) {
            deleteGroup =
                <ButtonGroup bsSize={this.props.view == AppView.TREE ? "xsmall" : "small"}>
                    {deleteButtons}
                </ButtonGroup>
        }

        if (tagsList.length > 0) {
            tagBox =
                <TagList
                    className="tag-list"
                    tags={this.props.node.tags}
                />
        } else if (tagsBoxList.length > 0) {
            tagBox =
                <TagBox
                    className="tag-box"
                    tags={this.props.node.tags}
                    handleAddTag={this.handleAddTag}
                    handleRemoveTag={this.handleRemoveTag}
                />
        }

        if (this.state.active || Config.alwaysExpandNavMenus) {
            menu =
                <div className="navMenuBar">
                    {tagBox}
                    <Alert>
                        <ButtonToolbar>
                            {editGroup}
                            {addGroup}
                            {movementGroup}
                            {deleteGroup}
                        </ButtonToolbar>
                    </Alert>
                </div>
        } else if (this.props.view === AppView.EDITOR && (editGroup || addGroup || movementGroup || deleteGroup)) {
            // Is there anything to show when they hover? If not, don't even show the menu icon
            menu =
                <Button className="navMenuButton" onClick={this.showNavMenu} bsSize="small" tabIndex={-1}>
                    <i className=" icon-ellipsis-vertical"></i>
                </Button>
        }

        return (
            <div id={this.props.id} className={this.props.className}
                 onMouseEnter={this.showNavMenu}
                 onMouseLeave={this.hideNavMenu}>
                {menu}
            </div>
        );
    }
});

module.exports = NavMenu;

