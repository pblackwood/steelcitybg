var React = require('react');

var ButtonGroup = require('react-bootstrap').ButtonGroup;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
var Button = require('react-bootstrap').Button;

var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view');

var Typeahead = require('./typeahead/Typeahead');

var KeySearchTypeAhead = React.createClass({

    getInitialState: function () {
        return ({
            options: AppStore.getKeySearchCache(this.props.contentType)
        });
    },

    render: function () {
        return (
            <Typeahead
                options={this.state.options}
                className="typeahead"
                maxVisible={50}
                placeholder={this.props.placeholder}
                defaultValue={this.props.startingValue}
                onOptionSelected={this.props.onSelect}
                customClasses={{
                    input: 'typeahead-input',
                    results: 'typeahead-results',
                    listItem: 'typeahead-listitem',
                    listAnchor: 'typeahead-listanchor',
                    hover: 'typeahead-hover'
                }}
            />
        )
    }
});

module.exports = KeySearchTypeAhead;
