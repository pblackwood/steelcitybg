var React = require('react');
var AppStore = require('../stores/app-store');
var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view.js');
var Popover = require('react-bootstrap').Popover;
var TextInput = require('../components/app-textinput.js');

var PropKey = React.createClass({

    getInitialState: function () {
        var validation = this.props.content.validateKey(this.props.id, this.props.propKey);
        return {
            valid: validation.valid,
            validationMessage: validation.validationMessage,
            editing: this.props.editable,
            tempKey: this.props.propKey
        }
    },
    componentWillReceiveProps: function (nextProps) {
        this.setState({editing: nextProps.editable});

        // If the prop did not move or otherwise structurally change, use local state instead of from parent.
        if ((this.props.id !== nextProps.id) || AppStore.isUndoInProgress()) {
            var validation = this.props.content.validateKey(nextProps.id, nextProps.propKey);
            this.setState({
                valid: validation.valid,
                validationMessage: validation.validationMessage,
                tempKey: nextProps.propKey
            })
        }
    },
    handleReset: function () {
        this.setState({
            editing: this.props.editable,
            tempKey: this.props.propKey,
            reset: true
        });
    },
    handleSaveKey: function (event, key) {
        console.log("Saving key, is undo in progress: " + AppStore.isUndoInProgress());
        var validation = this.props.content.validateKey(this.props.id, key);
        this.setState(validation);
        this.setState({tempKey: key});
        if (validation.valid || key == "") {
            if (this.props.parentSaveKey) {
                this.props.parentSaveKey(event, key);
            } else {
                AppActions.saveKey(this.props.id, key);
            }
            if (this.props.notifyComplete) {
                this.props.notifyComplete();
            }
            return true;
        } else {
            event.stopPropagation();
            event.preventDefault();
            if (validation.reference) {
                // This key might be dot-notation to reference ML content. Ask user.
                delete validation.reference;
                AppActions.referenceContent(this.props.id, this.props.type, key);
            }
            return false;
        }
    },
    handleClick: function (event) {
        if (!(event.ctrlKey || event.metaKey || event.shiftKey || this.props.type === "manifest")) {
            // Click is not part of multi-select, so invoke editor (relevant only to tree view)
            this.setState({editing: true});
            event.stopPropagation();
        }
    },
    render: function () {
        var keyView;
        if (this.state.editing) {
            keyView =
                <TextInput
                    id={this.props.id}
                    ref="input"
                    aKey={this.state.tempKey}
                    editable={this.props.editable}
                    valid={this.state.valid}
                    validationMessage={this.state.validationMessage}
                    keyRef={this.props.keyRef}
                    save={this.handleSaveKey}
                    reset={this.state.reset}
                    handleReset={this.handleReset}
                    autofocus={this.props.autofocus}
                    view={this.props.view}
                />
        } else {
            keyView =
                <span
                    ref="label">
					{this.props.propKey}
				</span>
        }

        return (
            <div
                className={"propKey " + this.props.className}
                onClick={this.handleClick}>
                {keyView}
            </div>
        );
    }
});
module.exports = PropKey;

