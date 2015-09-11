var request = require('request');
var restify = require('restify');
var VERSION = '0.1.0';
var argv = require('minimist')(process.argv.slice(2));

var esUrl      = argv.elasticsearch;
var listenPort = argv.listenPort || 11739;
var listenHost = argv.listenHost;
var enableCors = !!argv.cors;

if (!esUrl) throw new Error('Please specify an elasticsearch url')

var server = restify.createServer();

if (enableCors) {
    server.use(restify.CORS({
	origins: ['*'],
	credentials: false,
	headers: []
    }));
}

server.get('/module/:moduleId', function(req, res, next) {
    request(esUrl + '/modules/module/' + req.moduleId + '/_source').pipe(res);
});

server.put('/module/:moduleId', function(req, res, next) {
    var url = esUrl + '/modules/module/' + req.moduleId;
    request({method:'GET', uri: url}, function(err, esResp, body) {
	if (esResp.statusCode >= 200 && esResp.statusCode < 300) {
	    if (! JSON.parse(body)['workInProgress']) {
		next(new restify.BadRequestError('A published module already exists with this ID'));
		return;
	    }
	} else if (esResp.statusCode !== 404) {
	    next(new restify.InternalError('Issue with storage backend'));
	    return;
	}
	request({method:'PUT', uri:url}).pipe(res);
    });
});

server.use(restify.queryParser());

server.get('/module', function(req, res, next) {
    var query = req.query.q;
    request(esUrl + '/modules/module/_search?q=' + query).pipe(res);
});


function onStart() {
    console.log('Wildflower repository v%s, listening at %s (CORS:%s)', VERSION, server.url, enableCors);
}

if (listenHost) {
    server.listen(listenPort, listenHost, onStart);
} else {
    server.listen(listenPort, onStart);
}
