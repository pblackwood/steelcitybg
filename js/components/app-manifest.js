/**
 This is the root of the tree which contains all top-level components.
 It exists to allow the user to append components to the end of the manifest and to paste copied
 components at the end of the manifest.
 */
var React = require('react');

var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppUtils = require('../utils/app-utils');
var AppView = require('./app-view');
var Category = require('../components/app-category.js');
var Prop = require('../components/app-prop.js');
var Props = require('../components/app-props.js');
var Props2d = require('../components/app-props2d.js');
var ComponentIcon = require('./app-icon');
var PropKey = require('./app-propkey');
var NavMenu = require('./app-navmenu');

var Manifest = React.createClass({
    getInitialState: function () {
        return {
            selected: AppStore.isSelected(this.props.node.id),
            collapsed: AppStore.getCollapsedState(this.props.view, this.props.node.id, this.props.node.type)
        };
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    componentDidMount: function () {
        if (this.state.collapsed) {
            $('#' + this.props.node.id.replace(/\./g, "")).collapse("hide");
        } else {
            $('#' + this.props.node.id.replace(/\./g, "")).collapse("show");
        }
        window.scrollTo(0, 0);
    },
    componentDidUpdate: function () {
        if (AppStore.getNewestNodeId()) {
            // Focus on new components after adding
            $("*[tabindex='999']").focus();
            $("*[tabindex='999']").attr("tabindex", 1);
            AppStore.setNewestNodeId(null);
        }
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState({
                selected: AppStore.isSelected(this.props.node.id),
                collapsed: AppStore.getCollapsedState(this.props.view, this.props.node.id, this.props.node.type)
            });
        }
    },
    handleClick: function (event) {
        event.stopPropagation();
        if (this.props.editable) {
            AppActions.selectComponent(this.props.node.id, event.ctrlKey || event.metaKey);
        }
    },
    handleChildHover: function (childIsHighlighted) {
    },
    handleCollapse: function (event) {
        if (!this.state.collapsed) {
            event.stopPropagation();
        }
        this.setState({collapsed: !this.state.collapsed});
        AppStore.setCollapsedState(this.props.view, this.props.node.id, !this.state.collapsed);
    },
    render: function () {
        var self = this;
        var children = this.props.content.getValue(this.props.node);
        if (children) {
            var items = children.map(function (item, i) {
                var itemRefCount = item.refs ? item.refs.length : 0;
                var itemShared = AppUtils.isShared("manifest", self, item);
                var itemEditable = AppUtils.isEditable("manifest", self, item);
                var itemKeyEditable = AppUtils.isKeyEditable("manifest", self, item);
                switch (item.type) {
                    case "category":
                        return (<Category
                            id={item.id}
                            node={item}
                            parent={self}
                            key={item.id}
                            refCount={itemRefCount}
                            shared={itemShared}
                            extended={item.extends}
                            editable={itemEditable}
                            keyEditable={itemKeyEditable}
                            view={self.props.view}
                            handleChildHover={self.handleChildHover}
                            content={self.props.content}
                        />);
                    case "prop":
                        return (<Prop
                            id={item.id}
                            node={item}
                            parent={self}
                            key={item.id}
                            refCount={itemRefCount}
                            shared={itemShared}
                            editable={itemEditable}
                            keyEditable={itemKeyEditable}
                            view={self.props.view}
                            handleChildHover={self.handleChildHover}
                            content={self.props.content}
                        />);
                    case "props":
                        return (<Props
                            id={item.id}
                            node={item}
                            parent={self}
                            key={item.id}
                            refCount={itemRefCount}
                            shared={itemShared}
                            extended={item.extends}
                            editable={itemEditable}
                            keyEditable={itemKeyEditable}
                            view={self.props.view}
                            handleChildHover={self.handleChildHover}
                            content={self.props.content}
                        />);
                    case "props2d":
                        return (<Props2d
                            id={item.id}
                            node={item}
                            parent={self}
                            key={item.id}
                            refCount={itemRefCount}
                            shared={itemShared}
                            extended={item.extends}
                            editable={itemEditable}
                            keyEditable={itemKeyEditable}
                            view={self.props.view}
                            handleChildHover={self.handleChildHover}
                            content={self.props.content}
                        />);
                }
            });
        }
        return (
            <div
                className={AppUtils.getComponentClassNames(this)}
                onClick={this.handleClick}>
                <ComponentIcon
                    toggleId={this.props.node.id.replace(/\./g, "")}
                    node={this.props.node}
                    label="Manifest"
                    glyph="icon-file"
                    view={this.props.view}
                    collapsed={this.state.collapsed}
                    handleCollapse={this.handleCollapse}
                    showIcon={true}
                    showCheckbox={false}
                />
                <NavMenu
                    className="navMenu"
                    node={this.props.node}
                    component={this}
                    parent={null}
                    view={this.props.view}
                    active={this.state.selected}
                />
                <PropKey
                    className="editor-view"
                    id={this.props.node.id}
                    type="manifest"
                    propKey={this.props.node.id}
                    editable={false}
                    view={this.props.view}
                    content={this.props.content}
                />

                <div
                    className="col-xs-12 toggled-content panel-collapse collapse in"
                    id={this.props.node.id.replace(/\./g, "")}>
                    {items}
                </div>
            </div>
        )
    }
});
module.exports = Manifest;

