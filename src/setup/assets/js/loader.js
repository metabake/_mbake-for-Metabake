depp.define({
    'scripts': [, '#jquery', ROOT + 'assets/css/spectreBottom.css'],
    'httpRPC': [, '#RPC',
        ROOT + 'assets/js/BindSetup.js',
        ROOT + '../IntuAPI/IntuAPI.js',
    ],
    'setup': [
        '#scripts', '#httpRPC'
    ],

    'fonts': [
        '#rw', '#OpenSans'
    ]
});

depp.require(['fonts']);