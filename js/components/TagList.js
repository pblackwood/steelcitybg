var React = require('react');
var Tag = require('./Tag');

var TagList = React.createClass({
    render: function () {
        var tags = [];
        var self = this;
        if (this.props.tags) {
            tags = this.props.tags.map(function (t, i) {
                return (
                    <Tag
                        className="tag"
                        key={"t" + i}
                        tag={t}
                        allowRemove={false}
                    />
                );
            });
        }
        return (
            <div
                className={this.props.className}>
                {tags}
            </div>
        );
    }
});

module.exports = TagList;

