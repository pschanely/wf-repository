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

server.on('uncaughtException', function(req, res, route, err) {
    console.log('uncaughtException', err.stack);
});

if (enableCors) {
    server.use(restify.CORS({
	origins: ['*'],
	credentials: false,
	headers: []
    }));
}

server.get('/module/:moduleId', function(req, res, next) {
    res.setHeader('Cache-Control', 'max-age:31556926');
    request(esUrl + '/modules/module/' + encodeURIComponent(req.params.moduleId) + '/_source').pipe(res);
});

function checkNonPublished(url, next, okCb) {
    console.log('es ', url);
    request({method:'GET', uri: url + '/_source'}, function(err, esResp, body) {
	console.log('es resp1', esResp.statusCode, body);
	if (esResp.statusCode >= 200 && esResp.statusCode < 300) {
	    console.log('es resp2', esResp.statusCode, body);
	    if (! JSON.parse(body)['workInProgress']) {
		next(new restify.BadRequestError('Cannot modify a published module'));
		return;
	    }
	} else if (esResp.statusCode !== 404) {
	    next(new restify.InternalError('Issue with storage backend'));
	    return;
	}
	okCb();
    });
}

server.del('/module/:moduleId', function(req, res, next) {
    var url = esUrl + '/modules/module/' + encodeURIComponent(req.params.moduleId);
    checkNonPublished(url, next, function() {
	request({method:'DELETE', uri: url}).pipe(res);
    });
});

server.put('/module/:moduleId', function(req, res, next) {
    var url = esUrl + '/modules/module/' + encodeURIComponent(req.params.moduleId);
    checkNonPublished(url, next, function() {
	req.pipe(request({method:'PUT', uri:url})).pipe(res);
    });
});

server.use(restify.queryParser());

server.get('/module', function(req, res, next) {
    var query = req.query.q;
    request(esUrl + '/modules/module/_search?q=' + encodeURIComponent(query), function(err, esResp, body) {
	if (esResp.statusCode >= 200 && esResp.statusCode < 300) {
	    var hits = JSON.parse(body).hits.hits.map(function(h){
		return {id:h._id, name:h._source.name, forkedFrom:h._source.forkedFrom};
	    });
	    res.send(hits);
	    next();
	} else {
	    next(new restify.InternalError('Issue with storage backend'));
	}
    });
});


function onStart() {
    console.log('Wildflower repository v%s, listening at %s (CORS:%s)', VERSION, server.url, enableCors);
}

if (listenHost) {
    server.listen(listenPort, listenHost, onStart);
} else {
    server.listen(listenPort, onStart);
}
