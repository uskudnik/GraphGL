// Javascript rewrite of ForceAtlas algorithm from ActionScript
// Original: https://github.com/jacomyal/SiGMa-core/blob/master/src/com/ofnodesandedges/y2011/core/layout/forceAtlas

// Underscore.js 1.2.3
// (c) 2009-2011 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
(function(){function r(a,c,d){if(a===c)return a!==0||1/a==1/c;if(a==null||c==null)return a===c;if(a._chain)a=a._wrapped;if(c._chain)c=c._wrapped;if(a.isEqual&&b.isFunction(a.isEqual))return a.isEqual(c);if(c.isEqual&&b.isFunction(c.isEqual))return c.isEqual(a);var e=l.call(a);if(e!=l.call(c))return false;switch(e){case "[object String]":return a==String(c);case "[object Number]":return a!=+a?c!=+c:a==0?1/a==1/c:a==+c;case "[object Date]":case "[object Boolean]":return+a==+c;case "[object RegExp]":return a.source==
c.source&&a.global==c.global&&a.multiline==c.multiline&&a.ignoreCase==c.ignoreCase}if(typeof a!="object"||typeof c!="object")return false;for(var f=d.length;f--;)if(d[f]==a)return true;d.push(a);var f=0,g=true;if(e=="[object Array]"){if(f=a.length,g=f==c.length)for(;f--;)if(!(g=f in a==f in c&&r(a[f],c[f],d)))break}else{if("constructor"in a!="constructor"in c||a.constructor!=c.constructor)return false;for(var h in a)if(m.call(a,h)&&(f++,!(g=m.call(c,h)&&r(a[h],c[h],d))))break;if(g){for(h in c)if(m.call(c,
h)&&!f--)break;g=!f}}d.pop();return g}var s=this,F=s._,o={},k=Array.prototype,p=Object.prototype,i=k.slice,G=k.concat,H=k.unshift,l=p.toString,m=p.hasOwnProperty,v=k.forEach,w=k.map,x=k.reduce,y=k.reduceRight,z=k.filter,A=k.every,B=k.some,q=k.indexOf,C=k.lastIndexOf,p=Array.isArray,I=Object.keys,t=Function.prototype.bind,b=function(a){return new n(a)};if(typeof exports!=="undefined"){if(typeof module!=="undefined"&&module.exports)exports=module.exports=b;exports._=b}else typeof define==="function"&&
define.amd?define("underscore",function(){return b}):s._=b;b.VERSION="1.2.3";var j=b.each=b.forEach=function(a,c,b){if(a!=null)if(v&&a.forEach===v)a.forEach(c,b);else if(a.length===+a.length)for(var e=0,f=a.length;e<f;e++){if(e in a&&c.call(b,a[e],e,a)===o)break}else for(e in a)if(m.call(a,e)&&c.call(b,a[e],e,a)===o)break};b.map=function(a,c,b){var e=[];if(a==null)return e;if(w&&a.map===w)return a.map(c,b);j(a,function(a,g,h){e[e.length]=c.call(b,a,g,h)});return e};b.reduce=b.foldl=b.inject=function(a,
c,d,e){var f=arguments.length>2;a==null&&(a=[]);if(x&&a.reduce===x)return e&&(c=b.bind(c,e)),f?a.reduce(c,d):a.reduce(c);j(a,function(a,b,i){f?d=c.call(e,d,a,b,i):(d=a,f=true)});if(!f)throw new TypeError("Reduce of empty array with no initial value");return d};b.reduceRight=b.foldr=function(a,c,d,e){var f=arguments.length>2;a==null&&(a=[]);if(y&&a.reduceRight===y)return e&&(c=b.bind(c,e)),f?a.reduceRight(c,d):a.reduceRight(c);var g=b.toArray(a).reverse();e&&!f&&(c=b.bind(c,e));return f?b.reduce(g,
c,d,e):b.reduce(g,c)};b.find=b.detect=function(a,c,b){var e;D(a,function(a,g,h){if(c.call(b,a,g,h))return e=a,true});return e};b.filter=b.select=function(a,c,b){var e=[];if(a==null)return e;if(z&&a.filter===z)return a.filter(c,b);j(a,function(a,g,h){c.call(b,a,g,h)&&(e[e.length]=a)});return e};b.reject=function(a,c,b){var e=[];if(a==null)return e;j(a,function(a,g,h){c.call(b,a,g,h)||(e[e.length]=a)});return e};b.every=b.all=function(a,c,b){var e=true;if(a==null)return e;if(A&&a.every===A)return a.every(c,
b);j(a,function(a,g,h){if(!(e=e&&c.call(b,a,g,h)))return o});return e};var D=b.some=b.any=function(a,c,d){c||(c=b.identity);var e=false;if(a==null)return e;if(B&&a.some===B)return a.some(c,d);j(a,function(a,b,h){if(e||(e=c.call(d,a,b,h)))return o});return!!e};b.include=b.contains=function(a,c){var b=false;if(a==null)return b;return q&&a.indexOf===q?a.indexOf(c)!=-1:b=D(a,function(a){return a===c})};b.invoke=function(a,c){var d=i.call(arguments,2);return b.map(a,function(a){return(c.call?c||a:a[c]).apply(a,
d)})};b.pluck=function(a,c){return b.map(a,function(a){return a[c]})};b.max=function(a,c,d){if(!c&&b.isArray(a))return Math.max.apply(Math,a);if(!c&&b.isEmpty(a))return-Infinity;var e={computed:-Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b>=e.computed&&(e={value:a,computed:b})});return e.value};b.min=function(a,c,d){if(!c&&b.isArray(a))return Math.min.apply(Math,a);if(!c&&b.isEmpty(a))return Infinity;var e={computed:Infinity};j(a,function(a,b,h){b=c?c.call(d,a,b,h):a;b<e.computed&&(e={value:a,
computed:b})});return e.value};b.shuffle=function(a){var c=[],b;j(a,function(a,f){f==0?c[0]=a:(b=Math.floor(Math.random()*(f+1)),c[f]=c[b],c[b]=a)});return c};b.sortBy=function(a,c,d){return b.pluck(b.map(a,function(a,b,g){return{value:a,criteria:c.call(d,a,b,g)}}).sort(function(a,c){var b=a.criteria,d=c.criteria;return b<d?-1:b>d?1:0}),"value")};b.groupBy=function(a,c){var d={},e=b.isFunction(c)?c:function(a){return a[c]};j(a,function(a,b){var c=e(a,b);(d[c]||(d[c]=[])).push(a)});return d};b.sortedIndex=
function(a,c,d){d||(d=b.identity);for(var e=0,f=a.length;e<f;){var g=e+f>>1;d(a[g])<d(c)?e=g+1:f=g}return e};b.toArray=function(a){return!a?[]:a.toArray?a.toArray():b.isArray(a)?i.call(a):b.isArguments(a)?i.call(a):b.values(a)};b.size=function(a){return b.toArray(a).length};b.first=b.head=function(a,b,d){return b!=null&&!d?i.call(a,0,b):a[0]};b.initial=function(a,b,d){return i.call(a,0,a.length-(b==null||d?1:b))};b.last=function(a,b,d){return b!=null&&!d?i.call(a,Math.max(a.length-b,0)):a[a.length-
1]};b.rest=b.tail=function(a,b,d){return i.call(a,b==null||d?1:b)};b.compact=function(a){return b.filter(a,function(a){return!!a})};b.flatten=function(a,c){return b.reduce(a,function(a,e){if(b.isArray(e))return a.concat(c?e:b.flatten(e));a[a.length]=e;return a},[])};b.without=function(a){return b.difference(a,i.call(arguments,1))};b.uniq=b.unique=function(a,c,d){var d=d?b.map(a,d):a,e=[];b.reduce(d,function(d,g,h){if(0==h||(c===true?b.last(d)!=g:!b.include(d,g)))d[d.length]=g,e[e.length]=a[h];return d},
[]);return e};b.union=function(){return b.uniq(b.flatten(arguments,true))};b.intersection=b.intersect=function(a){var c=i.call(arguments,1);return b.filter(b.uniq(a),function(a){return b.every(c,function(c){return b.indexOf(c,a)>=0})})};b.difference=function(a){var c=b.flatten(i.call(arguments,1));return b.filter(a,function(a){return!b.include(c,a)})};b.zip=function(){for(var a=i.call(arguments),c=b.max(b.pluck(a,"length")),d=Array(c),e=0;e<c;e++)d[e]=b.pluck(a,""+e);return d};b.indexOf=function(a,
c,d){if(a==null)return-1;var e;if(d)return d=b.sortedIndex(a,c),a[d]===c?d:-1;if(q&&a.indexOf===q)return a.indexOf(c);for(d=0,e=a.length;d<e;d++)if(d in a&&a[d]===c)return d;return-1};b.lastIndexOf=function(a,b){if(a==null)return-1;if(C&&a.lastIndexOf===C)return a.lastIndexOf(b);for(var d=a.length;d--;)if(d in a&&a[d]===b)return d;return-1};b.range=function(a,b,d){arguments.length<=1&&(b=a||0,a=0);for(var d=arguments[2]||1,e=Math.max(Math.ceil((b-a)/d),0),f=0,g=Array(e);f<e;)g[f++]=a,a+=d;return g};
var E=function(){};b.bind=function(a,c){var d,e;if(a.bind===t&&t)return t.apply(a,i.call(arguments,1));if(!b.isFunction(a))throw new TypeError;e=i.call(arguments,2);return d=function(){if(!(this instanceof d))return a.apply(c,e.concat(i.call(arguments)));E.prototype=a.prototype;var b=new E,g=a.apply(b,e.concat(i.call(arguments)));return Object(g)===g?g:b}};b.bindAll=function(a){var c=i.call(arguments,1);c.length==0&&(c=b.functions(a));j(c,function(c){a[c]=b.bind(a[c],a)});return a};b.memoize=function(a,
c){var d={};c||(c=b.identity);return function(){var b=c.apply(this,arguments);return m.call(d,b)?d[b]:d[b]=a.apply(this,arguments)}};b.delay=function(a,b){var d=i.call(arguments,2);return setTimeout(function(){return a.apply(a,d)},b)};b.defer=function(a){return b.delay.apply(b,[a,1].concat(i.call(arguments,1)))};b.throttle=function(a,c){var d,e,f,g,h,i=b.debounce(function(){h=g=false},c);return function(){d=this;e=arguments;var b;f||(f=setTimeout(function(){f=null;h&&a.apply(d,e);i()},c));g?h=true:
a.apply(d,e);i();g=true}};b.debounce=function(a,b){var d;return function(){var e=this,f=arguments;clearTimeout(d);d=setTimeout(function(){d=null;a.apply(e,f)},b)}};b.once=function(a){var b=false,d;return function(){if(b)return d;b=true;return d=a.apply(this,arguments)}};b.wrap=function(a,b){return function(){var d=G.apply([a],arguments);return b.apply(this,d)}};b.compose=function(){var a=arguments;return function(){for(var b=arguments,d=a.length-1;d>=0;d--)b=[a[d].apply(this,b)];return b[0]}};b.after=
function(a,b){return a<=0?b():function(){if(--a<1)return b.apply(this,arguments)}};b.keys=I||function(a){if(a!==Object(a))throw new TypeError("Invalid object");var b=[],d;for(d in a)m.call(a,d)&&(b[b.length]=d);return b};b.values=function(a){return b.map(a,b.identity)};b.functions=b.methods=function(a){var c=[],d;for(d in a)b.isFunction(a[d])&&c.push(d);return c.sort()};b.extend=function(a){j(i.call(arguments,1),function(b){for(var d in b)b[d]!==void 0&&(a[d]=b[d])});return a};b.defaults=function(a){j(i.call(arguments,
1),function(b){for(var d in b)a[d]==null&&(a[d]=b[d])});return a};b.clone=function(a){return!b.isObject(a)?a:b.isArray(a)?a.slice():b.extend({},a)};b.tap=function(a,b){b(a);return a};b.isEqual=function(a,b){return r(a,b,[])};b.isEmpty=function(a){if(b.isArray(a)||b.isString(a))return a.length===0;for(var c in a)if(m.call(a,c))return false;return true};b.isElement=function(a){return!!(a&&a.nodeType==1)};b.isArray=p||function(a){return l.call(a)=="[object Array]"};b.isObject=function(a){return a===
Object(a)};b.isArguments=function(a){return l.call(a)=="[object Arguments]"};if(!b.isArguments(arguments))b.isArguments=function(a){return!(!a||!m.call(a,"callee"))};b.isFunction=function(a){return l.call(a)=="[object Function]"};b.isString=function(a){return l.call(a)=="[object String]"};b.isNumber=function(a){return l.call(a)=="[object Number]"};b.isNaN=function(a){return a!==a};b.isBoolean=function(a){return a===true||a===false||l.call(a)=="[object Boolean]"};b.isDate=function(a){return l.call(a)==
"[object Date]"};b.isRegExp=function(a){return l.call(a)=="[object RegExp]"};b.isNull=function(a){return a===null};b.isUndefined=function(a){return a===void 0};b.noConflict=function(){s._=F;return this};b.identity=function(a){return a};b.times=function(a,b,d){for(var e=0;e<a;e++)b.call(d,e)};b.escape=function(a){return(""+a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;")};b.mixin=function(a){j(b.functions(a),function(c){J(c,
b[c]=a[c])})};var K=0;b.uniqueId=function(a){var b=K++;return a?a+b:b};b.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};b.template=function(a,c){var d=b.templateSettings,d="var __p=[],print=function(){__p.push.apply(__p,arguments);};with(obj||{}){__p.push('"+a.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(d.escape,function(a,b){return"',_.escape("+b.replace(/\\'/g,"'")+"),'"}).replace(d.interpolate,function(a,b){return"',"+b.replace(/\\'/g,
"'")+",'"}).replace(d.evaluate||null,function(a,b){return"');"+b.replace(/\\'/g,"'").replace(/[\r\n\t]/g," ")+";__p.push('"}).replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t")+"');}return __p.join('');",e=new Function("obj","_",d);return c?e(c,b):function(a){return e.call(this,a,b)}};var n=function(a){this._wrapped=a};b.prototype=n.prototype;var u=function(a,c){return c?b(a).chain():a},J=function(a,c){n.prototype[a]=function(){var a=i.call(arguments);H.call(a,this._wrapped);return u(c.apply(b,
a),this._chain)}};b.mixin(b);j("pop,push,reverse,shift,sort,splice,unshift".split(","),function(a){var b=k[a];n.prototype[a]=function(){b.apply(this._wrapped,arguments);return u(this._wrapped,this._chain)}});j(["concat","join","slice"],function(a){var b=k[a];n.prototype[a]=function(){return u(b.apply(this._wrapped,arguments),this._chain)}});n.prototype.chain=function(){this._chain=true;return this};n.prototype.value=function(){return this._wrapped}}).call(this);

