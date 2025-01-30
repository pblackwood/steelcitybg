module.exports = {
    environment: 'dev',
    contentDictionaryEndpoint: '/dev/contentDictionary',
    contentDictionaryStateEndpoint: '/dev/contentDictionary/state/manifests',
    contentDictionaryTagsEndpoint: '/dev/contentDictionary/tags',
    contentDictionarySearchEndpoint: '/dev/contentDictionary/search',
    contentDictionaryLockEndpoint: '/dev/contentDictionary/lock',
    contentDictionaryImportEndpoint: '/dev/contentDictionary/import/manifest',
    contentDictionaryExportEndpoint: '/dev/contentDictionary/export/manifest',

    fileChooserStyle: 'tree',
    pasteStyle: 'default',
    searchDrawerInitialWidth: '600px',
    undoStackMaxSize: 20,
    printDebugTimings: true,
    useAppBlock: true,
    version: '1.3',
    build: '0e57fbf',
    copyright: 'Copyright 2015 Korn Ferry International',

    // seconds to wait before releasing the block
    appBlockDefaultTimeout: 60

};

