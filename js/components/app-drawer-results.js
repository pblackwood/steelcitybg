/**
 This is the drawer component that displays content search results
 */
var React = require('react');

var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view');
var Category = require('./app-category.js');
var Prop = require('./app-prop.js');
var Props = require('./app-props.js');
var Props2d = require('./app-props2d.js');

var DrawerResults = React.createClass({
    getDefaultProps: function () {
        return {query: ''};
    },
    getComponent: function (node) {
        switch (node.type) {
            case "category":
                return (<Category
                    className="drawer-search-result"
                    node={node}
                    parent={this}
                    editable={false}
                    locked={false}
                    extended={node.extends}
                    view={AppView.SEARCH}
                    handleChildHover={this.handleChildHover}
                    searchResult={true}
                    query={this.props.query}
                    matchCase={this.props.matchCase}
                    content={this.props.content}
                />);
            case "prop":
                return (<Prop
                    className="drawer-search-result"
                    node={node}
                    parent={this}
                    editable={false}
                    locked={false}
                    view={AppView.SEARCH}
                    handleChildHover={this.handleChildHover}
                    searchResult={true}
                    forceShowIcon={true}
                    query={this.props.query}
                    matchCase={this.props.matchCase}
                    content={this.props.content}
                />);
            case "props":
                return (<Props
                    className="drawer-search-result"
                    node={node}
                    parent={this}
                    editable={false}
                    locked={false}
                    extended={node.extends}
                    view={AppView.SEARCH}
                    handleChildHover={this.handleChildHover}
                    searchResult={true}
                    query={this.props.query}
                    matchCase={this.props.matchCase}
                    content={this.props.content}
                />);
            case "props2d":
                return (<Props2d
                    className="drawer-search-result"
                    node={node}
                    parent={this}
                    editable={false}
                    locked={false}
                    extended={node.extends}
                    view={AppView.SEARCH}
                    handleChildHover={this.handleChildHover}
                    searchResult={true}
                    query={this.props.query}
                    matchCase={this.props.matchCase}
                    content={this.props.content}
                />);
        }
    },
    handleClick: function (e) {
        AppActions.selectComponent(e.currentTarget.id, e.ctrlKey, e.shiftKey);
    },
    handleChildHover: function (childIsHighlighted) {
    },
    render: function () {
        var self = this;
        var searchResult;
        var root = this.props.content ? this.props.content.rootNode : null;
        var results = root && this.props.content.getValue(root);
        if (results && Array.isArray(results)) {
            searchResult = results.map(
                function (result, index) {
                    var component = self.getComponent(result);
                    return (<li className="drawer-preview" key={"sr-" + index}>
                        {component}
                    </li>);
                }
            );
        }
        return (
            <div className="drawer-search-results">
                <ul>
                    {searchResult}
                </ul>
            </div>
        )
    }
});

module.exports = DrawerResults;
