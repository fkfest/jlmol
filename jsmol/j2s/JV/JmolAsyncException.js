Clazz.declarePackage("JV");
Clazz.load(["java.io.IOException"], "JV.JmolAsyncException", null, function(){
var c$ = Clazz.decorateAsClass(function(){
this.fileName = null;
Clazz.instantialize(this, arguments);}, JV, "JmolAsyncException", java.io.IOException);
Clazz.makeConstructor(c$, 
function(cacheName){
Clazz.superConstructor (this, JV.JmolAsyncException, []);
this.fileName = cacheName;
}, "~S");
Clazz.defineMethod(c$, "getFileName", 
function(){
return this.fileName;
});
});
;//5.0.1-v4 Thu Feb 20 12:29:54 CST 2025