/* Quick & dirty debug helpers */
function console() {};
console.log = function(msg) {
	var log = {
		log: msg,
		type: "log"
	}
	postMessage(log);
};

console.nodes = function(graph) {
	graph.nodes.forEach(function(key, node){
		console.log(node.layoutData);
	});
}

Math.hypot = function(n1, n2) {
	// Since Javascript is stupid regarding numbers, we implement it (by wikipedia: http://en.wikipedia.org/wiki/Hypot)	
	var x = n1.x - n2.x;
	var y = n1.y - n2.y;
	if (Math.abs(x) < Math.abs(y)) {
		var ox = x; //old x
		x = y;
		y = ox;
	}
	return Math.abs(x) * Math.sqrt(1 + Math.pow(y/x, 2));
};

function Region(nodes) {
	this.mass;
	this.massCenterX;
	this.massCenterY;
	this.size;
	
	this.nodes = nodes;
	this.subregions = [];
	this.updateMassAndGeometry();
}

Region.prototype.updateMassAndGeometry = function() {
	if (this.nodes.length > 1) {
		this.mass = 0;
		
		var massSumX = 0;
		var massSumY = 0;
		
		for(var i=0; i < this.nodes.length;i++){
			var node = this.nodes[i];
			this.mass += node.mass;
			massSumX += node.x * node.mass;
			massSumY += node.y * node.mass;
		}
		
		this.massCenterX = massSumX / this.mass;
		this.massCenterY = massSumY / this.mass;
		
		this.size = this.nodes[0].mass;
		for(var i=0; i<this.nodes.length;i++) {
			var distance = Math.hypot(this.nodes[i], {x: this.massCenterX, y: this.massCenterY});
			this.size = (this.size > distance) ? distance : this.size;
		}
	}
}

