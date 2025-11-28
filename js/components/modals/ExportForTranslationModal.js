var React = require('react');
var moment = require('moment');
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;
var ButtonInput = require('react-bootstrap').ButtonInput;
var Input = require('react-bootstrap').Input;
var FormControls = require('react-bootstrap').FormControls;
var AppActions = require('../../actions/app-actions');
var AppConstants = require('../../constants/app-constants');
var AppStore = require('../../stores/app-store');

var ExportForTranslationModal = React.createClass({

    getInitialState: function () {
        return {
            baseLang: 'en-US',
            targetLang: ''
        }
    },
    validateBaseLang: function (event) {
        this.setState({baseLang: this.refs.baseLang.getValue()});
    },
    validateTargetLang: function (event) {
        this.setState({targetLang: this.refs.targetLang.getValue()});
    },
    handleSubmit: function (event) {
        AppActions.exportManifest(AppStore.getManifest().id, this.state.baseLang, this.state.targetLang);
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
        return (
            <Modal {...this.props}
                   className="translationModal"
                   title="Export for Translation"
                   bsStyle="primary">
                <div className="modal-body">
                    <form className="form-horizontal">
                        <FormControls.Static
                            label="Document to Translate"
                            value={AppStore.getManifest().id}
                            labelClassName='col-xs-4'
                            wrapperClassName='col-xs-8'
                        />
                        <Input
                            type='select'
                            ref='baseLang'
                            label='Base Language'
                            value={this.state.baseLang}
                            onChange={this.validateBaseLang}
                            labelClassName='col-xs-4'
                            wrapperClassName='col-xs-3'>
                            {langOptions}
                        </Input>
                        <Input
                            type='select'
                            ref='targetLang'
                            label='Target Language'
                            placeholder='Select Language'
                            value={this.state.targetLang}
                            onChange={this.validateTargetLang}
                            labelClassName='col-xs-4'
                            wrapperClassName='col-xs-3'>
                            {langOptions}
                        </Input>
                        <ButtonInput
                            label={"\u00a0"}
                            value='Submit'
                            onClick={this.handleSubmit}
                            labelClassName='col-xs-4'
                            wrapperClassName='col-xs-3'>
                        </ButtonInput>
                    </form>
                </div>
                <div className="modal-footer">
                    <Button bsStyle="success" onClick={this.handleClose}>Close</Button>
                </div>
            </Modal>
        );
    }
});

module.exports = ExportForTranslationModal;
