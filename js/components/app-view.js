module.exports = {
    EDITOR: {value: 0, name: "Editing View"},
    TREE: {value: 1, name: "Tree View"},
    OUTPUT: {value: 2, name: "Output View"},
    SEARCH: {value: 3, name: "Search View"},

    getView: function (view) {
        return this[view];
    }
};
