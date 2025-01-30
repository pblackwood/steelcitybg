var React = require('react');
var App = require('./app');
var AppView = require('./app-view');
var EnvConstants = require('../constants/env-constants');
var Config = require('../properties/props');

var Navbar = require('react-bootstrap').Navbar;
var Nav = require('react-bootstrap').Nav;
var NavItem = require('react-bootstrap').NavItem;
var CollapsibleNav = require('react-bootstrap').CollapsibleNav;
var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;
var ModalTrigger = require('react-bootstrap').ModalTrigger;

var ExportForTranslationModal = require('./modals/ExportForTranslationModal');
var ImportFromTranslationModal = require('./modals/ImportFromTranslationModal');

var Header = React.createClass({

    render: function () {

        var outputNavItem, exportMenuItem, importMenuItem;
        if (Config.environment == EnvConstants.DEV || Config.environment == EnvConstants.BETA) {
            outputNavItem =
                <NavItem
                    eventKey="OUTPUT"
                    onSelect={this.props.handleChangeView}
                    className={this.props.view === AppView.OUTPUT ? "selected" : ""}>
                    Output
                </NavItem>;
        }
        if (this.props.exportButtonEnabled) {
            exportMenuItem =
                <ModalTrigger
                    modal={<ExportForTranslationModal/>}>
                    <MenuItem
                        eventKey='Export'
                        disabled={false}>
                        {<i className="icon-upload-alt"/>} Export ...
                    </MenuItem>
                </ModalTrigger>
        } else {
            exportMenuItem =
                <MenuItem
                    eventKey='Export'
                    className="disabled"
                    disabled={true}>
                    {<i className="icon-upload-alt"/>} Export ...
                </MenuItem>
        }
        if (this.props.importButtonEnabled) {
            importMenuItem =
                <ModalTrigger
                    modal={<ImportFromTranslationModal/>}>
                    <MenuItem
                        eventKey='Import'
                        disabled={false}>
                        {<i className="icon-download-alt"/>} Import ...
                    </MenuItem>
                </ModalTrigger>
        } else {
            importMenuItem =
                <MenuItem
                    eventKey='Import'
                    className="disabled"
                    disabled={true}>
                    {<i className="icon-download-alt"/>} Import ...
                </MenuItem>
        }
        return (
            <Navbar fixedTop inverse brand={<Brand/>} toggleNavKey={0}>
                <CollapsibleNav eventKey={0}>
                    <Nav navbar left className="edit-menu">
                        <NavItem
                            eventKey="Cut"
                            onSelect={this.props.handleEditMenu}
                            className={this.props.editButtonEnabled ? "" : "disabled"}
                            disabled={!this.props.editButtonEnabled}>
                            {<i className="icon-cut"/>} Cut
                        </NavItem>
                        <NavItem
                            eventKey="Copy"
                            onSelect={this.props.handleEditMenu}
                            className={this.props.editButtonEnabled ? "" : "disabled"}
                            disabled={!this.props.editButtonEnabled}>
                            {<i className="icon-copy"/>} Copy
                        </NavItem>
                        <NavItem
                            eventKey="Paste"
                            onSelect={this.props.handleEditMenu}
                            className={this.props.pasteButtonEnabled ? "" : "disabled"}
                            disabled={!this.props.pasteButtonEnabled}>
                            {<i className="icon-paste"/>} Paste
                        </NavItem>
                    </Nav>
                    <Nav navbar right>
                        <NavItem
                            eventKey="EDITOR"
                            onSelect={this.props.handleChangeView}
                            className={this.props.view === AppView.EDITOR ? "selected" : ""}>
                            Editor
                        </NavItem>
                        <NavItem
                            eventKey="TREE"
                            onSelect={this.props.handleChangeView}
                            className={this.props.view === AppView.TREE ? "selected" : ""}>
                            Tree View
                        </NavItem>
                        {outputNavItem}
                        <DropdownButton
                            eventKey={1}
                            title="Import/Export"
                            onSelect={this.props.handleImportExportMenu}>
                            {importMenuItem}
                            {exportMenuItem}
                        </DropdownButton>
                        <DropdownButton
                            eventKey={2}
                            title="Actions"
                            onSelect={this.props.handleFileMenu}>
                            <MenuItem eventKey='New'>
                                {<i className="icon-plus"/>} New
                            </MenuItem>
                            <MenuItem eventKey='Open'>
                                {<i className="icon-cloud-download"/>} Open ...
                            </MenuItem>
                            <MenuItem divider/>
                            <MenuItem
                                eventKey='Save'
                                className={this.props.commandButtonsEnabled ? "" : "disabled"}
                                disabled={!this.props.commandButtonsEnabled}>
                                {<i className="icon-cloud-upload"/>} Save
                            </MenuItem>
                            <MenuItem
                                eventKey='SaveAs'
                                className={this.props.commandButtonsEnabled ? "" : "disabled"}
                                disabled={!this.props.commandButtonsEnabled}>
                                {<i className="icon-cloud-upload"/>} Save As ...
                            </MenuItem>
                            <MenuItem
                                eventKey='SaveClose'
                                className={this.props.commandButtonsEnabled ? "" : "disabled"}
                                disabled={!this.props.commandButtonsEnabled}>
                                {<i className="icon-cloud-upload"/>} Save &amp; Close
                            </MenuItem>
                            <MenuItem
                                eventKey='Close'
                                className={this.props.closeButtonEnabled ? "" : "disabled"}
                                disabled={!this.props.closeButtonEnabled}>
                                {<i className="icon-remove"/>} Close
                            </MenuItem>
                            <MenuItem divider/>
                            <MenuItem
                                eventKey='About'>
                                {<i className="icon-question-sign"/>} About ...
                            </MenuItem>
                        </DropdownButton>
                    </Nav>
                </CollapsibleNav>
            </Navbar>
        );
    }
});

var Brand = React.createClass({
    render: function () {
        return (
            <div className="brand">
                <img className="logo" src="assets/images/korn-ferry-cloud-logo.png"/>
            </div>
        )
    }
});

module.exports = Header;

