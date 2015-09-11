# wf-repository
This is a simple node.js server for storing Wildflower code.
It will store Wildflower modules in an elasticsearch index named "modules" with type "module".

```
node repositry.js --elasticsearch=http://localhost:9200 --listenPort=11739 --cors
```

Clients of your repository may then request modules:
```
GET http://localhost:11739/module/<module id>
```

Clients may then store new modules at:
```
PUT http://localhost:11739/module/<module id>
<Wildflow JSON body>
```

And clients may search modules here:
```
GET http://localhost:11739/module?q=<query>
```
