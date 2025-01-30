var React = require('react');
var AjaxSpinner = require('../AjaxSpinner');
var FolderTree = require('./foldertree');

var FolderBrowser = React.createClass({
    displayName: 'FolderBrowser',

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
                    <FolderTree
                        node={tree}
                        key={"foldertreeroot" + i}
                        handleSelection={self.handleSelection}
                        handleChildHover={self.handleChildHover}
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

module.exports = FolderBrowser;
