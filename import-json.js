onmessage = function(msg) {
	var dataurl = msg.data;
	
	// var a = new Float32Array([1,2,3]);
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", dataurl, true);
	// xhr.send();
	xhr.onreadystatechange = function(res) {
		if (xhr.readyState == 4) {
			// if(xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				postMessage(data);
			// } else {
				// postMessage("status issue:"+xhr.status)
			// }
		// } else {
			// postMessage("readystate issue: "+xhr.readyState)
		// }
		}
	}
	xhr.send();
	// postMessage("waaaaaaa");
}