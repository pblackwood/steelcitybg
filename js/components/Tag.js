var React = require('react');

var Tag = React.createClass({
    handleRemoveTag: function () {
        this.props.handleRemoveTag(this.props.tag);
    },
    render: function () {
        var anchor;
        if (this.props.allowRemove) {
            anchor =
                <a onClick={this.handleRemoveTag}>x</a>;
        }
        return (
            <div className={this.props.className}>
                {"#" + this.props.tag}
                {anchor}
            </div>
        )
    }
});

module.exports = Tag;
