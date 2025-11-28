var Dispatcher = require('./dispatcher.js');

var AppDispatcher = _.extend(Dispatcher.prototype, {
    handleServerAction: function (action) {
        this.dispatch({
            source: 'SERVER_ACTION',
            action: action
        })
    },
    handleViewAction: function (action) {
        this.dispatch({
            source: 'VIEW_ACTION',
            action: action
        })
    }
})

module.exports = AppDispatcher;