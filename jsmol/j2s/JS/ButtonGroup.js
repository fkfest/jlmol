Clazz.declarePackage("JS");
Clazz.load(null, "JS.ButtonGroup", ["JS.Component"], function(){
var c$ = Clazz.decorateAsClass(function(){
this.id = null;
this.count = 0;
Clazz.instantialize(this, arguments);}, JS, "ButtonGroup", null);
Clazz.makeConstructor(c$, 
function(){
this.id = JS.Component.newID("bg");
});
Clazz.defineMethod(c$, "add", 
function(item){
this.count++;
(item).htmlName = this.id;
}, "J.api.SC");
Clazz.defineMethod(c$, "getButtonCount", 
function(){
return this.count;
});
});
;//5.0.1-v4 Thu Feb 20 12:29:54 CST 2025
