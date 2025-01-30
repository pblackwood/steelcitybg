var React = require('react');
var Popover = require('react-bootstrap').Popover;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var AppKeys = require('../utils/app-keys');
var AppActions = require('../actions/app-actions');
var AppStore = require('../stores/app-store');
var AppView = require('./app-view');

var TextInput = React.createClass({
    getInitialState: function () {
        return {
            userInput: this.props.aKey,
            valid: this.props.valid,
            validationMessage: this.props.validationMessage
        }
    },
    componentWillReceiveProps: function (nextProps) {
        this.setState({
            valid: nextProps.valid,
            validationMessage: nextProps.validationMessage
        });
        // If the prop did not move or otherwise structurally change, use local state instead of from parent.
        if ((this.props.id !== nextProps.id) || AppStore.isUndoInProgress() || nextProps.reset) {
            this.setState({
                userInput: nextProps.aKey
            });
        }
    },
    componentDidMount: function () {
        if (this.props.editable && this.props.autofocus) {
            if (this.state.userInput && this.state.userInput.length > 0) {
                var len = this.state.userInput.length;
                this.refs.theInput.getDOMNode().setSelectionRange(len, len);
            }
            this.refs.theInput.getDOMNode().focus();
        }
    },
    componentDidUpdate: function () {
        if (this.refs.hasOwnProperty("overlayTrigger")) {
            if (this.state.showValidationMessage) {
                this.refs.overlayTrigger.show();
            } else {
                this.refs.overlayTrigger.hide();
            }
        }
    },
    handleChange: function (event) {
        this.setState({userInput: event.target.value});
    },
    handleMouseOut: function (event) {
        if (this.state.userInput != this.props.aKey) {
            var validKey = this.props.save(event, _.trim(this.state.userInput));
            this.setState({
                showValidationMessage: !validKey,
                userInput: _.trim(this.state.userInput)
            });
        }
    },
    handleKeyDown: function (event) {
        switch (event.which) {
            case AppKeys.ENTER:
                event.preventDefault();
                this.focusOnNextElement(event.target);
            // Intentional fall-through
            case AppKeys.TAB:
                var validKey = this.props.save(event, _.trim(this.state.userInput));
                this.setState({
                    showValidationMessage: !validKey,
                    userInput: _.trim(this.state.userInput)
                });
                break;
            case AppKeys.ESCAPE:
                this.props.handleReset();
                break;
        }
    },
    focusOnNextElement: function (element) {
        var parent = $(element).parents(".row").parents(".row").first();
        var children = parent.find("[tabindex='1']");
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            if (child.id === element.id && i < children.length - 1) {
                children[i + 1].focus();
                break;
            }
        }
    },
    render: function () {
        var popover, inputDiv, wrappedDiv;
        // 1. Make a popover if needed in two cases
        if (!this.state.valid && this.state.validationMessage) {
            popover =
                <Popover className="has-error">
                    {this.state.validationMessage}
                </Popover>
        }
        if (this.props.keyRef && this.props.view == AppView.EDITOR) {
            popover =
                <Popover title='Referenced Content'>
                    {this.props.keyRef}
                </Popover>
        }
        if (this.props.editable) {
            var input =
                <input
                    ref="theInput"
                    className="form-control"
                    type="text"
                    disabled={!this.props.editable}
                    value={this.state.userInput}
                    placeholder="Enter Key"
                    onFocus={this.handleFocus}
                    onMouseOut={this.handleMouseOut}
                    onChange={this.handleChange}
                    onKeyDown={this.handleKeyDown}
                    tabIndex={AppStore.isNewestNodeId(this.props.id) ? 999 : 1}
                />;

            // 2. Make a div to hold the input component
            if (this.state.valid) {
                inputDiv =
                    <div className={"form-group has-feedback has-success"}>
                        {input}
                    </div>
            } else {
                inputDiv =
                    <div className={"form-group has-feedback has-error"}>
                        {input}
                        <i className={"icon-exclamation-sign form-control-feedback"}></i>
                    </div>
            }
        } else {
            // Not editable
            inputDiv =
                <span>{this.state.userInput}</span>;
        }

        // 3. Wrap the div in an overlay trigger if needed
        if ((this.props.editable && !this.state.valid && this.state.validationMessage) || (this.props.keyRef && this.props.view == AppView.EDITOR)) {
            var triggers = ['hover', 'click', 'focus'];
            wrappedDiv =
                <OverlayTrigger ref="overlayTrigger" trigger={triggers} placement="top" overlay={popover}>
                    {inputDiv}
                </OverlayTrigger>
        } else {
            wrappedDiv = inputDiv;
        }
        return wrappedDiv;
    }
});

module.exports = TextInput;
