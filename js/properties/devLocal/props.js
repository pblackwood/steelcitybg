module.exports = {
    environment: 'dev',

    localhost: true,

    contentDictionaryEndpoint: 'http://localhost:3030/contentDictionary',
    contentDictionaryStateEndpoint: 'http://localhost:3030/contentDictionary/state/manifests',
    contentDictionaryTagsEndpoint: 'http://localhost:3030/contentDictionary/tags',
    contentDictionarySearchEndpoint: 'http://localhost:3030/contentDictionary/search',
    contentDictionaryLockEndpoint: 'http://localhost:3030/contentDictionary/lock',
    contentDictionaryImportEndpoint: 'http://localhost:3030/contentDictionary/import/manifest',
    contentDictionaryExportEndpoint: 'http://localhost:3030/contentDictionary/export/manifest',

    // admin on AWS
    authorizationString: "Basic YWRtaW46TUxQYXNzd29yZDEyMyQ=",

    // pswartwout on AWS
    //authorizationString: "Basic cHN3YXJ0d291dDpQc3c0cnR3MHV0",

    defaultManifest: 'sandbox.peter.abc',
    //defaultView: 'TREE',
    //alwaysConfirm: true,
    //alwaysDeny: true,
    //alwaysExpandNavMenus: true,
    //showWelcome: true,
    //alwaysExpandSearchDrawer: true,
    //pasteStyle: 'clone',
    fileChooserStyle: 'tree',
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

