module.exports = {
    environment: 'beta',
    contentDictionaryEndpoint: '/v1/contentDictionary',
    contentDictionaryStateEndpoint: '/v1/contentDictionary/state/manifests',
    contentDictionaryTagsEndpoint: '/v1/contentDictionary/tags',
    contentDictionarySearchEndpoint: '/v1/contentDictionary/search',
    contentDictionaryLockEndpoint: '/v1/contentDictionary/lock',
    contentDictionaryImportEndpoint: '/v1/contentDictionary/import/manifest',
    contentDictionaryExportEndpoint: '/v1/contentDictionary/export/manifest',

    fileChooserStyle: 'tree',
    pasteStyle: 'clone',
    searchDrawerInitialWidth: '600px',
    undoStackMaxSize: 50,
    printDebugTimings: false,
    useAppBlock: true,
    version: '1.3',
    build: '0e57fbf',
    copyright: 'Copyright 2015 Korn Ferry International',

    // seconds to wait before releasing the block
    appBlockDefaultTimeout: 60
};

