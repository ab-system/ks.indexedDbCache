
/*
* Кэшь который хранится в indexedDb.
* Из-за асинхронного api indexedDb, indexedDbCache нельзя использовать для работы с $http.
*
* */

angular
    .module('indexedDbCache', [])
    .factory('indexedDbCacheFactory', ['$log', '$q', function($log, $q) {

        function debug(message) {
            $log.debug('indexedDbCacheFactory >> ' + message)
        }

        var memoryStorage = {};
        var _objectStore = 'cache';

        function connectDB(cacheId) {
            debug('Try connect to db. DbName: ' + cacheId);
            var defered = $q.defer();
            var request = indexedDB.open(cacheId, 1);
            request.onerror = function(err){
                defered.reject(err);
            };
            request.onsuccess = function(){
                defered.resolve(request.result);
            };
            request.onupgradeneeded = function(e){
                debug("Create object store.");
                e.currentTarget.result.createObjectStore(_objectStore, { keyPath: "key" });
            };
            return defered.promise;
        }

        function getCache(cacheId) {
            if(!memoryStorage[cacheId]) {
                memoryStorage[cacheId] = new cacheCtor(cacheId);
            }
            return memoryStorage[cacheId];
        }

        function cacheCtor(cacheId) {

            function getRequest(method, args, mode){
                var defered = $q.defer();
                connectDB(cacheId)
                    .then(function(db){
                        var transaction = db.transaction([_objectStore], mode ? mode : "readonly");
                        var store = transaction.objectStore(_objectStore);
                        //проверка для IE
                        var request = args ? store[method](args) : store[method]();
                        defered.resolve({ request: request, transaction: transaction, store: store });
                    })
                    .catch(defered.reject);
                return defered.promise;
            }

            function exec(method, args, mode){
                var defered = $q.defer();
                getRequest(method, args, mode)
                    .then(function(response){
                        var request = response.request;
                        request.onerror = defered.reject;
                        request.onsuccess = function(){
                            if(!request.result){
                                defered.resolve();
                            }
                            else if(!request.result.value){
                                defered.resolve(request.result);
                            }
                            else {
                                defered.resolve(request.result.value);
                            }
                        }
                    })
                    .catch(defered.reject);
                return defered.promise;
            }

            var me = this;

            me.put = function(key, value){
                return exec('put', { key: key, value: value }, 'readwrite')
                    .then(function(){
                        return value;
                    })
            }

            me.get = function(key){
                debug('Get item from cache. Key: ' + key + ' CacheId: ' + cacheId);
                return exec('get', key)
            };

            me.remove = function(key){
                return exec('delete', key, 'readwrite')
            }

            me.info = function() {
                return exec('count')
                    .then(function(responce){
                        return { size: responce ? responce : 0, id: cacheId };
                    });
            }


            me.getKeys = function() {
                var defered = $q.defer();
                getRequest('openCursor')
                    .then(function (response) {
                        var items = [];
                        var cursorRequest = response.request;
                        response.transaction.oncomplete = function(evt) {
                            defered.resolve(items);
                        };
                        cursorRequest.onerror = defered.reject;

                        cursorRequest.onsuccess = function(evt) {
                            var cursor = evt.target.result;
                            if (cursor) {
                                items.push(cursor.key);
                                cursor.continue();
                            }
                        };
                    })
                    .catch(defered.reject);

                return defered.promise;
            }


            me.getFirst = function() {
                var defered = $q.defer();
                getRequest('openCursor')
                    .then(function (response) {
                        var items = [];
                        var cursorRequest = response.request;
                        response.transaction.oncomplete = function(evt) {
                            defered.resolve(items);
                        };

                        cursorRequest.onerror = defered.reject;

                        cursorRequest.onsuccess = function(evt) {
                            var cursor = evt.target.result;
                            if (cursor) {
                                defered.resolve(cursor.value);
                            }
                        };
                    })
                    .catch(defered.reject);

                return defered.promise;
            }

            me.getAll = function() {
                var defered = $q.defer();
                getRequest('openCursor')
                    .then(function (response) {
                        var items = [];
                        var cursorRequest = response.request;
                        response.transaction.oncomplete = function(evt) {
                            defered.resolve(items);
                        };
                        cursorRequest.onerror = defered.reject;

                        cursorRequest.onsuccess = function(evt) {
                            var cursor = evt.target.result;
                            if (cursor) {
                                items.push(cursor.value);
                                cursor.continue();
                            }
                        };
                    })
                    .catch(defered.reject);

                return defered.promise;
            }

            me.removeAll = function(){
                return exec('clear', null, 'readwrite');
            }

            return me;
        }

        return function(cacheId) {
            if(!cacheId){
                cacheId = 'defaultCache';
            }
            return getCache(cacheId);
        };
}]);