var React = require('react');

var NavMenu = require('../components/app-navmenu');

var Prop = require('../components/app-prop.js');
var Props = require('../components/app-props.js');
var Props2d = require('../components/app-props2d.js');
var PropKey = require('../components/app-propkey.js');

var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view');
var AppUtils = require('../utils/app-utils.js');
var AjaxSpinner = require('./AjaxSpinner');

var App = require('./app');
var ComponentIcon = require('./app-icon');

var Category = React.createClass({
    getInitialState: function () {
        return {
            selected: AppStore.isSelected(this.props.node.id),
            highlighted: false,
            collapsed: AppStore.getCollapsedState(this.props.view, this.props.node.id, this.props.node.type)
        }
    },
    componentWillReceiveProps: function (nextProps) {
        var collapsed = AppStore.getCollapsedState(this.props.view, this.props.node.id, this.props.node.type);
        if (collapsed) {
            $('#' + this.props.node.id).collapse("hide");
        } else {
            $('#' + this.props.node.id).collapse("show");
        }

        this.setState({
            selected: AppStore.isSelected(nextProps.node.id),
            collapsed: collapsed
        });
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentDidMount: function () {
        if (this.state.collapsed) {
            $('#' + this.props.node.id).collapse("hide");
        } else {
            $('#' + this.props.node.id).collapse("show");
        }
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
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
            AppActions.selectComponent(this.props.node.id, event.ctrlKey || event.metaKey, event.shiftKey);
        }
    },
    handleHover: function (event) {
        var highlight = (event.type === "mouseenter");
        this.setState({highlighted: highlight});
        this.props.handleChildHover(highlight);
    },
    handleChildHover: function (childIsHighlighted) {
        this.setState({highlighted: !childIsHighlighted});
    },
    handleCollapse: function (event) {
        if (!this.state.collapsed) {
            event.stopPropagation();
        }
        AppStore.setCollapsedState(this.props.view, this.props.node.id, !this.state.collapsed);
        this.setState({collapsed: !this.state.collapsed});
    },
    render: function () {
        var self = this;
        var items;
        var tags;
        if (this.props.node.pending) {
            items =
                <AjaxSpinner imageFile="assets/images/spinner.svg"/>;
        } else {
            var children = this.props.content.getValue(this.props.node);
            if (children) {
                items = children.map(function (item) {
                    var itemRefCount = item.refs ? item.refs.length : 0;
                    var itemShared = AppUtils.isShared("category", self, item);
                    var itemEditable = AppUtils.isEditable("category", self, item);
                    var itemKeyEditable = AppUtils.isKeyEditable("category", self, item);
                    switch (item.type) {
                        case "category":
                            return (<Category
                                node={item}
                                parent={self}
                                key={item.id}
                                refCount={itemRefCount}
                                shared={itemShared}
                                extended={item.extends}
                                extensionType={item.extension}
                                editable={itemEditable}
                                keyEditable={itemKeyEditable}
                                view={self.props.view}
                                handleChildHover={self.handleChildHover}
                                searchResult={self.props.searchResult}
                                query={self.props.query}
                                matchCase={self.props.matchCase}
                                content={self.props.content}
                            />);
                        case "prop":
                            return (<Prop
                                node={item}
                                parent={self}
                                key={item.id}
                                refCount={itemRefCount}
                                shared={itemShared}
                                extensionType={item.extension}
                                editable={itemEditable}
                                keyEditable={itemKeyEditable}
                                view={self.props.view}
                                handleChildHover={self.handleChildHover}
                                searchResult={self.props.searchResult}
                                query={self.props.query}
                                matchCase={self.props.matchCase}
                                content={self.props.content}
                            />);
                        case "props":
                            return (<Props
                                node={item}
                                parent={self}
                                key={item.id}
                                refCount={itemRefCount}
                                shared={itemShared}
                                extended={item.extends}
                                extensionType={item.extension}
                                editable={itemEditable}
                                keyEditable={itemKeyEditable}
                                view={self.props.view}
                                handleChildHover={self.handleChildHover}
                                searchResult={self.props.searchResult}
                                query={self.props.query}
                                matchCase={self.props.matchCase}
                                content={self.props.content}
                            />);
                        case "props2d":
                            return (<Props2d
                                node={item}
                                parent={self}
                                key={item.id}
                                refCount={itemRefCount}
                                shared={itemShared}
                                extended={item.extends}
                                extensionType={item.extension}
                                editable={itemEditable}
                                keyEditable={itemKeyEditable}
                                view={self.props.view}
                                handleChildHover={self.handleChildHover}
                                searchResult={self.props.searchResult}
                                query={self.props.query}
                                matchCase={self.props.matchCase}
                                content={self.props.content}
                            />);
                    }
                })
            }
        }

        if (this.props.view.value === AppView.SEARCH.value && this.props.node.tags) {
            var tagList = AppUtils.getTags(this.props.node.tags, this.props.query, this.props.matchCase);
            tags = <div className="col-xs-12 tags">{tagList}</div>
        }

        return (
            <div
                className={AppUtils.getComponentClassNames(this)}
                onClick={this.handleClick}
                onMouseEnter={this.handleHover}
                onMouseLeave={this.handleHover}>
                <ComponentIcon
                    toggleId={this.props.node.id}
                    node={this.props.node}
                    label="Category"
                    extensionType={this.props.extensionType}
                    glyph="icon-folder-open"
                    extended={this.props.extended}
                    view={this.props.view}
                    collapsed={this.state.collapsed}
                    handleCollapse={this.handleCollapse}
                    showIcon={true}
                    showCheckbox={this.props.editable}
                />
                <NavMenu
                    className="navMenu"
                    node={this.props.node}
                    component={this}
                    parent={this.props.parent}
                    view={this.props.view}
                    active={this.state.selected || this.state.highlighted}
                />
                <PropKey
                    className="editor-view"
                    id={this.props.node.id}
                    type="category"
                    propKey={this.props.node.key}
                    keyRef={this.props.node.ref}
                    editable={this.props.keyEditable}
                    view={this.props.view}
                    content={this.props.content}
                />

                <div
                    className="col-xs-12 panel-collapse collapse in"
                    id={this.props.node.id}>
                    {items}
                </div>
                {tags}
            </div>
        );
    }
});
module.exports = Category;

