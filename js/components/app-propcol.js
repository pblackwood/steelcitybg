var React = require('react');

var PropKey = require('../components/app-propkey');
var PropValue = require('../components/app-propvalue.js');
var NavMenu = require('../components/app-navmenu');
var AppActions = require('../actions/app-actions.js');
var AppStore = require('../stores/app-store');
var AppUtils = require('../utils/app-utils');
var ComponentIcon = require('./app-icon');

var PropCol = React.createClass({
    getInitialState: function () {
        return {
            selected: AppStore.isSelected(this.props.node.id),
            highlighted: false
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
                selected: AppStore.isSelected(this.props.node.id)
            })
        }
    },
    handleSelection: function (event) {
        event.stopPropagation();
        if (this.props.editable) {
            AppActions.selectComponent(this.props.node.id, event.ctrlKey || event.metaKey, event.shiftKey);
            this.props.selectRow(this.props.node.id);
        }
    },
    handleHover: function (event) {
        var highlight = (event.type === "mouseenter");
        this.setState({highlighted: highlight});
        this.props.handleChildHover(highlight);
    },
    render: function () {
        var self = this;
        var cols = [];

        var children = this.props.content.getValue(this.props.node);
        if (children) {
            cols = children.map(function (col) {
                return (
                    <td key={col.id}>
                        <PropValue
                            id={col.id}
                            value={self.props.content.getValue(col)}
                            editable={self.props.editable}
                            editing={self.props.editable}
                            savePropValue={self.props.savePropValue}
                            view={self.props.view}
                        />
                    </td>
                );
            });
        }
        var navMenu;
        if ((this.props.editable && (this.state.selected || this.state.highlighted)) || (!this.props.editable && this.props.parent.props.extended)) {
            navMenu =
                <NavMenu
                    className="navMenuBar"
                    node={this.props.node}
                    component={this}
                    parent={this.props.parent}
                    view={this.props.view}
                    editable={true}
                    locked={false}
                    active={this.state.selected || this.state.highlighted}
                />
        }
        return (
            <tr className={AppUtils.getComponentClassNames(this, "tableRow")}>
                <th className={AppUtils.getComponentClassNames(this, "tableRowHeader")}
                    onClick={this.handleSelection}
                    onMouseEnter={this.handleHover}
                    onMouseLeave={this.handleHover}>
                    {navMenu}
                    <ComponentIcon
                        toggleId={this.props.node.id}
                        node={this.props.node}
                        glyph="list"
                        view={this.props.view}
                        collapsed={true}
                        showIcon={false}
                        showCheckbox={this.props.editable}
                    />
                    <PropKey
                        className={"editor-view tableColumnKey"}
                        id={this.props.node.id}
                        propKey={this.props.node.key}
                        editable={this.props.keyEditable}
                        view={this.props.view}
                        content={this.props.content}
                    />
                </th>
                {cols}
            </tr>
        );
    }
});
module.exports = PropCol;

