var React = require('react');
var AppStore = require('../stores/app-store');
var AppActions = require('../actions/app-actions');
var _ = require('lodash');

var ExtensionManager = React.createClass({

    getInitialState: function () {
        var mode = this.getExtensionType(this.props.node);
        var input = this.getCleanInput(this.props.node);
        var output = this.getCleanOutput(this.props.node);
        var node = this.props.node ? this.props.node : null;

        return {
            node: node,
            input: input,
            output: output,
            selected: [],
            mode: mode ? mode : 'exclude'
        }
    },

    handleSelect: function (e, component) {
        var index = _.indexOf(this.state.selected, component);
        var selected = this.state.selected;
        if (index == -1) {//not selected
            selected.push(component);
        } else {//selected
            selected.splice(index, 1);
        }
        this.setState({selected: selected});
    },

    handleAdd: function (event) {
        var output = _.union(this.state.output, this.state.selected);
        var input = _.difference(this.state.input, this.state.selected);

        if (this.props.updateValue) {
            this.props.updateValue(output, this.state.mode);
        }

        this.setState({
            input: input,
            output: output,
            selected: []
        });
    },

    handleRemove: function (event) {
        var output = _.difference(this.state.output, this.state.selected);
        var input = _.union(this.state.input, this.state.selected);

        if (this.props.updateValue) {
            this.props.updateValue(output, this.state.mode);
        }

        this.setState({
            input: input,
            output: output,
            selected: []
        });
    },

    handleAddAll: function (e) {
        var output = _.union(this.state.input, this.state.output);

        if (this.props.updateValue) {
            this.props.updateValue(output, this.state.mode);
        }

        this.setState({
            input: [],
            output: output,
            selected: []
        });
    },

    handleRemoveAll: function (e) {
        var input = _.union(this.state.input, this.state.output);

        if (this.props.updateValue) {
            this.props.updateValue([], this.state.mode);
        }

        this.setState({
            input: input,
            output: [],
            selected: []
        });
    },

    getComponentIcon: function (type) {
        var icon;

        switch (type) {
            case 'prop':
                icon = (<i className="icon-font"></i>);
                break;
            case 'props':
                icon = (<i className="icon-list"></i>);
                break;
            case 'props2d':
                icon = (<i className="icon-th"></i>);
                break;
            case 'category':
                icon = (<i className="icon-folder"></i>);
                break;
        }
        return icon;
    },

    getCleanInput: function (node) {
        return this.props.content.getValue(node).filter(function (item) {
            return (item.extension != 'include' &&
                item.extension != 'exclude' &&
                item.extension != 'override' &&
                item.extension != 'add' &&
                item.type != 'include' &&
                item.type != 'exclude' &&
                item.type != 'override');
        });
    },

    getCleanOutput: function (node) {
        return this.props.content.getValue(node).filter(function (item) {
            return (item.extension == 'include' ||
                item.extension == 'exclude');
        });
    },

    getExtensionType: function (node) {
        var mode = null;
        var value = this.props.content.getValue(node);
        if (value) {
            for (var i = 0; i < value.length; i++) {
                if (value[i].extension) {
                    if (((mode != null && mode != value[i].extension) && (value[i].extension == 'include' || value[i].extension == 'exclude'))) {
                        return null;
                    } else if (value[i].extension == 'include' || value[i].extension == 'exclude') {
                        mode = value[i].extension;
                    }
                }
            }
        }
        return mode;
    },

    handleMode: function (event) {
        var parentId = this.props.node.id;
        var output = this.state.output;
        var mode = event.target.value;

        if (this.props.updateValue) {
            this.props.updateValue(output, mode);
        }

        this.setState({mode: mode});
    },

    render: function () {
        var input = [];
        var output = [];
        var self = this;

        this.state.input.map(
            function (component) {
                var icon = self.getComponentIcon(component.type);
                var className = _.indexOf(self.state.selected, component) != -1 ? 'selected' : '';
                input.push(
                    <li className={className} onClick={function (e) {
                        return self.handleSelect(e, component)
                    }}>
                        <span className="icon">{icon}</span>
                        {component.key}
                    </li>
                );
            }
        );

        this.state.output.map(
            function (component) {
                var icon = self.getComponentIcon(component.type);
                var className = _.indexOf(self.state.selected, component) != -1 ? 'selected' : '';
                output.push(
                    <li className={className} onClick={function (e) {
                        return self.handleSelect(e, component)
                    }}>
                        <span className="icon">{icon}</span>
                        {component.key}
                    </li>
                );
            }
        );

        return (
            <div className={"row " + this.props.className}>
                <div className="col-xs-5">
                    <ul className="extension-manager-input" multiple>
                        {input}
                    </ul>
                </div>
                <div className="col-xs-2">
                    <button disabled={this.state.output.length < 1} className="btn btn-default"
                            onClick={this.handleRemoveAll}>
                        <i className="icon-chevron-left"></i>
                        <i className="icon-chevron-left"></i>
                    </button>
                    <button disabled={this.state.output.length < 1} className="btn btn-default"
                            onClick={this.handleRemove}>
                        <i className="icon-chevron-left"></i>
                    </button>
                    <button disabled={this.state.input.length < 1} className="btn btn-default" onClick={this.handleAdd}>
                        <i className="icon-chevron-right"></i>
                    </button>
                    <button disabled={this.state.input.length < 1} className="btn btn-default"
                            onClick={this.handleAddAll}>
                        <i className="icon-chevron-right"></i>
                        <i className="icon-chevron-right"></i>
                    </button>
                </div>
                <div className="col-xs-5">
                    <ul name="output" multiple>
                        {output}
                    </ul>
                </div>
                <div className="col-xs-12">
                    <select ref="selectMode" name="mode" onChange={this.handleMode} value={this.state.mode}>
                        <option value="exclude" selected>Exclude</option>
                        <option value="include">Include</option>
                    </select>
                </div>
            </div>
        );
    }
});

module.exports = ExtensionManager;