Region.prototype.buildSubRegions = function() {
	if(this.nodes.length > 1) {
		var leftNodes = [];
		var rightNodes = [];
		for(var i=0;i<this.nodes.length;i++){
			var node = this.nodes[i];
			var nodesColumn = (node.x < this.massCenterX) ? leftNodes : rightNodes;
			nodesColumn.push(node);
		}
				
		var topleftNodes = [];
		var bottomleftNodes = [];
		for(var i=0;i<leftNodes.length;i++) {
			var node = leftNodes[i];
			var nodesLine = (node.y < this.massCenterY) ? topleftNodes : bottomleftNodes;
			nodesLine.push(node);
		}
		
		var toprightNodes = [];
		var bottomrightNodes = [];
		for(var i=0;i<rightNodes;i++) {
			var node = rightNodes[i];
			nodesLine = (node.y < this.massCenterY) ? toprightNodes : bottomrightNodes;
			nodesLine.push(node);
		}
		
		if(topleftNodes.length > 0){
			if(topleftNodes.length < this.nodes.length){
				subregion = new Region(topleftNodes);
				this.subregions.push(subregion);
			} else {
				for(var i=0; i<topleftNodes.length;i++){
					oneNodeList = [];
					oneNodeList.push(topleftNodes[i]);
					// var oneNodeList = [topleftNodes[i],];
					subregion = new Region(oneNodeList);
					this.subregions.push(subregion);
				}
			}
		}

		if(bottomleftNodes.length>0){
			if(bottomleftNodes.length<this.nodes.length){
				subregion = new Region(bottomleftNodes);
				this.subregions.push(subregion);
			} else {
				for(var i=0; i<bottomleftNodes.length;i++){
					oneNodeList = [];
					oneNodeList.push(bottomleftNodes[i]);
					// var oneNodeList = [bottomleftNodes[i],];
					subregion = new Region(oneNodeList);
					this.subregions.push(subregion);
				}
			}
		}

		if(bottomrightNodes.length>0){
			if(bottomrightNodes.length<this.nodes.length){
				subregion = new Region(bottomrightNodes);
				this.subregions.push(subregion);
			} else {
				for(var i=0; i<bottomrightNodes.length;i++){
					oneNodeList = [];
					oneNodeList.push(bottomrightNodes[i]);
					// var oneNodeList = [bottomrightNodes[i],];
					subregion = new Region(oneNodeList);
					this.subregions.push(subregion);
				}
			}
		}

		if(toprightNodes.length>0){
			if(toprightNodes.length<this.nodes.length){
				subregion = new Region(toprightNodes);
				this.subregions.push(subregion);
			} else {
				for(var i=0; i<toprightNodes.length;i++){
					oneNodeList = []
					oneNodeList.push(toprightNodes[i]);
					// var oneNodeList = [toprightNodes[i],];
					subregion = new Region(oneNodeList);
					this.subregions.push(subregion);
				}
			}
		}
		
		for(var i=0; i<this.subregions.length;i++) {
			subregion.buildSubRegions();
		}
	}
}

