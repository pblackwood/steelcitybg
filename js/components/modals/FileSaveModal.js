var React = require('react');
var Button = require('react-bootstrap').Button;
var OverlayMixin = require('react-bootstrap').OverlayMixin;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var AppStore = require('../../stores/app-store');
var AppActions = require('../../actions/app-actions');
var FolderBrowser = require('../trees/folderbrowser');

var FileSaveModal = React.createClass({

    mixins: [OverlayMixin],

    getInitialState: function () {
        return AppStore.getFileSaveRequest();
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState(AppStore.getFileSaveRequest());
        }
    },

    handleOk: function () {
        var booleanResponse = false;
        if (this.state.booleanPrompt) {
            var domNode = $("#inputRequestCheckbox:checked");
            booleanResponse = domNode.length > 0;
        }
        AppActions.fileSaveResponse(this.state.fullName, booleanResponse);
    },

    handleFolderSelection: function (folder) {
        var fullName = this.state.fileName ? (folder + "." + this.state.fileName) : "";
        this.setState({
            folderName: folder,
            fullName: fullName
        });
    },

    handleFileNameChange: function () {
        var domNode = $("#fileNameInput");
        var text = domNode.val();
        var fullName = this.state.folderName && text ? (this.state.folderName + "." + text) : "";
        this.setState({
            fileName: text,
            fullName: fullName
        });
    },

    handleCancel: function () {
        AppActions.fileSaveResponse(null);
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
                    className="file-save-modal"
                    {...this.props}
                    bsStyle="primary"
                    title={this.state.heading}
                    animation={true}
                    onHide={this.handleCancel}>
                    <div className="modal-body">
                        <p className="file-save-prompt">{this.state.prompt}</p>
                        <FolderBrowser
                            disabled={false}
                            root={this.props.manifestTree}
                            handleSelection={this.handleFolderSelection}
                        />

                        <form className="form-horizontal">
                            <Input
                                id="fileNameInput"
                                type="text"
                                label="Document Name:"
                                labelClassName='file-name-input-label col-xs-3'
                                wrapperClassName='file-name-input col-xs-9'
                                value={this.state.fileName}
                                onChange={this.handleFileNameChange}
                                placeholder={this.state.placeholder}
                            />
                        </form>
                        <p className="file-save-full-name">{this.state.fullName ? ("Full document name: " + this.state.fullName) : ""}</p>
                        <p className="validationMessage">{this.state.validationMessage}</p>
                        {optionalCheckboxArea}
                    </div>
                    <div className="modal-footer">
                        <Button id="fileSaveOk" bsStyle="danger" disabled={!this.state.fullName}
                                onClick={this.handleOk}>Ok</Button>
                        <Button bsStyle="primary" onClick={this.handleCancel}>Cancel</Button>
                    </div>
                </Modal>
            );
        } else {
            return null;
        }
    }
});

module.exports = FileSaveModal;

