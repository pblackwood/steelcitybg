var React = require('react');
var Button = require('react-bootstrap').Button;
var Alert = require('react-bootstrap').Alert;

var NavMenuConfirmation = React.createClass({

    render: function () {
        return (
            <div className="confirmation">
                <Alert bsStyle="danger" onDismiss={this.props.handleNoAnswer}>
                    <h4>{this.props.confirmHeading}</h4>
                    <p className="description">{this.props.confirmDescription}</p>
                    <p className="question">{this.props.confirmQuestion}</p>
                    <p className="buttons">
                        <Button className="btn btn-xs btn-warning yesButton"
                                onClick={this.props.handleYesAnswer}>Yes</Button>
                        <Button className="btn btn-xs btn-success noButton"
                                onClick={this.props.handleNoAnswer}>No</Button>
                    </p>
                </Alert>
            </div>
        )
    }
});

module.exports = NavMenuConfirmation;