Region.prototype.applyForce = function(node, coeff, theta) {
	if (this.nodes.length < 2) {
		LinearRepulsion.apply_node_to_node(node, this.nodes[0], coeff);
	} else {
		var distance = Math.hypot(node, {x: this.massCenterX, y: this.massCenterY});
		
		if (distance * theta > this.size) {
			LinearRepulsion.apply_node_to_region(node, this, coeff);
		} else {
			for(var i=0; i<this.subregions.length;i++) {
				this.subregions[i].applyForce(node, coeff, this.theta);
			}
		}
	}
}

function LinearRepulsion() {}
LinearRepulsion.apply_node_to_node = function(n1, n2, coefficient) {
	var xDist = n1.x - n2.x;
	var yDist = n1.y - n2.y;
	var distance = Math.hypot(n1, n2);
	
	if (distance > 0) {
		var factor = coefficient * n1.mass * n2.mass / Math.pow(distance, 2);
		
		n1.dx += xDist * factor;
		n1.dy += yDist * factor;
		
		n2.dx -= xDist * factor;
		n2.dy -= yDist * factor;
	}
};

LinearRepulsion.apply_node_to_region = function(node, region, coefficient) {
	var xDist = node.x - region.massCenterX;
	var yDist = node.y - region.massCenterY;
	var distance = Math.hypot(node, {x: region.massCenterX, y: region.massCenterY});
	
	if (distance > 0) {
		var factor = coefficient * node.mass * region.mass / distance / distance;
		
		node.dx += xDist * factor;
		node.dy += yDist * factor; 
	}
};

