var WIDTH = 400, 
	HEIGHT = 300;
	
var VIEW_ANGLE = 45,
	ASPECT = WIDTH/HEIGHT,
	NEAR = 0.1,
	FAR = 10000;

function GraphGL(data, options) {
	var that = this; // needed due to a couple of clousers
	
	this.options = {
		// defaults
	}
	// merge defaults and passed in options; later
	
	this.data = data;
	this.options = options;
	this.events = {};
	
	var VIEW_ANGLE = 45,
		ASPECT = this.options.width / this.options.height,
		NEAR = 0.1, // object close then NEAR wont be seen
		FAR = 1000; // object further then FAR wont be seen
	
	this.renderer = new THREE.WebGLRenderer();
	this.camera = new THREE.Camera(
		VIEW_ANGLE,
		ASPECT,
		NEAR,
		FAR
		);
	
	this.scene = new THREE.Scene();
	
	// maybe camera should stay at 0, 0, 0 and object go away? or not - we won't need z coordinate anyway?
	this.camera.position.z = 500;

	this.renderer.setSize(this.options.width, this.options.height);
	
	
	// var ifr = $("iframe");
	// var ifr = $("<iframe ></iframe>");
	// this.options.canvas.replaceWith(ifr);
	// console.log(ifr.contents().find("body"));
	// ifr.load(function(){
	// 	ifr.contents().find("head").append("<style>body {margin:0; padding:0;}</style>")
	// 	ifr.contents().find("body").append("<strong>olalala</strong>");
	// 	// that.options.canvas
	// 	console.log(ifr.contents());
	// 	console.log(ifr.contentWindow.document);
	// 	// ifr.contents().scroll(function(ev){
	// 	// 			// if (that.events.mouseover)
	// 	// 			console.log("skrul");
	// 	// 		});
	// });
		
	this.options.canvas.append(this.renderer.domElement);
	this.events.mouse = {}; 	
	$(this.renderer.domElement).mousedown(function(ev){
		that.events.mouse.down = true;
		that.events.mouse.x = ev.pageX;
		that.events.mouse.y = ev.pageY;
	});
	$(this.renderer.domElement).bind("mouseup mouseleave", function(ev){
		that.events.mouse.down = false;
	});
	
	this.events.mouse_position = new THREE.Vector2();
	$(this.renderer.domElement).mousemove(function(ev){
		if (that.events.mouse.down){			
			var difX = (-1)*(ev.pageX - that.events.mouse.x);
			var difY = (ev.pageY - that.events.mouse.y);
			
			// console.log(difX, difY);
			that.camera.translateX(difX);
			that.camera.translateY(difY);
			that.renderer.render(that.scene, that.camera);
		}
		
		that.events.mouse.x = ev.pageX;
		that.events.mouse.y = ev.pageY;
		
		that.events.mouse_position.set(ev.pageX, ev.pageY);
		// console.log(that.events.mouse_position);
	});
	
	// use jquery smart events?
	// $(this.renderer.domElement).bind({
	// 		mousewheel: function(e) {
	// 			// All other browser
	// 			that.camera.position.z = that.camera.position.z + e.wheelDelta;
	// 			that.renderer.render(that.scene, that.camera);
	// 		},
	// 		DOMMouseScroll: function(e) {
	// 			// Firefox event
	// 			console.log(e, e.detail, e.HORIZONTAL_AXIS, e.VERTICAL_AXIS);
	// 			//var dir = e.detail;
	// 			//if
	// 			
	// 			that.camera.position.z = that.camera.position.z + e.detail*2; 
	// 			that.renderer.render(that.scene, that.camera);
	// 		}
	// 	});
	
	this.options.r0 = new THREE.Vector2(
		$(this.renderer.domElement).offset().left+this.options.width/2,
		$(this.renderer.domElement).offset().top+this.options.height/2);

	$(this.renderer.domElement).bind("mousewheel DOMMouseScroll",
		function(ev){						
			var difZ;
			
			if (ev.DOMMouseScroll) difZ = ev.detail;
			else difZ = ev.wheelDelta;
			
			// console.log(that.events.mouse_position.x, that.events.mouse_position.y);
			var r = new THREE.Vector2();
			r.sub(that.events.mouse_position, that.options.r0);
			
			// Move to mouse cursor - still needs some work			
			that.camera.translateX((difZ / that.camera.position.z)*r.x);
			that.camera.translateY(-(difZ / that.camera.position.z)*r.y);
			
			that.camera.position.z = that.camera.position.z - difZ;
			
			that.renderer.render(that.scene, that.camera);
	});
	
	this.pointLight = new THREE.PointLight(0xFFFFFF);
	this.pointLight.position.x = 10;
	this.pointLight.position.y = 20;
	this.pointLight.position.z = 130;
	
	this.scene.addLight(this.pointLight);
	
	for (var i=0; i<this.data.length; i++ ) {
		this.node(5, this.data[i][0], this.data[i][1]);
	}
}

GraphGL.prototype.node = function(radius, x, y) {
	// EXTREMELY __NOT__ OPTIMIZED
	// step one - circle
	// step two - square with gpu rendering
	var segmants = 16, rings = 16;
	
	var sphereMaterial = new THREE.MeshLambertMaterial({
		color: 0xCC0000
	});
	
	var sphere = new THREE.Mesh (
		new THREE.Sphere(radius, segmants, rings), sphereMaterial);
	
	sphere.position.x = x;
	sphere.position.y = y;
	
	this.scene.addChild(sphere);
}
GraphGL.prototype.init = function() {
	console.log("init");
	this.renderer.render(this.scene, this.camera);
}