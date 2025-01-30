var React = require('react');

var TextArea = require('../components/app-textarea.js');
var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var marked = require('marked');
var AppUtils = require('../utils/app-utils.js');
var AppView = require('./app-view');

var PropValue = React.createClass({

    getInitialState: function () {
        return {inEdit: false};
    },
    savePropValue: function (event, value) {
        AppActions.savePropValue(this.props.id, value);
        this.setState({inEdit: false})
    },
    handleFocus: function (event) {
        if (this.props.editable && !this.state.inEdit) {
            this.setState({inEdit: true});
        }
    },
    handleBlur: function (event) {
        if (this.state.inEdit) {
            this.setState({inEdit: false});
        }
    },
    handleClick: function (event) {
        if (this.props.editable) {
            this.setState({inEdit: true});
        }
    },
    render: function () {
        var value;
        var content = AppUtils.removeMarkup(this.props.value);
        var replacements = {
            start: '<div class="drawer-word-match">',
            end: '</div>'
        };

        if (this.state.inEdit) {
            value =
                <TextArea
                    id={this.props.id}
                    value={content}
                    savePropValue={this.savePropValue}
                    editable={this.props.editable}
                />
        } else {
            value =
                <div
                    ref="readonly"
                    className={this.props.value ? "prop-value" : "prop-value-placeholder"}
                    dangerouslySetInnerHTML={{__html: (content ? marked(content) : marked("Enter Value"))}}
                    tabIndex={this.props.editable ? 1 : 0}
                />
        }
        if (this.props.view === AppView.SEARCH) {
            content = AppUtils.addMarkup(replacements, this.props.value);
            value = <div dangerouslySetInnerHTML={{__html: content}}/>
        }
        return (
            <div
                className={"propValue " + this.props.className}
                onClick={this.handleClick}
                onKeyDown={this.handleKeyDown}
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}>
                {value}
            </div>
        )
    }
});
module.exports = PropValue;