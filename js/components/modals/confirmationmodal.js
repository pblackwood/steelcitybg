var React = require('react');
var Button = require('react-bootstrap').Button;
var OverlayMixin = require('react-bootstrap').OverlayMixin;
var Modal = require('react-bootstrap').Modal;
var AppStore = require('../../stores/app-store');
var AppActions = require('../../actions/app-actions');

/**
 * This is a general-purpose confirmation dialog with a question and yes/no buttons.
 * All the information in the modal, and whether to show it, is controlled by the Store.
 */
var ConfirmationModal = React.createClass({

    mixins: [OverlayMixin],

    getInitialState: function () {
        return AppStore.getUserConfirmation();
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState(AppStore.getUserConfirmation());
        }
    },

    handleYes: function () {
        AppActions.userConfirmation(true);
    },

    handleNo: function () {
        AppActions.userConfirmation(false);
    },

    render: function () {
        return null;
    },

    renderOverlay: function () {
        if (this.state.showModal) {
            return (
                <Modal
                    className="confirmationModal"
                    {...this.props}
                    title={this.state.heading}
                    bsStyle="primary"
                    animation={true}
                    onRequestHide={this.handleNo}>
                    <div className="modal-body">
                        <p>{this.state.description}</p>
                        <p>{this.state.question}</p>
                    </div>
                    <div className="modal-footer">
                        <Button bsStyle="danger" onClick={this.handleYes}>Yes</Button>
                        <Button bsStyle="success" onClick={this.handleNo}>No</Button>
                    </div>
                </Modal>
            );
        } else {
            return null;
        }
    }
});

module.exports = ConfirmationModal;

