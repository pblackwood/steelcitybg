/**
 This is the drawer component that displays content search results
 */
var React = require('react');

var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view');
var AppKeys = require('../utils/app-keys');

var DrawerSearch = React.createClass({
    getInitialState: function () {
        return {
            selectedIndex: -1,
            tokens: []
        };
    },
    handleChange: function (e) {
        switch (e.which) {
            case AppKeys.DELETE:
            case AppKeys.BACKSPACE:
                if (e.target.value === '') {
                    if (this.state.selectedIndex !== -1) {
                        this.removeToken(this.state.tokens[this.state.selectedIndex]);
                    } else {
                        this.removeLastToken();
                    }
                }
                break;
            case AppKeys.TAB:
                e.stopPropagation();
                e.preventDefault();
                if (this.validateInput(e.target.value)) {
                    this.addToSearchBar(e.target.value);
                }
                break;
            case AppKeys.ENTER:
                if (this.validateInput(e.target.value)) {
                    this.addToSearchBar(e.target.value);
                }
                this.handleSubmit();
                break;
            case AppKeys.THREE:
                if (e.shiftKey) {
                    this.setState({
                        tagedit: true
                    });
                }
                break;
            case AppKeys.LEFT:
                this.handleSelection(e);
                break;
            case AppKeys.RIGHT:
                this.handleSelection(e);
                break;
            case AppKeys.ESCAPE:
                this.handleBlur(e);
                break;
        }
    },
    handleSelection: function (e) {
        if (e.target.value === '') {
            var index = this.state.selectedIndex;
            if (index === -1) {
                index = e.which === AppKeys.LEFT ? this.state.tokens.length - 1 : 0;//goto last or first
            } else {
                var tmp = e.which === AppKeys.LEFT ? index - 1 : index + 1;
                index = Math.min(Math.max(0, tmp), this.state.tokens.length - 1);//decrement selection
            }
            this.setState({selectedIndex: index});
        }
    },
    validateInput: function (value) {
        return value !== "" && (this.state.tokens.indexOf(value) == -1);//TODO: any more required input validation
    },
    removeLastToken: function () {
        var tokens = this.state.tokens;
        tokens.pop();
        this.setState({tokens: tokens});
    },
    removeToken: function (token) {
        var tokens = this.state.tokens;
        var index = tokens.indexOf(token);
        tokens.splice(index, 1);
        this.setState({tokens: tokens});
    },
    handleSubmit: function () {
        var tokens = this.state.tokens.map(function (token) {
            return encodeURIComponent(token);
        });
        var query = tokens.join('+');
        this.props.handleSubmit(query);
    },
    addToSearchBar: function (token) {
        this.refs.searchInput.getDOMNode().value = "";
        var tokens = this.state.tokens;
        tokens.push(token);
        this.setState({tokens: tokens});
        this.focusInput();
    },
    focusInput: function (e) {
        this.refs.searchInput.getDOMNode().focus();
    },
    handleBlur: function (e) {
        this.setState({selectedIndex: -1});
    },
    render: function () {
        var self = this;
        var tokens = this.state.tokens.map(function (token, index) {
            var classname = "tag";
            if (self.state.selectedIndex === index) {
                classname = "tag tag-selected";
            }
            return (<span className={classname}>
						{token}
                <a onClick={function (e) {
                    self.removeToken(token);
                }}>&nbsp;x</a>
					</span>);
        });
        return (
            <div className="drawer-search-wrapper">
                <div className="drawer-search-button">
                    <button type="submit">
                        <i glyph="icon-search"/>
                    </button>
                </div>
                <div className="drawer-search" onClick={this.focusInput} onBlur={this.handleBlur}>
                    <div className="drawer-search-input" ref="searchBar">
                        <div style={{float: "left"}}>{tokens}</div>
                        <div style={{float: "left", overflow: "hidden"}}>
                            <input
                                type="text"
                                onKeyDown={this.handleChange}
                                ref="searchInput"
                                placeholder="Enter keywords..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

module.exports = DrawerSearch;
