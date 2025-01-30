$(document).ready(function () {
    $.notifyDefaults({
        placement: {
            from: "top",
            align: "center"
        },
        offset: 1,
        newest_on_top: true,
        animate: {
            enter: 'animated fadeInDown',
            exit: 'animated fadeOutUp'
        }
    });
});

module.exports = {
    success: function (message) {
        $.notify({
                message: message
            },
            {
                type: 'success',
                delay: 3000
            });
    },

    error: function (message) {
        $.notify({
                message: message
            },
            {
                type: 'danger',
                delay: 0
            }
        );
    },

    info: function (message, progressBar) {
        return $.notify({
                message: message
            },
            {
                type: 'info',
                delay: 0,
                showProgressbar: progressBar
            }
        );
    },

    animateProgressBar: function (notify) {
        var i = 1;
        return setInterval(function () {
            notify.update({'progress': i += 2});
        }, 100);
    },

}