var React = require('react');
var Button = require('react-bootstrap').Button;
var OverlayMixin = require('react-bootstrap').OverlayMixin;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var AppStore = require('../../stores/app-store');
var AppActions = require('../../actions/app-actions');

/**
 * This is a general-purpose input request dialog with a prompt and a text input.
 * All the information in the modal, and whether to show it, is controlled by the Store.
 */
var InputRequestModal = React.createClass({

    mixins: [OverlayMixin],

    getInitialState: function () {
        return AppStore.getUserInputRequest();
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState(AppStore.getUserInputRequest());
        }
    },

    handleOk: function () {
        var domNode = $("#inputRequestTextInput");
        var textResponse = domNode.val();
        var booleanResponse = false;
        if (this.state.booleanPrompt) {
            domNode = $("#inputRequestCheckbox:checked");
            booleanResponse = domNode.length > 0;
        }
        AppActions.userInputResponse(textResponse ? textResponse : " ", booleanResponse);
    },

    handleCancel: function () {
        AppActions.userInputResponse(null);
    },

    render: function () {
        return null;
    },

    renderOverlay: function () {
        if (this.state.showModal) {
            var optionalCheckboxArea;
            if (this.state.booleanPrompt) {
                optionalCheckboxArea =
                    <div className="input-request-checkbox-area">
                        <Input
                            id="inputRequestCheckbox"
                            type="checkbox"
                            label={this.state.booleanPrompt}
                        />
                    </div>;
            }
            return (
                <Modal
                    className="confirmationModal"
                    {...this.props}
                    bsStyle="primary"
                    title={this.state.heading}
                    animation={true}
                    onRequestHide={this.handleCancel}>
                    <div className="modal-body">
                        <p>{this.state.prompt}</p>
                        <Input
                            id="inputRequestTextInput"
                            type="text"
                            className="confirmationModal"
                            placeholder={this.state.placeholder}
                        />
                        <p className="validationMessage">{this.state.validationMessage}</p>
                        {optionalCheckboxArea}
                    </div>
                    <div className="modal-footer">
                        <Button bsStyle="danger" onClick={this.handleOk}>Ok</Button>
                        <Button bsStyle="success" onClick={this.handleCancel}>Cancel</Button>
                    </div>
                </Modal>
            );
        } else {
            return null;
        }
    }
});

module.exports = InputRequestModal;

