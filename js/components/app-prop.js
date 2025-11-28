var React = require('react');

var PropKey = require('../components/app-propkey.js');
var PropValue = require('../components/app-propvalue.js');
var NavMenu = require('../components/app-navmenu.js');
var ComponentIcon = require('./app-icon');

var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppUtils = require('../utils/app-utils.js');
var AppView = require('./app-view.js');
var AjaxSpinner = require('./AjaxSpinner');

var Prop = React.createClass({
    getInitialState: function () {
        return {
            selected: AppStore.isSelected(this.props.node.id),
            highlighted: false
        };
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
                selected: AppStore.isSelected(this.props.node.id)
            })
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

    render: function () {
        var tags;
        var node = this.props.node;
        var icon =
            <ComponentIcon
                toggleId={this.props.node.id}
                node={this.props.node}
                glyph="icon-font"
                extensionType={this.props.extensionType}
                extended={this.props.extended}
                view={this.props.view}
                collapsed={true}
                showIcon={!this.props.parent || !this.props.parent.props.node || this.props.parent.props.node.type != 'props'}
                showCheckbox={this.props.editable}
            />;

        if (this.props.view === AppView.SEARCH && node.tags) {
            var tagList = AppUtils.getTags(node.tags, this.props.query, this.props.matchCase);
            tags = <div className="col-xs-12 tags">{tagList}</div>
        }
        var value;
        if (node.pending) {
            value = <AjaxSpinner imageFile="assets/images/spinner.svg"/>;
        } else {
            value =
                <PropValue
                    className={node.excluded ? "excluded" : ""}
                    id={node.id}
                    value={this.props.content.getValue(node)}
                    view={this.props.view}
                    editable={this.props.editable}
                    editing={this.props.editable}
                />
        }

        return (
            <div
                className={AppUtils.getComponentClassNames(this)}
                onClick={this.handleClick}
                onMouseEnter={this.handleHover}
                onMouseLeave={this.handleHover}>
                {icon}
                <PropKey
                    className={" col-xs-12 col-sm-4 editor-view " + (node.excluded ? "excluded" : "")}
                    id={node.id}
                    type="prop"
                    propKey={node.key}
                    keyRef={node.ref}
                    editable={this.props.keyEditable}
                    view={this.props.view}
                    content={this.props.content}
                />

                <div className={"editor-value col-xs-12 " + (icon ? "col-sm-7" : "col-sm-8")}>
                    <NavMenu
                        className="navMenu"
                        node={node}
                        component={this}
                        parent={this.props.parent}
                        view={this.props.view}
                        active={this.state.selected || this.state.highlighted}
                        handleMode={this.handleMode}
                    />
                    {value}
                </div>
                {tags}
            </div>
        );
    }
});
module.exports = Prop;

