var React = require('react');
var App = require('./app');
var AppStore = require('../stores/app-store');
var AppActions = require('../actions/app-actions');
var AppView = require('./app-view');
var AppUtils = require('../utils/app-utils');

var Button = require('react-bootstrap').Button;
var Popover = require('react-bootstrap').Popover;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var Tooltip = require('react-bootstrap').Tooltip;

var ComponentIcon = React.createClass({
    handleCollapse: function (event) {
        if (this.props.handleCollapse) {
            this.props.handleCollapse(event);
        }
    },
    handleSelection: function (event) {
        event.stopPropagation();
        AppActions.selectComponent(this.props.node.id, true, false);
    },
    render: function () {
        var badge, extension, checkbox, icon, result;
        var refCount = this.props.node.refs ? this.props.node.refs.length : 0;
        var badgeThreshold = (this.props.view === AppView.SEARCH ? 0 : 1);
        var title = this.props.label ? ((this.props.collapsed ? "Expand " : "Collapse ") + this.props.label) : "";
        var iconType = "icon-" + this.props.node.type;

        if (this.props.showCheckbox) {
            checkbox =
                <div className="selection-checkbox">
                    <input type="checkbox"
                           readOnly={true}
                           onClick={this.handleSelection}
                           checked={AppStore.isSelected(this.props.node.id)}
                           tabIndex={-1}
                    />
                </div>;
        } else {
            checkbox = (<div className="selection-checkbox"></div>);
        }

        if (this.props.showIcon) {

            result = (<i className={iconType}/>);

            if (this.props.extended) {
                iconType += "-extended";
                result = (<i className={iconType}/>);
            }

            if (AppUtils.isLocked(this.props.node)) {
                iconType += "-locked";

                var tooltip =
                    <Tooltip>{"locked" + (this.props.node.lock.owner ? " by " + this.props.node.lock.owner : "")}</Tooltip>;
                result =
                    (<OverlayTrigger placement='top' overlay={tooltip}>
                        <i className={iconType}/>
                    </OverlayTrigger>);
            }

            icon =
                <a data-toggle="collapse" href={"#" + this.props.toggleId}
                   onClick={this.handleCollapse}
                   tabIndex={-1}>
                    <Button className="btn-med btn-default"
                            bsSize="small"
                            title={title}
                            tabIndex={-1}>
                        {result}
                    </Button>
                </a>;

            if (refCount > badgeThreshold) {
                var sortedList = this.props.node.refs.sort();
                var listItems = sortedList.map(function (id, i) {
                    return (
                        <li key={"id" + i}>{id}</li>
                    );
                });
                var popover =
                    <Popover title='Used in ...'>
                        <ul className="icon-badge-popover">
                            {listItems}
                        </ul>
                    </Popover>;
                badge =
                    <OverlayTrigger placement='top' overlay={popover}>
                        <div className="ref-count">{refCount}</div>
                    </OverlayTrigger>;
            }

            if (this.props.extensionType) {
                var tooltip = <Tooltip>{this.props.extensionType}</Tooltip>;

                switch (this.props.extensionType) {
                    case "include":
                        extension =
                            (<OverlayTrigger placement='top' overlay={tooltip}>
                                <div className="extension-include">
                                    <i className="icon-ok"></i>
                                </div>
                            </OverlayTrigger>);
                        break;
                    case "exclude":
                        extension =
                            (<OverlayTrigger placement='top' overlay={tooltip}>
                                <div className="extension-exclude">
                                    <i className="icon-minus"></i>
                                </div>
                            </OverlayTrigger>);
                        break;
                    case "override":
                        extension =
                            (<OverlayTrigger placement='top' overlay={tooltip}>
                                <div className="extension-override">
                                    <i className="icon-repeat"></i>
                                </div>
                            </OverlayTrigger>);
                        break;
                    case "add":
                        extension =
                            (<OverlayTrigger placement='top' overlay={tooltip}>
                                <div className="extension-add">
                                    <i className="icon-plus"></i>
                                </div>
                            </OverlayTrigger>);
                        break;
                }
            }
        }
        return (
            <div className="component-icon">
                {checkbox}
                {icon}
                {badge}
            </div>
        );
    }
});

module.exports = ComponentIcon;