# wf-repository
This is a simple node.js server for storing [Wildflower](https://github.com/pschanely/wildflower) code.
It will store Wildflower modules in an elasticsearch index named "modules" with type "module".

To set up the elasticsearch index, use this:
```
curl -XPOST 'http://localhost:9200/modules' --data-binary "@modules.mapping.json"
```

Then, you can run your server like so:

```
node repository.js --elasticsearch=http://localhost:9200 --listenPort=11739 --cors
```

Clients of your repository may then request modules:
```
GET http://localhost:11739/module/<module id>
```

Clients may then store new modules at:
```
PUT http://localhost:11739/module/<module id>
<Wildflower JSON body>
```

And clients may search modules here:
```
GET http://localhost:11739/module?q=<query>
```
