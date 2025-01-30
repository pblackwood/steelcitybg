var React = require('react');
var FileList = require('./app-filelist');
var DocBrowser = require('./trees/docbrowser');
var AppStore = require('../stores/app-store');

var FileOpener = React.createClass({

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
            this.setState({loading: AppStore.isManifestLoading()});
        }
    },
    handleSelection: function (manifestName) {
        this.props.handleSelectManifest(manifestName);
    },

    render: function () {
        var chooser;
        if (this.props.style == 'list') {
            var fileList;
            if (this.props.manifestList) {
                fileList =
                    this.props.manifestList.map(function (manifest) {
                        return manifest.id;
                    });
                chooser =
                    <FileList
                        disabled={this.state.loading}
                        fileList={fileList}
                        handleSelection={this.handleSelection}
                    />;
            }
        } else if (this.props.style == 'tree') {
            if (this.props.manifestTree) {
                chooser =
                    <DocBrowser
                        disabled={this.state.loading}
                        root={this.props.manifestTree}
                        handleSelection={this.handleSelection}
                    />
            }
        }

        return (
            <div className={this.props.className}>
                <span className="file-list-header">Open a Document</span>
                {chooser}
            </div>
        );
    }
});

module.exports = FileOpener;

