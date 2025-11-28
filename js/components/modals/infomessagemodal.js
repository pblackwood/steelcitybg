var React = require('react');
var Button = require('react-bootstrap').Button;
var OverlayMixin = require('react-bootstrap').OverlayMixin;
var Modal = require('react-bootstrap').Modal;
var Image = require('react-bootstrap').Image;
var AppStore = require('../../stores/app-store');
var AppActions = require('../../actions/app-actions');

/**
 * This is a general-purpose message box modal.
 * All the information in the modal, and whether to show it, is controlled by the Store.
 */
var InfoMessageModal = React.createClass({

    mixins: [OverlayMixin],

    getInitialState: function () {
        return AppStore.getUserInfoMessage();
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState(AppStore.getUserInfoMessage());
        }
    },

    handleOk: function () {
        AppActions.userMessageDismissed();
    },

    render: function () {
        return null;
    },

    renderOverlay: function () {
        if (this.state.showModal) {
            var glyph;
            switch (this.state.messageType) {
                case "warning":
                case "danger":
                    glyph = "icon-exclamation-sign";
                    break;
                case "info":
                case "success":
                    glyph = "icon-info-sign";
                    break;
            }
            var title =
                <h4 className="modal-heading">
					<span>
						<i className={glyph}/>
					</span>
                    <p className="title">{this.state.heading}</p>
                </h4>;

            return (
                <Modal
                    {...this.props}
                    className={"messageModal"}
                    closeButton={false}
                    animation={true}
                    onRequestHide={this.handleOk}>
                    <div className="modal-body">
                        <div className="brand">
                            <img className="logo" src="assets/images/korn-ferry-cloud-logo.png"/>
                        </div>
                        <p className="message">{this.state.message1}</p>
                        <p className="message">{this.state.message2}</p>

                        <p className="message">{this.state.message3}</p>
                    </div>
                    <div className="modal-footer">
                        <Button bsStyle={this.state.messageType} onClick={this.handleOk}>OK</Button>
                    </div>
                </Modal>
            );
        } else {
            return null;
        }
    }
});

module.exports = InfoMessageModal;

