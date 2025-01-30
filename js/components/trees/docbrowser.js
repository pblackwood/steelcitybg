var React = require('react');
var AjaxSpinner = require('../AjaxSpinner');
var DocTree = require('./doctree');
var FolderTree = require('./foldertree');

var DocBrowser = React.createClass({
    displayName: 'DocBrowser',

    handleSelection: function (name) {
        if (!this.props.disabled) {
            this.props.handleSelection(name);
        }
    },

    handleChildHover: function (childIsHighlighted) {
    },

    render: function () {
        var trees;
        var spinner;
        var self = this;
        if (this.props.root && this.props.root.children) {
            trees = this.props.root.children.map(function (tree, i) {
                return (
                    <DocTree
                        node={tree}
                        key={"doctreeroot" + i}
                        editable={false}
                        foldersOnly={true}
                        handleSelection={self.handleSelection}
                    />
                );
            });
        }
        if (this.props.disabled) {
            spinner =
                <AjaxSpinner imageFile="assets/images/spinner.svg"/>;
        }
        return (
            <div>
                <div className={"file-input " + (this.props.disabled ? "disabled" : "")}>
                    {trees}
                </div>
                {spinner}
            </div>
        );
    }
});

module.exports = DocBrowser;
