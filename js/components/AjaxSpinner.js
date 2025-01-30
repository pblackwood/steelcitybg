var React = require('react');

var Preloader = React.createClass({
    render: function () {
        return (
            <div className="ajax-spinner">
                <img src={this.props.imageFile}/>
            </div>
        )
    }
});

module.exports = Preloader;