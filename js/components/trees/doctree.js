var React = require('react');

var DocTree = React.createClass({

    displayName: 'DocTree',

    getInitialState: function () {
        return {
            collapsed: !this.props.node.expanded
        }
    },

    handleClick: function (event) {
        if (this.props.node.type == 'folder') {
            this.setState({
                collapsed: !this.state.collapsed
            });
            this.props.node.expanded = this.state.collapsed;
        } else {
            this.props.handleSelection(this.props.node.recoverPath());
        }
    },

    glyphs: {
        file: 'icon-file-text-alt',
        //open: 'fa fa-plus-square-o',
        //close: 'fa fa-minus-square-o'
        open: 'fa fa-folder-o',
        close: 'fa fa-folder-open-o'
    },

    render: function () {
        var containerClassName = 'tree-view-children';
        if (this.state.collapsed) {
            containerClassName += ' tree-view-children-collapsed';
        }

        var children;
        var node = this.props.node;
        if (!this.state.collapsed && node.children.length > 0) {
            var self = this;
            children = node.children.map(function (childNode, i) {
                return (
                    <DocTree
                        node={childNode}
                        handleSelection={self.props.handleSelection}
                    />
                )
            });
        }

        var openclose;
        if (node.type == 'folder' && this.state.collapsed) {
            openclose = <i className={this.glyphs['open']}/>
        } else if (node.type == 'folder' && !this.state.collapsed) {
            openclose = <i className={this.glyphs['close']}/>
        } else {
            openclose = <i className={this.glyphs['file']}/>
        }

        var nodeView =
            <div className="tree-node" onClick={this.handleClick}>
                {openclose}
                <span className="node-name">{node.name}</span>
            </div>;

        return (
            <div>
                {nodeView}
                <div className={containerClassName}>
                    {children}
                </div>
            </div>
        )
    }
});

module.exports = DocTree;

