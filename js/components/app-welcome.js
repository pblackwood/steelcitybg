var React = require('react');
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
var Button = require('react-bootstrap').Button;
var FileOpener = require('./app-fileopener');
var AppStore = require('../stores/app-store');

var Welcome = React.createClass({

    getInitialState: function () {
        return {
            loading: AppStore.isManifestLoading()
        }
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState({
                loading: AppStore.isManifestLoading()
            });
        }
    },
    handleNew: function () {
        this.props.handleFileMenu('New');
    },

    handleClose: function () {
        this.props.handleClose();
    },

    render: function () {
        var buttons;
        if (!this.props.modal) {
            buttons =
                <ButtonToolbar className="button-bar">
                    <Button
                        bsSize="small"
                        onClick={this.handleNew}
                        disabled={this.state.loading}>
                        <i className="icon-plus"/> New Document
                    </Button>
                </ButtonToolbar>
        }
        return (
            <div className={this.props.className}>
                <FileOpener
                    className="file-opener"
                    style={this.props.selectionStyle}
                    manifestList={this.props.manifestList}
                    manifestTree={this.props.manifestTree}
                    manifest={this.props.manifest}
                    handleSelectManifest={this.props.handleSelectManifest}
                />
                {buttons}
            </div>
        );
    }
});

module.exports = Welcome;

