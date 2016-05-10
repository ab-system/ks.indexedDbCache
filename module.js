/**
 * Created by eolt on 08.10.2015.
 */

    angular.module('components', ['indexedDbCache'])
        .config([function () {

        }])
        .run([ function() {

        }])
        .controller('mainCtrl', [ '$scope', 'indexedDbCacheFactory', '$log', '$q', function($scope, indexedDbCacheFactory, $log, $q) {

            var lsCache = indexedDbCacheFactory();

            $scope.deleteDb = function(){
                lsCache.deleteDatabase('starDb')
            }

            function refreshCacheInfo(){
                lsCache.info()
                    .then(function(info){
                        $scope.lsCacheInfo = info;
                    })
                    .catch($log.error);
            }

            refreshCacheInfo();

            $scope.addItems = function (count) {
                lsCache.info()
                    .then(function(info){
                        var size = info.size;
                        var promises = new Array(count);
                        for (var i = 0; i < count; i++) {
                            var key = size + i;
                            promises[i] = lsCache.put(key, i);
                        }
                        $q.all(promises)
                            .then(refreshCacheInfo)
                            .catch($log.error);
                    })
                    .catch($log.error);
            }

            $scope.getItem = function (key) {
                lsCache.get(key)
                    .then(function(value){
                        if(value) {
                            $scope.itemInfo = {
                                key: key,
                                value: value
                            };
                        }
                        else {
                            $scope.itemInfo = null;
                        }
                    })
                    .catch($log.error);

            }

            $scope.getAll = function(){
                lsCache.getAll()
                    .then(function(items){
                        $scope.allItems = items;
                    })
                    .catch($log.error);
            }

            $scope.getFirst = function(){
                lsCache.getFirst()
                    .then(function(item){
                        $scope.first = item;
                    })
                    .catch($log.error);
            }

            $scope.getKeys = function(){
                lsCache.getKeys()
                    .then(function(keys){
                        $scope.keys = keys;
                    })
                    .catch($log.error);
            }

            $scope.removeAll = function(){
                lsCache.removeAll()
                    .then(function(){
                        $scope.getKeys();
                        $scope.getAll();
                    })
                    .catch($log.error);
            }

        }]);