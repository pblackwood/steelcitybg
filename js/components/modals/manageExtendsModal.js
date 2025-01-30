var React = require('react');
var Button = require('react-bootstrap').Button;
var OverlayMixin = require('react-bootstrap').OverlayMixin;
var Modal = require('react-bootstrap').Modal;
var ExtensionManager = require('../app-extensionmanager');
var AppStore = require('../../stores/app-store');
var AppActions = require('../../actions/app-actions');

var ManageExtendsModal = React.createClass({

    mixins: [OverlayMixin],

    getInitialState: function () {
        var node = AppStore.getManageExtendsRequest().node;

        return {
            node: node,
            showModal: false,
            output: null,
            mode: null
        };
    },

    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },

    _onChange: function () {
        if (this.isMounted()) {
            var data = AppStore.getManageExtendsRequest();
            this.setState({
                node: data.node,
                showModal: data.showModal
            });
        }
    },

    onHide: function (event) {
        if (this.state.showModal) {
            AppActions.userManageExtensionModalClosed();
        }
    },

    handleClose: function (event) {
        AppActions.userManageExtensionModalClosed();
    },

    handleSubmit: function (e) {
        if (this.state.mode == 'include') {
            AppActions.includeChildren(this.state.node.id, this.state.output);
        } else {
            AppActions.excludeChildren(this.state.node.id, this.state.output);
        }
        AppActions.userManageExtensionModalClosed();
    },

    render: function () {
        return null;
    },

    updateValue: function (output, mode) {
        this.setState({output: output, mode: mode})
    },

    renderOverlay: function () {
        if (this.state.showModal) {
            return (
                <Modal
                    className='file-open-modal'
                    {...this.props}
                    bsStyle='primary'
                    onRequestHide={this.handleClose}>
                    <div className='modal-body'>
                        <ExtensionManager
                            className="extension-manager"
                            node={this.state.node}
                            updateValue={this.updateValue}
                            content={AppStore.getEditorContent()}
                        />
                    </div>
                    <div className='modal-footer'>
                        <Button bsStyle="primary"
                                onClick={this.handleSubmit}>Extend</Button>
                        <Button bsStyle="primary"
                                onClick={this.handleClose}>Close</Button>
                    </div>
                </Modal>
            );
        } else {
            return null;
        }
    }
});

module.exports = ManageExtendsModal;

