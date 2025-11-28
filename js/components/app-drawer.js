/**
 This is the drawer component that displays content search results
 */
var React = require('react');

var AppStore = require('../stores/app-store.js');
var AppActions = require('../actions/app-actions.js');
var AppView = require('./app-view');
var Config = require('../properties/props');
var DrawerResults = require('./app-drawer-results');
var AppKeys = require('../utils/app-keys');

var Drawer = React.createClass({
    getInitialState: function () {
        return {
            hidden: !Config.alwaysExpandSearchDrawer,
            width: Config.searchDrawerInitialWidth ? Config.searchDrawerInitialWidth : this.props.minWidth,
            query: '',
            content: AppStore.getSearchContent(),
            showConfig: false,
            collapseResults: false,
            matchCase: false,
            orderBy: "relevance",
            pageSize: 10,
            totalPages: 0,
            currentPage: 0,
            pending: false
        }
    },
    componentWillMount: function () {
        AppStore.addChangeListener(this._onChange);
    },
    componentWillUnmount: function () {
        AppStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        var content = AppStore.getSearchContent();
        if (content && content.rootNode) {
            if (this.isMounted()) {
                this.setState({
                    content: content,
                    totalPages: Math.ceil(content.rootNode.found / content.rootNode.pageSize),
                    currentPage: content.rootNode.page
                });
            }
            this.setState({pending: false});
        }
    },
    handleDragStart: function (e) {
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.handleDragEnd);
        e.preventDefault();
    },
    handleDrag: function (e) {
        var pageX = e.touches ? e.touches[0] ? e.touches[0].pageX : e.changedTouches[0].pageX : e.pageX;
        var minWidth = this.props.minWidth ? parseInt(this.props.minWidth, 10) : 0;
        var maxWidth = this.props.maxWidth ? parseInt(this.props.maxWidth, 10) : 0;
        var width = Math.min(maxWidth, Math.max(minWidth, pageX));
        this.setState({width: width + 'px'});
    },
    handleDragEnd: function (e) {
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
    },
    handleClick: function (e) {
        this.setState({hidden: !this.state.hidden});
    },
    handleSubmit: function (e) {
        var query = this.refs.searchInput.getDOMNode().value;
        AppActions.requestContentSearch(
            query,
            this.state.matchCase,
            1,
            this.state.pageSize,
            this.state.collapseResults
        );
        this.setState({
            content: {},
            pending: true,
            query: query
        });
    },
    handleKeyDown: function (e) {
        if (e.which === AppKeys.ENTER) {
            this.handleSubmit(e)
        }
    },
    toggleConfig: function (e) {
        this.setState({showConfig: !this.state.showConfig});
    },
    setConfig: function (e) {
        var config;
        switch (e.target.id) {
            case "collapseResults":
                config = {collapseResults: !this.state.collapseResults};
                AppActions.collapseAll(AppView.SEARCH, this.state.content, !this.state.collapseResults);
                break;
            case "matchCase":
                config = {matchCase: !this.state.matchCase};
                break;
            case "pageSize":
                config = {pageSize: parseInt(this.refs.pageSize.getDOMNode().value), currentPage: 0, content: {}};
                break;
        }
        this.setState(config);
    },
    handleMoreButton: function (e) {
        if (this.state.currentPage !== this.state.totalPages && this.state.totalPages > 0) {
            this.setState({pending: true, currentPage: this.state.currentPage++});
            AppActions.requestContentSearch(
                this.state.query,
                this.state.matchCase,
                this.state.currentPage,
                this.state.pageSize,
                this.state.collapseResults
            );
        }
    },
    render: function () {
        var config;
        var contentMargin = this.state.showConfig ? "165px" : "100px";
        var resultsInfo;
        var results = this.state.totalPages === 0 ? "Your search yielded no results..." : "Displaying page " + this.state.currentPage + " of " + this.state.totalPages + ".";
        var cogIcon = this.state.pending ? "icon-refresh" : "icon-cog";
        var togglePosition = this.state.hidden ? 0 : (parseInt(this.state.width, 10) - 50);
        var drawer;

        if (this.state.content.rootNode) {
            var moreButton;
            if (this.state.currentPage < this.state.totalPages) {
                moreButton =
                    <div className="more-button" onClick={this.handleMoreButton}>
                        <span className="triangle"></span>
                        <span>Show More Results...</span>
                    </div>
            }
            resultsInfo =
                <div>
                    <div className="page-number">{results}</div>
                    {moreButton}
                </div>;
        }
        if (this.state.showConfig) {
            config = (
                <div className="drawer-search-config">
                    <div className="row">
                        <div className="col-xs-6">
                            <input id="collapseResults"
                                   ref="collapseResults"
                                   type="checkbox"
                                   checked={this.state.collapseResults}
                                   onChange={this.setConfig}/>
                            <label htmlFor="collapseResults">Collapse Results</label>
                        </div>
                        <div className="col-xs-6">
                            <input id="matchCase"
                                   ref="matchCase"
                                   type="checkbox"
                                   checked={this.state.matchCase}
                                   onChange={this.setConfig}/>
                            <label htmlFor="matchCase">Match Case</label>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-6">
                            <label htmlFor="pageSize">Number of Results:</label>
                        </div>
                        <div className="col-xs-6">
                            <select id="pageSize" ref="pageSize" onChange={this.setConfig}>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
        }

        if (!this.state.hidden) {
            drawer = (<nav id="drawer" style={{width: this.state.width}}>
                <div className="row" id="drawer-search">
                    <div className="col-xs-6 drawer-tab">
                        Search
                    </div>
                    <div className="col-xs-6" style={{borderBottom: "1px solid #555", height: "39px"}}>
                        &nbsp;
                    </div>
                    <div className="col-xs-12">
                        <div className="drawer-search-wrapper">
                            <div className="drawer-config-button">
                                <button onClick={this.toggleConfig} disabled={this.state.pending}>
                                    <i className={cogIcon}/>
                                </button>
                            </div>
                            <div className="drawer-search-button">
                                <button onClick={this.handleSubmit} disabled={this.state.pending}>
                                    <i className="icon-search"/>
                                </button>
                            </div>
                            <div className="drawer-search" onClick={this.focusInput} onBlur={this.handleBlur}>
                                <div className="drawer-search-input" ref="searchBar">
                                    <input type="text"
                                           ref="searchInput"
                                           placeholder="Enter keywords..."
                                           onKeyDown={this.handleKeyDown}
                                           disabled={this.state.pending}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12">
                        {config}
                    </div>
                </div>
                <div id="drawer-content" style={{marginTop: contentMargin}}>
                    <DrawerResults
                        content={this.state.content}
                        query={this.state.query}
                        matchCase={this.state.matchCase}
                    />
                    {resultsInfo}
                </div>
            </nav>);
        }

        return (
            <div>
                <input type="checkbox" id="drawer-toggle" name="drawer-toggle" checked={!this.state.hidden}/>
                <label onClick={this.handleClick} htmlFor="drawer-toggle" id="drawer-toggle-label"
                       style={{left: togglePosition + 'px'}}/>
                {drawer}
                <div id="drawer-resize" onMouseDown={this.handleDragStart} style={{left: this.state.width}}>&nbsp;</div>
                <div id="page-content" style={{marginLeft: togglePosition + 40 + 'px'}}>
                    {this.props.children}
                </div>
            </div>
        )
    }
});

module.exports = Drawer;