// TODO: node_to_region

LinearRepulsion.apply_gravity = function(n, g, coefficient) {
	var distance = Math.hypot(n, {x: 0, y:0});
	if (distance > 0) {
		var factor = coefficient * n.mass * g / distance;
		
		n.dx -= n.x * factor;
		n.dy -= n.y * factor;
	}
};

function LinearAttraction() {}
LinearAttraction.apply = function(n1, n2, e) {
	var xDist = n1.x - n2.x;
	var yDist = n1.y - n2.y;
	
	var factor = -e;
	
	n1.dx += xDist * factor;
	n1.dy += yDist * factor;
	
	n2.dx -= xDist * factor;
	n2.dy -= yDist * factor;
};

function Graph() {
	this.edges = [];
	this.nodes = [];
	
	this.nodesIndex = {};
	this.edgesIndex = {};
	
	// TODO
	this.nodeAttributes = {};
	this.edgeAttributes = {};
}

Graph.prototype.pushNode = function(node) {
	var nindex = this.nodes.push(node);
	this.nodesIndex[node.id] = nindex - 1;
}

Graph.prototype.pushEdge = function(edge) {
	var eindex = this.edges.push(edge);
	this.edgesIndex[edge.id] = eindex - 1;
	console.log([eindex, edge]);
	this.nodes[this.nodesIndex[edge.targetID]].edges[edge.id] = edge.sourceID;
	this.nodes[this.nodesIndex[edge.sourceID]].edges[edge.id] = edge.targetID;

	this.nodes[this.nodesIndex[edge.targetID]].degree += 1;
	this.nodes[this.nodesIndex[edge.sourceID]].degree += 1;
}

