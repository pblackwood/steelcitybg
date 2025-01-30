var React = require('react');
var Button = require('react-bootstrap').Button;
var OverlayMixin = require('react-bootstrap').OverlayMixin;
var Modal = require('react-bootstrap').Modal;
var FileOpener = require('../app-fileopener');
var AppStore = require('../../stores/app-store');
var AppActions = require('../../actions/app-actions');

var FileOpenModal = React.createClass({

    mixins: [OverlayMixin],

    getInitialState: function () {
        var obj = AppStore.getFileOpenRequest();
        obj.loading = AppStore.isManifestLoading();
        return obj;
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            var obj = AppStore.getFileOpenRequest();
            obj.loading = AppStore.isManifestLoading();
            this.setState(obj);
        }
    },

    onHide: function (event) {
        if (!this.state.loading) {
            AppActions.userFileModalClosed();
        }
    },

    handleClose: function (event) {
        if (!this.state.loading) {
            AppActions.userFileModalClosed();
        }
    },

    handleSelection: function (name) {
        this.props.handleSelectManifest(name);
    },

    render: function () {
        return null;
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
                        <FileOpener
                            className="file-opener file-opener-modal"
                            style={this.props.selectionStyle}
                            manifestList={this.props.manifestList}
                            manifestTree={this.props.manifestTree}
                            manifest={this.props.manifest}
                            handleSelectManifest={this.handleSelection}
                        />
                    </div>
                    <div className='modal-footer'>
                        <Button bsStyle="primary" disabled={this.state.loading}
                                onClick={this.handleClose}>Close</Button>
                    </div>
                </Modal>
            );
        } else {
            return null;
        }
    }
});

module.exports = FileOpenModal;

