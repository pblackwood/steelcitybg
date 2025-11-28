var React = require('react');
var Button = require('react-bootstrap').Button;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;

var NavMenuButton = React.createClass({
    render: function () {
        var tooltip =
            <Tooltip>{this.props.title}</Tooltip>;
        return (
            <OverlayTrigger placement="top" overlay={tooltip}>
                <Button
                    bsStyle={this.props.buttonStyle}
                    onClick={this.props.handler}
                    tabIndex={-1}>
                    <i className={this.props.glyph}></i>
                </Button>
            </OverlayTrigger>
        )
    }
});

module.exports = NavMenuButton;

