
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
      var PACKAGE_NAME = 'glider-pro.data';
      var REMOTE_PACKAGE_BASE = 'glider-pro.data';
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
Module['FS_createPath']("/games", "glider-pro", true, true);
Module['FS_createPath']("/games/glider-pro", "Glider PRO", true, true);
Module['FS_createPath']("/games/glider-pro/Glider PRO", "Houses", true, true);

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
          Module['removeRunDependency']('datafile_glider-pro.data');
      }
      Module['addRunDependency']('datafile_glider-pro.data');

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
    loadPackage({"files": [{"filename": "/games/glider-pro/Glider PRO/%Glider PRO\u2122", "start": 0, "end": 3448092}, {"filename": "/games/glider-pro/Glider PRO/Glider PRO\u2122", "start": 3448092, "end": 3832696}, {"filename": "/games/glider-pro/Glider PRO/Houses/%Castle o' the Air", "start": 3832696, "end": 4139142}, {"filename": "/games/glider-pro/Glider PRO/Houses/%Castle o' the Air.mov", "start": 4139142, "end": 4140246}, {"filename": "/games/glider-pro/Glider PRO/Houses/%Demo House", "start": 4140246, "end": 4632085}, {"filename": "/games/glider-pro/Glider PRO/Houses/%Demo House.mov", "start": 4632085, "end": 4633474}, {"filename": "/games/glider-pro/Glider PRO/Houses/%Slumberland", "start": 4633474, "end": 5674668}, {"filename": "/games/glider-pro/Glider PRO/Houses/%Slumberland.mov", "start": 5674668, "end": 5675792}, {"filename": "/games/glider-pro/Glider PRO/Houses/Castle o' the Air", "start": 5675792, "end": 5706238}, {"filename": "/games/glider-pro/Glider PRO/Houses/Castle o' the Air.mov", "start": 5706238, "end": 5728198}, {"filename": "/games/glider-pro/Glider PRO/Houses/Demo House", "start": 5728198, "end": 5744724}, {"filename": "/games/glider-pro/Glider PRO/Houses/Demo House.mov", "start": 5744724, "end": 5864513}, {"filename": "/games/glider-pro/Glider PRO/Houses/Slumberland", "start": 5864513, "end": 5998663}, {"filename": "/games/glider-pro/Glider PRO/Houses/Slumberland.mov", "start": 5998663, "end": 6036303}], "remote_package_size": 6036303});

  })();
