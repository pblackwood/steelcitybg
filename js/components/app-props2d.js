var React = require('react');

var Table = require('react-bootstrap').Table;
var NavMenu = require('../components/app-navmenu');

var PropKey = require('../components/app-propkey');
var Props = require('../components/app-props.js');
var PropCol = require('../components/app-propcol.js');
var TableColumnKey = require('../components/app-tablecolumnkey.js');

var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view');
var AppUtils = require('../utils/app-utils.js');
var AjaxSpinner = require('./AjaxSpinner');

var App = require('./app');
var ComponentIcon = require('./app-icon');

var Props2d = React.createClass({
    getInitialState: function () {
        return {
            selected: AppStore.isSelected(this.props.node.id),
            highlighted: false,
            collapsed: AppStore.getCollapsedState(this.props.view, this.props.node.id, this.props.node.type)
        };
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
    handleSavePropValue: function (event, value) {
        event.stopPropagation();
        AppActions.savePropValue(this.props.node.id, value);
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
        this.setState({collapsed: !this.state.collapsed});
        AppStore.setCollapsedState(this.props.view, this.props.node.id, !this.state.collapsed);
    },
    handleDereference: function () {
        this.setState({editable: true});
    },
    selectRow: function (rowId) {
        this.setState({selectedRow: rowId});
    },
    selectColumn: function (colId, colIndex) {
        this.setState({selectedColumn: colId});
        this.setState({selectedColumnIndex: colIndex});
    },
    render: function () {
        var self = this;
        var tags;
        var rows = [];
        var children = this.props.content.getValue(this.props.node, ["props"]);
        if (children && children.length > 0) {
            rows = children.map(function (row, i) {
                var rowEditable = AppUtils.isEditable("props2d", self, row);
                var rowKeyEditable = AppUtils.isKeyEditable("props2d", self, row);
                return (
                    <PropCol
                        node={row}
                        parent={self}
                        key={"row" + i}
                        refCount={0}
                        shared={false}
                        extensionType={row.extension}
                        editable={rowEditable}
                        keyEditable={rowKeyEditable}
                        savePropValue={self.handleSavePropValue}
                        selectRow={self.selectRow}
                        view={self.props.view}
                        handleChildHover={self.handleChildHover}
                        query={self.props.query}
                        matchCase={self.props.matchCase}
                        content={self.props.content}
                    />
                );
            });

            var colKeys = [];
            var cols = this.props.content.getValue(children[0], ["prop"]);
            if (cols && cols.length > 0) {
                colKeys = cols.map(function (col, i) {
                    var colEditable = AppUtils.isEditable("props2d", self, col);
                    var colKeyEditable = AppUtils.isEditable("props2d", self, col);
                    return (
                        <TableColumnKey
                            node={col}
                            parent={self}
                            tableId={self.props.node.id}
                            key={col.id}
                            refCount={0}
                            shared={false}
                            editable={colEditable}
                            keyEditable={colKeyEditable}
                            colIndex={i}
                            selectColumn={self.selectColumn}
                            handleChildHover={self.handleChildHover}
                            content={self.props.content}
                        />
                    );
                });
            }
        }
        var toggledContent;
        if (this.props.node.pending) {
            toggledContent =
                <AjaxSpinner imageFile="assets/images/spinner.svg"/>;
        } else {
            toggledContent =
                <table>
                    <thead>
                    <tr>
                        <th
                            className={this.props.editable ? "tableColumn" : "componentReadOnly"}>
                            &nbsp;
                        </th>
                        {colKeys}
                    </tr>
                    </thead>
                    <tbody>
                    {rows}
                    </tbody>
                </table>;
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
                    label="Table"
                    glyph="icon-th-large"
                    extensionType={this.props.extensionType}
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
                    handleDereference={this.handleDereference}
                />
                <PropKey
                    className="editor-view"
                    id={this.props.node.id}
                    type="props2d"
                    propKey={this.props.node.key}
                    keyRef={this.props.node.ref}
                    editable={this.props.keyEditable}
                    view={this.props.view}
                    content={this.props.content}
                />

                <div
                    className="col-xs-12 panel-collapse collapse in"
                    id={this.props.node.id}>
                    {toggledContent}
                </div>
                {tags}
            </div>
        );
    }
});
module.exports = Props2d;