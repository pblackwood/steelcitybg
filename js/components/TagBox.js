var React = require('react');
var Typeahead = require('./typeahead/Typeahead');
var AppStore = require('../stores/app-store');
var AppKeys = require('../utils/app-keys');
var Tag = require('./Tag');

var TagBox = React.createClass({
    getInitialState: function () {
        return {
            options: AppStore.getAllTags(),
            editing: false
        }
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    componentDidUpdate: function () {
        if (this.state.editing) {
            var obj = React.findDOMNode(this.refs.typeahead);
            obj.children[0].focus();
        }
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState({
                options: AppStore.getAllTags()
            });
        }
    },
    filterOption: function (inputVal, option) {
        // Provides startsWith functionality without (yet) using ES6
        if (option.length >= inputVal.length) {
            return option.substring(0, inputVal.length) === inputVal;
        } else {
            return false;
        }
    },
    handleAddTag: function (tag) {
        if (tag.length > 0) {
            this.props.handleAddTag(tag);
            var ta = this.refs.typeahead;
            ta.setEntryText('');
        }
    },
    handleRemoveTag: function (tag) {
        this.props.handleRemoveTag(tag);
    },
    handleKeyDown: function (event) {
        switch (event.which) {
            case AppKeys.ENTER:
                var val = React.findDOMNode(this.refs.typeahead).children[0].value;
                this.handleAddTag(val);
                break;
            case AppKeys.ESCAPE:
                this.setState({
                    editing: false
                });
                break;
            case AppKeys.THREE:
                if (event.shiftKey) {
                    // Hashtag
                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
        }
    },
    handleClick: function (event) {
        this.setState({
            editing: true
        });
    },
    render: function () {
        var tags = [];
        var self = this;
        var box;
        if (this.props.tags) {
            tags = this.props.tags.map(function (t, i) {
                return (
                    <Tag
                        className="tag"
                        key={"t" + i}
                        tag={t}
                        allowRemove={self.state.editing}
                        handleRemoveTag={self.handleRemoveTag}
                    />
                );
            });
        } else if (!this.state.editing) {
            tags = <div className="tag-prompt">Add tags</div>;
        }
        if (this.state.editing) {
            box =
                <div
                    className={this.props.className}>
                    {tags}
                    <Typeahead
                        ref="typeahead"
                        placeholder="Add tags"
                        options={this.state.options}
                        maxVisible={5}
                        onOptionSelected={this.handleAddTag}
                        onKeyDown={this.handleKeyDown}
                        value=''
                        filterOption={this.filterOption}
                        customClasses={{
                            input: 'typeahead-input',
                            results: 'typeahead-results',
                            listItem: 'typeahead-listitem',
                            listAnchor: 'typeahead-listanchor',
                            hover: 'typeahead-hover'
                        }}
                    />
                </div>
        } else {
            box =
                <div
                    className={this.props.className}
                    onClick={this.handleClick}>
                    {tags}
                </div>
        }
        return (
            box
        )
    }
});

module.exports = TagBox;

