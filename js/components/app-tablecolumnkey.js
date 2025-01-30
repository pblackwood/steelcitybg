var React = require('react');

var NavMenu = require('../components/app-navmenu');
var PropKey = require('../components/app-propkey');
var AppActions = require('../actions/app-actions');
var AppStore = require('../stores/app-store');

var TableColumnKey = React.createClass({
    getInitialState: function () {
        return {
            selected: AppStore.isSelected(this.props.node.id),
            highlighted: false
        }
    },
    componentWillReceiveProps: function (nextProps) {
        this.setState({
            selected: AppStore.isSelected(nextProps.colId)
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
            });
        }
    },
    saveColKey: function (event, key) {
        AppActions.saveTableColumnKey(this.props.tableId, this.props.node.id, this.props.colIndex, key);
    },
    handleSelection: function (event) {
        event.stopPropagation();
        if (this.props.editable) {
            AppActions.selectComponent(this.props.node.id, event.ctrlKey || event.metaKey, event.shiftKey);
            this.props.selectColumn(this.props.node.id, this.props.colIndex);
        }
    },
    handleHover: function (event) {
        var highlight = (event.type === "mouseenter");
        this.setState({highlighted: highlight});
        this.props.handleChildHover(highlight);
    },
    render: function () {
        var navMenu;
        if (this.props.editable && (this.state.selected || this.state.highlighted)) {
            navMenu =
                <NavMenu
                    className="navMenuBar"
                    node={this.props.node}
                    component={this}
                    parent={this.props.parent}
                    tableId={this.props.tableId}
                    colIndex={this.props.colIndex}
                    view={this.props.view}
                    editable={true}
                    locked={false}
                    active={true}
                />
        }
        return (
            <th
                className={"row tableColumn " +
                    (this.props.editable ? "" : "componentReadOnly ") +
                    (this.state.selected ? "componentSelected " : "") +
                    (this.state.highlighted ? "componentHighlighted " : "")}
                onClick={this.handleSelection}
                onMouseEnter={this.handleHover}
                onMouseLeave={this.handleHover}>
                {navMenu}
                <PropKey
                    className={"editor-view tableColumnKey"}
                    id={this.props.node.id}
                    propKey={this.props.node.key}
                    parentSaveKey={this.saveColKey}
                    editing={this.props.editable}
                    editable={this.props.editable}
                    view={this.props.view}
                    content={this.props.content}
                />
            </th>
        );
    }
});
module.exports = TableColumnKey;
