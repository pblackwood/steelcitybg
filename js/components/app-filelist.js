var React = require('react');
var AjaxSpinner = require('./AjaxSpinner');

var FileList = React.createClass({

    handleSelection: function (event) {
        if (!this.props.disabled) {
            this.props.handleSelection(event.currentTarget.getAttribute('data-filename'));
        }
    },

    render: function () {
        var files = [];
        var spinner;
        if (this.props.fileList) {
            var self = this;
            files = this.props.fileList.map(function (filename) {
                return (
                    <li key={filename} data-filename={filename} onClick={self.handleSelection}>
                        {filename}
                    </li>
                )
            });
        }
        if (this.props.disabled) {
            spinner =
                <AjaxSpinner imageFile="assets/images/spinner.svg"/>;
        }

        return (
            <div>
                <ul className={"file-input " + (this.props.disabled ? "disabled" : "")}>
                    {files}
                </ul>
                {spinner}
            </div>
        );
    }
});

module.exports = FileList;

