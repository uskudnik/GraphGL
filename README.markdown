GraphGL
=======

A network visualization library
-------------------------------


GraphGL is a network visualization library designed for rendering (_massive_) graphs in web browsers and puts dynamic graph exploration on the web another step forward.

In short - it either calculates the layout of the graph in real time or reads node positions. It is therefore suitable for static files (exported GraphML/GEXF files converted to JSON) and for dynamic files.

### Usage ###


#### To retrieve the project and required libraries #####

1. `git clone git@github.com:uskudnik/GraphGL.git`
2. In project directory: `git submodule update --init` 
3. Wait for download of `three.js`

After you have retrieved the library, you can start playing with it.

##### At the moment static graphs are only available from `particlesystem` branch.

Some notes:

Library expects JSON data for input in the form of

    {"nodes": {
            "nodeid": nodedata, 
            "nodeid": nodedata, ...
        },
     "edges": [
            {"source": "sourceid", "target": "targetid"},
            {"source": "sourceid", "target": "targetid"}, ...
        ]
    }

In the case of static graph (that is, graph that does not need to layout calculated), `nodedata` must include size, coordinates and color of a node.

An example from demos:

    {"label": "java.awt.MenuBar",
     "size": 3.57,
     "x": 339.43,
     "y": 246.62,
     "r": 175,
     "g": 182,
     "b": 75
    }

As for dynamic dataset, you can provide whatever you like for `nodedata`. Again, example from demos:

    {"nodes": {
        "344": "java.awt.MenuBar",
        "345": "java.awt.peer.FramePeer", ... },
     "edges": [...]
    }

As for initialization:

    var canvasId = "#canvas";
    var width = 800, height = 600;
    var dataurl = "java-dataset-color-static.json"
	
    var options = {
    	canvas: {
    		canvasId: canvasId,
    		backgroundColor: 0xffffff
    	},
    	nodes: {
    		color: 0x4193F8
    	},
    	width: width,
    	height: height,
    	layoutType: GraphGL.StaticLayout
    };


    var graphgl = new GraphGL(options);

    function animate() {
    	requestAnimFrame(animate);
    	graphgl.render();
    	stats.update();
    }

    graphgl.animate = animate;
    
    graphgl.start(dataurl);
    
    var container = document.getElementById( 'canvas' );
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );
    
Questions & bugs? Issues ;)