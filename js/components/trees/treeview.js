var React = require('react');
var AppStore = require('../../stores/app-store.js');
var Tree = require('./tree');

var TreeView = React.createClass({
    displayName: 'TreeView',

    componentDidMount: function () {
        this.setState({loading: true});
    },

    handleChildHover: function (childIsHighlighted) {
    },

    render: function () {
        return (
            <div className="tree-view-background">
                <div className="tree-view-container">
                    <Tree
                        node={this.props.root}
                        nodeType='manifest'
                        nodeLabel={this.props.root.id}
                        handleChildHover={this.handleChildHover}
                        editable={this.props.editable}
                        keyEditable={false}
                        locked={this.props.checkedOut || !this.props.editable}
                        content={this.props.content}
                    />
                </div>
            </div>
        );
    }
});

module.exports = TreeView;
