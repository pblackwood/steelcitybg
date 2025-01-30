var React = require('react');
var OverlayMixin = require('react-bootstrap').OverlayMixin;
var Modal = require('react-bootstrap').Modal;
var AppStore = require('../../stores/app-store');
var AjaxSpinner = require('../AjaxSpinner');

/**
 * This modal will block the entire app with an ajax spinner in it.
 */
var AppBlockModal = React.createClass({

    mixins: [OverlayMixin],

    getInitialState: function () {
        return AppStore.getAppBlockRequest();
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState(AppStore.getAppBlockRequest());
        }
    },

    render: function () {
        return null;
    },

    renderOverlay: function () {
        if (this.state.showModal) {
            return (
                <Modal
                    className="app-block-modal"
                    {...this.props}
                    bsStyle="primary"
                    title=""
                    animation={false}>
                    <Modal.Header className="spinner">
                    </Modal.Header>
                    <div className="modal-body">
                        <AjaxSpinner imageFile="assets/images/spinner.svg"/>
                    </div>
                </Modal>
            );
        } else {
            return null;
        }
    }
});

module.exports = AppBlockModal;
