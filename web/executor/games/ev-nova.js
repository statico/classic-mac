
  var Module = typeof Module != 'undefined' ? Module : {};

  if (!Module['expectedDataFileDownloads']) Module['expectedDataFileDownloads'] = 0;
  Module['expectedDataFileDownloads']++;
  (() => {
    // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
    var isPthread = typeof ENVIRONMENT_IS_PTHREAD != 'undefined' && ENVIRONMENT_IS_PTHREAD;
    var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != 'undefined' && ENVIRONMENT_IS_WASM_WORKER;
    if (isPthread || isWasmWorker) return;
    var isNode = globalThis.process && globalThis.process.versions && globalThis.process.versions.node && globalThis.process.type != 'renderer';
    async function loadPackage(metadata) {

      var PACKAGE_PATH = '';
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/');
      } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
        // web worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/');
      }
      var PACKAGE_NAME = 'ev-nova.data';
      var REMOTE_PACKAGE_BASE = 'ev-nova.data';
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
      var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];

      async function fetchRemotePackage(packageName, packageSize) {
        if (isNode) {
          var contents = require('fs').readFileSync(packageName);
          return new Uint8Array(contents).buffer;
        }
        if (!Module['dataFileDownloads']) Module['dataFileDownloads'] = {};
        try {
          var response = await fetch(packageName);
        } catch (e) {
          throw new Error(`Network Error: ${packageName}`, {e});
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.url}`);
        }

        const chunks = [];
        const headers = response.headers;
        const total = Number(headers.get('Content-Length') || packageSize);
        let loaded = 0;

        Module['setStatus'] && Module['setStatus']('Downloading data...');
        const reader = response.body.getReader();

        while (1) {
          var {done, value} = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          Module['dataFileDownloads'][packageName] = {loaded, total};

          let totalLoaded = 0;
          let totalSize = 0;

          for (const download of Object.values(Module['dataFileDownloads'])) {
            totalLoaded += download.loaded;
            totalSize += download.total;
          }

          Module['setStatus'] && Module['setStatus'](`Downloading data... (${totalLoaded}/${totalSize})`);
        }

        const packageData = new Uint8Array(chunks.map((c) => c.length).reduce((a, b) => a + b, 0));
        let offset = 0;
        for (const chunk of chunks) {
          packageData.set(chunk, offset);
          offset += chunk.length;
        }
        return packageData.buffer;
      }

      var fetchPromise;
      var fetched = Module['getPreloadedPackage'] && Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);

      if (!fetched) {
        // Note that we don't use await here because we want to execute the
        // the rest of this function immediately.
        fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
      }

    async function runWithFS(Module) {

      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
Module['FS_createPath']("/", "games", true, true);
Module['FS_createPath']("/games", "ev-nova", true, true);
Module['FS_createPath']("/games/ev-nova", "EV Nova", true, true);
Module['FS_createPath']("/games/ev-nova/EV Nova", "Nova Files", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        // Reuse the bytearray from the XHR as the source for file reads.
          for (var file of metadata['files']) {
            var name = file['filename'];
            var data = byteArray.subarray(file['start'], file['end']);
            // canOwn this data in the filesystem, it is a slice into the heap that will never change
        Module['FS_createDataFile'](name, null, data, true, true, true);
          }
          Module['removeRunDependency']('datafile_ev-nova.data');
      }
      Module['addRunDependency']('datafile_ev-nova.data');

      if (!Module['preloadResults']) Module['preloadResults'] = {};

      Module['preloadResults'][PACKAGE_NAME] = {fromCache: false};
      if (!fetched) {
        fetched = await fetchPromise;
      }
      await processPackageData(fetched);

    }
    // Detect whether the module JS file has already been loaded.
    if (Module['FS_createPath']) {
      runWithFS(Module);
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module['preRun'].push(runWithFS); // FS is not initialized yet, wait for it
    }

    }
    loadPackage({"files": [{"filename": "/games/ev-nova/EV Nova/%EV Nova", "start": 0, "end": 1977563}, {"filename": "/games/ev-nova/EV Nova/EV Nova", "start": 1977563, "end": 4900179}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Data 1", "start": 4900179, "end": 7044032}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Data 2", "start": 7044032, "end": 7784735}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Data 3", "start": 7784735, "end": 8266194}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Data 4", "start": 8266194, "end": 8786704}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Data 5", "start": 8786704, "end": 9464893}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Data 6", "start": 9464893, "end": 10214928}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Graphics 1", "start": 10214928, "end": 22072458}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Graphics 2", "start": 22072458, "end": 30419113}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Graphics 3", "start": 30419113, "end": 37750417}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Music", "start": 37750417, "end": 37750499}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Ships 1", "start": 37750499, "end": 51762067}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Ships 2", "start": 51762067, "end": 63485649}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Ships 3", "start": 63485649, "end": 77412487}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Ships 4", "start": 77412487, "end": 91828671}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Ships 5", "start": 91828671, "end": 103264129}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Ships 6", "start": 103264129, "end": 114844959}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Ships 7", "start": 114844959, "end": 119578721}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Sounds", "start": 119578721, "end": 125008120}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Titles 1", "start": 125008120, "end": 137905328}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Titles 2", "start": 137905328, "end": 151686071}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Titles 3", "start": 151686071, "end": 165463779}, {"filename": "/games/ev-nova/EV Nova/Nova Files/%Nova Titles 4", "start": 165463779, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Data 1", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Data 2", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Data 3", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Data 4", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Data 5", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Data 6", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Graphics 1", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Graphics 2", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Graphics 3", "start": 172621346, "end": 172621346}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Music", "start": 172621346, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Ships 1", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Ships 2", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Ships 3", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Ships 4", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Ships 5", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Ships 6", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Ships 7", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Sounds", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Titles 1", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Titles 2", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Titles 3", "start": 180124133, "end": 180124133}, {"filename": "/games/ev-nova/EV Nova/Nova Files/Nova Titles 4", "start": 180124133, "end": 180124133}], "remote_package_size": 180124133});

  })();
