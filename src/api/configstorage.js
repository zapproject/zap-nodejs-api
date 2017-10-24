const fs = require('fs');
const isBrowser = (typeof window != 'undefined');

class ConfigStorage {
	static save(location, data) {
		if ( !this.isBrowser ) {
			fs.writeFileSync(location, data);
		}
		else {
			if ( !window.localStorage ) {
				console.error("Failed to store data, localStorage not found");
			}
			else {
				window.localStorage.setItem(location, data);
			}
		}
	}

	static load(location) {
		if ( !this.isBrowser ) {
			return fs.readFileSync(location);
		}
		else {
			if ( !window.localStorage ) {
				console.error("Failed to store data, localStorage not found");	
			}
			else {
				return window.localStorage.getItem(location);
			}
		}
	}

	static exists(location) {
		if ( !this.isBrowser ) {
			return fs.existsSync(location);
		}
		else {
			if ( !window.localStorage ) {
				console.error("Failed to store data, localStorage not found");	
			}
			else {
				return (window.localStorage.getItem(location) == null);
			}
		}
	}
}

module.exports = ConfigStorage;