// TODO: dropNode, dropEdge, pushGraph, updateGraph

function Node(id) {
	this.id = id;
	this.degree = 0;
	
	this.edges = {};
		
	this.x = 0;
	this.y = 0;
	
	this.displayX = this.x;
	this.displayY = this.y;
	
	this.dx = 0;
	this.dy = 0;
	
	this.old_dx = 0;
	this.old_dy = 0;
	
	this.mass = 1;
	this.size = 1;
	this.shape = 0;
	
	this.displaySize = this.size;
	this.isFixed = false;
}

function Edge(id, sourceID, targetID) {
	this.id = id;
	this.sourceID = sourceID;
	this.targetID = targetID;
	
	this.weight = 1;
	this.thickness = 1;
}

function ForceAtlas(graph) {
	console.log("Starting ForceAtlas2");
	
	this.speed = 1;
	
	this.nodes = graph.nodes;
	this.edges = graph.edges;
	
	this.nodesIndex = graph.nodesIndex;
	this.edgesIndex = graph.edgesIndex;
	// this.nodesCount = graph.nodes.lenght;
	// console.log(this.nodes);
	// console.log(graph.edges);
	for(var i=0; i<this.nodes.length;i++) {
		var node = this.nodes[i];
		
		node.mass = 1 + node.degree;
		node.old_dx = 0;
		node.old_dy = 0;
		node.dx = 0;
		node.dy = 0;
	}
	
	console.log(this.nodes);
	
	if (this.nodes.length >= 100) {
		this.scalingRatio = 2;
	} else {
		this.scalingRatio = 10;
	};
	
	this.gravity = 1;
	this.edgeWeightInfluence = 1;
	
	if(this.nodes.length >= 50000) {
		this.jitterTolerance = 10;
	} else if (this.nodes.length>=5000) {
		this.jitterTolerance = 1;
	} else {
		this.jitterTolerance = 0.1;
	};
	
	if (this.nodes.length >= 1000) {
		this.isBarnesHutOptimize = true;
	} else {
		this.isBarnesHutOptimize = false;
	}
	this.isBarnesHutOptimize = false;
	
	
	this.maxEdgeWeight = 30;
	this.theta = 1.2;
	this.moveQuantity = 10;
}

