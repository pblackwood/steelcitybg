var React = require('react');
_ = require('lodash');
$ = jQuery = require('jquery');
require('bootstrap');
require('bootstrap-notify');

var ButtonGroup = require('react-bootstrap').ButtonGroup;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
var Button = require('react-bootstrap').Button;

var Manifest = require('../components/app-manifest.js');
var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view');
var AppKeys = require('../utils/app-keys');
var AppUtils = require('../utils/app-utils');
var Header = require('./app-header');
var TreeView = require('./trees/treeview');
var Drawer = require('./app-drawer');

var ConfirmationModal = require('./modals/confirmationmodal');
var ContentLockModal = require('./modals/contentlockmodal');
var InfoMessageModal = require('./modals/infomessagemodal');
var FileOpenModal = require('./modals/fileopenmodal');
var FileSaveModal = require('./modals/FileSaveModal');
var AppBlockModal = require('./modals/appblockmodal');
var ManageExtendsModal = require('./modals/manageExtendsModal');

var Welcome = require('./app-welcome');
var Config = require('../properties/props');

var App = React.createClass({
    getInitialState: function () {
        return {
            manifest: AppStore.getManifest(),
            manifestList: AppStore.getRecentManifests(),
            manifestTree: AppStore.getManifestTree(),
            content: AppStore.getEditorContent(),
            showWelcome: AppStore.showWelcome(),
            activePane: Config.defaultView ? AppView.getView(Config.defaultView) : AppView.EDITOR,
            ctrlKeyDown: false
        };
    },
    componentWillMount: function () {
        AppActions.getRecentManifests();
        AppStore.addChangeListener(this._onChange);
        window.addEventListener('keydown', this.handleKeyDown);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
        window.removeEventListener('keydown', this.handleKeyDown);
    },
    componentDidMount: function () {
        // Have to use jQuery for these since they are captured by the browser before React sees them
        $(window).bind('keydown', function (event) {
            if (event.ctrlKey || event.metaKey) {
                switch (event.which) {
                    case AppKeys.S:
                        // Save
                        event.preventDefault();
                        AppActions.saveManifest(function (success) {
                            // nothing to do
                        });
                        break;
                    case AppKeys.U:
                        // Save & Close
                        event.preventDefault();
                        AppActions.saveManifest(function (success) {
                            if (success) {
                                AppActions.closeManifest();
                            }
                        });
                        break;
                    case AppKeys.O:
                        event.preventDefault();
                        AppActions.openManifest();
                        break;
                }
            }
        });

        window.onbeforeunload = AppStore.beforeUnloadApp;
        window.onunload = AppStore.unloadApp;

        if (Config.defaultManifest) {
            AppActions.selectManifest(Config.defaultManifest);
        }
    },
    componentDidUpdate: function () {
        AppActions.endTiming("Render manifest", true);
        AppActions.endTiming("Move down", true);
        AppActions.endTiming("Undo", true);
        AppStore.setUndoInProgress(false);
    },
    _onChange: function () {
        if (this.isMounted()) {
            this.setState({
                manifest: AppStore.getManifest(),
                manifestList: AppStore.getRecentManifests(),
                manifestTree: AppStore.getManifestTree(),
                showWelcome: AppStore.showWelcome()
            });
        }
    },
    handleChangeView: function (eventKey) {
        var view = AppView[eventKey];
        this.setState({activePane: view});
    },
    handleFileMenu: function (eventKey) {
        switch (eventKey) {
            case 'New':
                AppActions.createManifest();
                break;
            case 'Open':
                AppActions.openManifest();
                break;
            case 'Save':
                AppActions.saveManifest(null);
                break;
            case 'SaveClose':
                AppActions.saveManifest(function (success) {
                    if (success) {
                        AppActions.closeManifest();
                    }
                });
                break;
            case 'Close':
                AppActions.closeManifest();
                break;
            case 'SaveAs':
                AppActions.saveManifestAs(function (success) {
                    // nothing to do
                });
                break;
            case 'About':
                AppActions.showAboutMessage();
                break;
        }
    },
    handleEditMenu: function (eventKey) {
        switch (eventKey) {
            case 'Cut':
                AppActions.cutSelectedComponent();
                break;
            case 'Copy':
                AppActions.copySelectedComponent();
                break;
            case 'Paste':
                AppActions.pasteIntoSelectedComponent();
                break;
        }
    },
    handleImportExportMenu: function (eventKey) {
        // Nothing to do. Import and export run from their own modals.
    },
    handleSelectManifest: function (name) {
        AppActions.selectManifest(name);
    },
    handleKeyDown: function (event) {
        var isInput = (event.target.tagName.toUpperCase() === "INPUT" || event.target.tagName.toUpperCase() === "TEXTAREA");
        if (event.ctrlKey || event.metaKey) {
            switch (event.which) {
                case AppKeys.C:
                    if (!isInput) {
                        // Copy
                        AppActions.copySelectedComponent();
                    }
                    break;
                case AppKeys.V:
                    if (!isInput) {
                        // Paste
                        AppActions.pasteIntoSelectedComponent();
                        event.preventDefault();
                    }
                    break;
                case AppKeys.X:
                    if (!isInput) {
                        // Cut
                        AppActions.cutSelectedComponent();
                    }
                    break;
                case AppKeys.Y:
                    AppActions.redo();
                    break;
                case AppKeys.Z:
                    AppActions.undo();
                    break;
                case AppKeys.UP:
                    AppActions.moveSelectedUp();
                    break;
                case AppKeys.DOWN:
                    AppActions.moveSelectedDown();
                    break;
                case AppKeys.LEFT:
                    AppActions.moveSelectedLeft();
                    break;
                case AppKeys.RIGHT:
                    AppActions.moveSelectedRight();
                    break;
            }
        }
        if (!isInput && event.which === AppKeys.DEL) {
            AppActions.removeSelected();
        }
    },
    render: function () {
        var markup;
        if (this.state.manifest) {
            switch (this.state.activePane) {
                case AppView.OUTPUT:
                    markup =
                        <div>
                            <h4>Generated Manifest:</h4>
                            <pre>{JSON.stringify(AppStore.getGeneratedManifest(), null, 2)}</pre>
                            <h4>Selected Components:</h4>
                            <pre>{AppStore.dumpSelection()}</pre>
                            <h4>Clipboard:</h4>
                            <pre>{JSON.stringify(AppStore.getClipboard(), null, 2)}</pre>
                            <h4>Manifest:</h4>
                            <pre>{JSON.stringify(AppStore.getManifest(), null, 2)}</pre>
                            <h4>Search Results:</h4>
                            <pre>{JSON.stringify(AppStore.getContentSearchResults(), null, 2)}</pre>
                            <h4>Key-to-Id Hash:</h4>
                            <pre>{AppStore.dumpKeyToIdHash()}</pre>
                            <h4>Id-to-Key Hash:</h4>
                            <pre>{AppStore.dumpIdToKeyHash()}</pre>
                            <h4>Id-to-Node Hash:</h4>
                            <pre>{AppStore.dumpIdToNodeHash()}</pre>
                            <h4>Guid-to-Content Hash:</h4>
                            <pre>{AppStore.dumpGuidToContentHash()}</pre>
                            <h4>Undo Stack:</h4>
                            <pre>{JSON.stringify(AppStore.getUndoStack().dump(), null, 2)}</pre>
                            <h4>Redo Stack:</h4>
                            <pre>{JSON.stringify(AppStore.getRedoStack().dump(), null, 2)}</pre>
                        </div>;
                    break;
                case AppView.EDITOR:
                    markup = <Manifest
                        node={this.state.manifest}
                        view={this.state.activePane}
                        content={this.state.content}
                        checkedOut={AppUtils.isManifestCheckedOut(this.state.manifest)}
                        editable={AppUtils.isManifestEditable(this.state.manifest)}
                    />
                    break;
                case AppView.TREE:
                    markup = <TreeView
                        root={this.state.manifest}
                        content={this.state.content}
                        editable={AppUtils.isManifestEditable(this.state.manifest)}
                        checkedOut={AppUtils.isManifestCheckedOut(this.state.manifest)}
                    />
                    break;
            }
        } else if (this.state.showWelcome) {
            markup =
                <Welcome
                    className="welcome-screen"
                    modal={false}
                    selectionStyle={Config.fileChooserStyle}
                    manifestList={this.state.manifestList}
                    manifestTree={this.state.manifestTree}
                    manifest={this.state.manifest}
                    handleSelectManifest={this.handleSelectManifest}
                    handleFileMenu={this.handleFileMenu}
                />
        }

        return (
            <div>
                <Header
                    view={this.state.activePane}
                    manifestList={this.state.manifestList}
                    manifest={this.state.manifest}
                    closeButtonEnabled={this.state.manifest}
                    commandButtonsEnabled={this.state.manifest && this.state.manifest.editable}
                    exportButtonEnabled={this.state.manifest && this.state.manifest.editable && !this.state.manifest.hasEdits}
                    importButtonEnabled={!this.state.manifest || (this.state.manifest.editable && !this.state.manifest.hasEdits)}
                    handleChangeView={this.handleChangeView}
                    handleFileMenu={this.handleFileMenu}
                    handleImportExportMenu={this.handleImportExportMenu}
                    handleSelectManifest={this.handleSelectManifest}
                    handleEditMenu={this.handleEditMenu}
                    editButtonEnabled={AppStore.isClipboardAvailable()}
                    pasteButtonEnabled={AppStore.isPasteAvailable()}
                />
                <ConfirmationModal/>
                <ContentLockModal/>
                <InfoMessageModal/>
                <ManageExtendsModal/>
                <FileSaveModal
                    manifestTree={this.state.manifestTree}
                />
                <FileOpenModal
                    selectionStyle={Config.fileChooserStyle}
                    manifestList={this.state.manifestList}
                    manifestTree={this.state.manifestTree}
                    manifest={this.state.manifest}
                    handleSelectManifest={this.handleSelectManifest}
                />
                <AppBlockModal/>
                <Drawer minWidth="300px" maxWidth="1400px">
                    {markup}
                </Drawer>
            </div>
        );
    }
});

module.exports = App;

