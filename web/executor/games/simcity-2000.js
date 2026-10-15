
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
      var PACKAGE_NAME = 'simcity-2000.data';
      var REMOTE_PACKAGE_BASE = 'simcity-2000.data';
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
Module['FS_createPath']("/games", "simcity-2000", true, true);
Module['FS_createPath']("/games/simcity-2000", "SimCity 2000", true, true);
Module['FS_createPath']("/games/simcity-2000/SimCity 2000", "Cities", true, true);

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
          Module['removeRunDependency']('datafile_simcity-2000.data');
      }
      Module['addRunDependency']('datafile_simcity-2000.data');

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
    loadPackage({"files": [{"filename": "/games/simcity-2000/SimCity 2000/%SimCity 2000\u2122 1.1 Read Me", "start": 0, "end": 82}, {"filename": "/games/simcity-2000/SimCity 2000/%SimCity2000\u2122 1.1", "start": 82, "end": 2789262}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Charleston", "start": 2789262, "end": 2796863}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Dullsville", "start": 2796863, "end": 2803176}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Flint", "start": 2803176, "end": 2809973}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Happyland", "start": 2809973, "end": 2810055}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Hollywood", "start": 2810055, "end": 2816506}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Lakeland", "start": 2816506, "end": 2816588}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Maxis Land", "start": 2816588, "end": 2816670}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Oakland", "start": 2816670, "end": 2824432}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Seven Spires", "start": 2824432, "end": 2824514}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/%Volcano City", "start": 2824514, "end": 2824596}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Charleston", "start": 2824596, "end": 2910478}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Dullsville", "start": 2910478, "end": 2971880}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Flint", "start": 2971880, "end": 3089480}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Happyland", "start": 3089480, "end": 3160217}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Hollywood", "start": 3160217, "end": 3274323}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Lakeland", "start": 3274323, "end": 3350180}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Maxis Land", "start": 3350180, "end": 3404001}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Oakland", "start": 3404001, "end": 3510966}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Seven Spires", "start": 3510966, "end": 3589465}, {"filename": "/games/simcity-2000/SimCity 2000/Cities/Volcano City", "start": 3589465, "end": 3656862}, {"filename": "/games/simcity-2000/SimCity 2000/SimCity 2000\u2122 1.1 Read Me", "start": 3656862, "end": 3669049}, {"filename": "/games/simcity-2000/SimCity 2000/SimCity2000\u2122 1.1", "start": 3669049, "end": 3669049}], "remote_package_size": 3669049});

  })();
