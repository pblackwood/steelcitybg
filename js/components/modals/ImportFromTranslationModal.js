var React = require('react');
var moment = require('moment');
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
var ButtonInput = require('react-bootstrap').ButtonInput;
var Input = require('react-bootstrap').Input;
var Glyphicon = require('react-bootstrap').Glyphicon;
var FormControls = require('react-bootstrap').FormControls;
var AppActions = require('../../actions/app-actions');
var AppConstants = require('../../constants/app-constants');
var AppStore = require('../../stores/app-store');
var WebUtils = require('../../utils/app-web-api-utils');

var ImportFromTranslationModal = React.createClass({

    getInitialState: function () {
        var messages = AppStore.getContentImportMessage();
        messages.validationMessage = '';
        return messages;
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState(AppStore.getContentImportMessage());
        }
    },
    validateInputLang: function (event) {
        var lang = this.refs.lang.getValue();
        if (lang) {
            this.setState({
                validationMessage: '',
                serverResponseMessage: ''
            });
        }
    },
    validateInputFile: function (event) {
        var file = this.refs.file.getValue();
        if (file) {
            this.setState({
                validationMessage: '',
                serverResponseMessage: ''
            });
        }
    },
    handleSubmit: function (event) {
        var lang = this.refs.lang.getValue();
        var file = document.getElementById('fileInput').files[0];

        var validationMessage;
        if (!file) {
            validationMessage = "Please choose a file to import";
        } else if (!lang) {
            validationMessage = "Please choose a language";
        }
        if (validationMessage) {
            this.setState({
                validationMessage: validationMessage,
            });
        } else {
            AppStore.clearContentImportMessage();
            AppActions.importManifest(file, lang);
        }
    },
    handleClose: function (event) {
        this.props.onRequestHide(event);
    },
    render: function () {
        var langOptions = [];
        langOptions.push(<option key="" value="">Select</option>);
        langOptions.push(AppConstants.SupportedLangs.map(function (lang) {
            return <option key={lang} value={lang}>{lang}</option>
        }));
        var validationMessage = this.state.validationMessage &&
            <FormControls.Static className="validationMessage col-xs-8 col-xs-offset-4">
                {this.state.validationMessage}
            </FormControls.Static>;

        var serverResponseMessage = this.state.serverResponseMessage &&
            <FormControls.Static className="serverResponseMessage col-xs-8 col-xs-offset-4">
                {this.state.serverResponseMessage}
            </FormControls.Static>;

        return (
            <Modal {...this.props}
                   className="translationModal"
                   title="Import from Translation"
                   bsStyle="primary">
                <div className="modal-body">
                    <form className="form-horizontal">
                        <Input
                            id='fileInput'
                            type='file'
                            ref='file'
                            name='file'
                            label='File to Import'
                            onChange={this.validateInputFile}
                            labelClassName='col-xs-4'
                            wrapperClassName='file-chooser col-xs-3'>
                        </Input>
                        <Input
                            type='select'
                            ref='lang'
                            label='Language'
                            required={true}
                            onChange={this.validateInputLang}
                            labelClassName='col-xs-4'
                            wrapperClassName='lang-chooser col-xs-3'>
                            {langOptions}
                        </Input>
                        {validationMessage}
                        <ButtonInput
                            label={"\u00a0"}
                            value='Submit'
                            onClick={this.handleSubmit}
                            labelClassName='col-xs-4'
                            wrapperClassName='col-xs-3'>
                        </ButtonInput>
                        {serverResponseMessage}
                    </form>
                </div>
                <div className="modal-footer">
                    <Button bsStyle="success" onClick={this.handleClose}>Close</Button>
                </div>
            </Modal>
        );
    }
});

module.exports = ImportFromTranslationModal;