ForceAtlas.prototype.computeOneStep = function() {
	console.log("Computing one step");
	var that = this;
	
	// console.log(_.map(this.nodes, function(node){return [node.dx, node.dy]}));
	_.map(this.nodes, function(node){
		node.mass = 1 + node.degree;
		node.old_dx = node.dx;
		node.old_dy = node.dy;
		node.dx = 0;
		node.dy = 0;
	});
	
	// console.log("after initial");
	// console.log(_.map(this.nodes, function(node){return [node.dx, node.dy]}));
	
	if (this.isBarnesHutOptimize) {
		var rootRegion = new Region(this.nodes);
		rootRegion.buildSubRegions();
	}
	
	
	// console.log("repulsion");
	// Repulsion
	if(this.isBarnesHutOptimize) {
		_.map(this.nodes, function(node){
			rootRegion.applyForce(node, that.scalingRatio, that.theta);
		});
	} else {
		for(var i=0; i<this.nodes.length;i++) {
			var node1 = this.nodes[i];
			for(var j=0; j<this.nodes.length;j++) {
				var node2 = this.nodes[j];
				LinearRepulsion.apply_node_to_node(node1, node2, that.scalingRatio);
			}
		}
	}
	// console.log(_.map(this.nodes, function(node){return [node.dx, node.dy]}));
	
	// console.log("attraction");
	// Attraction
	var powa;
	_.map(this.edges, function(edge){
		powa = Math.min( (that.edgeWeightInfluence!=1) ? Math.pow(edge.weight,that.edgeWeightInfluence) : edge.weight, that.maxEdgeWeight);
		LinearAttraction.apply(that.nodes[ that.nodesIndex[edge.sourceID] ], that.nodes[ that.nodesIndex[edge.targetID] ], powa);
	});
	// console.log(_.map(this.nodes, function(node){return [node.dx, node.dy]}));
	
	
	var totalSwinging = 0;
	var totalEffectiveTraction = 0;
	var swinging;
	
	// console.log("gravity");
	_.map(this.nodes, function(node){
		LinearRepulsion.apply_gravity(node, that.gravity / that.scalingRatio, 1);
		
		if (!node.isFixed) {
			swinging = Math.sqrt(Math.pow(node.old_dx - node.dx, 2) + Math.pow(node.old_dy - node.dy, 2));
			totalSwinging += node.mass * swinging;
			totalEffectiveTraction += node.mass * 0.5 * Math.sqrt(Math.pow(node.old_dx + node.dx, 2) + Math.pow(node.old_dy + node.dy, 2));
		}
	});
	// console.log(_.map(this.nodes, function(node){return [node.dx, node.dy]}));
	
	
	var targetSpeed = this.jitterTolerance * this.jitterTolerance * totalEffectiveTraction / totalSwinging;
	
	var maxRise = 2;
	this.speed = Math.min(targetSpeed, maxRise*this.speed);
	
	this.old_moveQuantity = this.moveQuantity;
	this.moveQuantity = 0;
	// console.log("apply forces");
	_.map(this.nodes, function(node){
		swinging = Math.sqrt(Math.pow(node.old_dx - node.dx, 2) + Math.pow(node.old_dy - node.dy, 2));
		
		var factor = that.speed / (1 + that.speed * Math.sqrt(swinging) );
		that.moveQuantity += Math.sqrt(Math.pow(node.dx * factor, 2) + Math.pow(node.dy * factor, 2));
		
		node.x += node.dx * factor;
		node.y += node.dy * factor;
	});
	
	// console.log([this.old_moveQuantity, this.moveQuantity]);
	
	// console.log(["move quantity", this.moveQuantity]);
	// console.log(_.map(this.nodes, function(node){return [node.dx, node.dy]}));
	// console.log(_.map(this.nodes, function(node){return [node.x, node.y]}));
	
}

