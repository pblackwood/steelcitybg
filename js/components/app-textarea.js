var React = require('react');

var AppActions = require('../actions/app-actions.js');
var AppKeys = require('../utils/app-keys');

var TextArea = React.createClass({
    getInitialState: function () {
        return {userInput: this.props.value};
    },
    componentDidMount: function () {
        this.refs.theInput.getDOMNode().focus();
    },
    handleChange: function (event) {
        this.setState({userInput: event.target.value});
    },
    handleBlur: function (event) {
        this.props.savePropValue(event, event.target.value);
    },
    handleKeyDown: function (event) {
        switch (event.which) {
            case AppKeys.ESCAPE:
                this.props.savePropValue(event, event.target.value);
                break;
            default:
                event.stopPropagation();
                break;
        }
    },
    render: function () {
        return (
            <div>
				<textarea
                    rows="10"
                    ref="theInput"
                    placeholder="Enter Value"
                    value={this.state.userInput}
                    disabled={!this.props.editable}
                    onChange={this.handleChange}
                    onBlur={this.handleBlur}
                    onKeyDown={this.handleKeyDown}
                    tabIndex={1}
                />
            </div>
        );
    }
});
module.exports = TextArea;