function updateGraphGL() {
	outdata = {}
	outdata.nodes = {}
	var bbmaxx=graph.nodes[0].x, bbmaxy=graph.nodes[0].y, bbminx=graph.nodes[0].x, bbminy=graph.nodes[0].y; 
	for(var nid in graph.nodes) {
		node = graph.nodes[nid];
		// console.log(node);
		outdata.nodes[node.id] = {
			x: node.x,
			y: node.y
		};
		bbmaxx = Math.max(bbmaxx, node.x);
		bbmaxy = Math.max(bbmaxy, node.y);
		
		bbminx = Math.min(bbminx, node.x);
		bbminy = Math.min(bbminy, node.y);
	}
	outdata.boundingBox = {
		maxx: bbmaxx,
		maxy: bbmaxy,
		minx: bbminx,
		miny: bbminy
	}
	console.log("outdata:");
	console.log(outdata);
	postMessage(outdata);
}

var options;
var graph = new Graph();

onmessage = function(msg) {
	// Initialize internal graph and start doin' magik
	var nodes = msg.data.nodes;
	var edges = msg.data.edges;
	options = msg.data.algorithmOptions;
	
	console.log('startdata');
	console.log(nodes);
	console.log(edges);
	
	// nodeData: new Vector(parseInt(n, 10)/10000, parseInt(n, 10)/5000, false),
	
	for(var n in nodes) {
		var node = new Node(n);
		// console.log(node);
		node.x = Math.random();
		node.y = Math.random();
		// console.log(node);
		graph.pushNode(node)
	}
	
	for(var e in edges) {
		var edge = new Edge(e, edges[e].source, edges[e].target);
		graph.pushEdge(edge)
	}
	
	console.log("graph");
	console.log(graph);
	
	var fd = new ForceAtlas(graph);
	// var i = 20;
	var i=0;
	console.log(fd.moveQuantity);
	while(fd.moveQuantity > 1) {
		fd.computeOneStep();
		console.log([i, fd.moveQuantity]);
		i++;
		if (i % 10 == 0) {
			updateGraphGL();
		}
	};
	
	console.log("finished iterating");
	close();
}