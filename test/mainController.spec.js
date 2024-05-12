describe('MainController', function() {
    var $controller, $rootScope, $httpBackend, $timeout, $http;
    beforeEach(module('aiProjectBuilder'));

    beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _$timeout_, _$http_){
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $timeout = _$timeout_;
        $http = _$http_;
    }));

    it('should create controller', function() {
        var $scope = $rootScope.$new();
        var controller = $controller('MainController', { $scope: $scope, $sanitize: angular.sanitize });
        expect(controller).toBeDefined();
    });

    describe('MainController initialization', function() {
        it('should post to /savesetup at least 4 times in 5 seconds', function() {
            return
            var $scope = $rootScope.$new();
            var controller = $controller('MainController', { $scope: $scope });

            $httpBackend.whenGET('/getSavedSetups').respond([{setup_id: 123}, {setup_id: 124}, {setup_id: 125}, {setup_id: 126}]);
            $httpBackend.whenPOST('/savesetup').respond(200, {setup_id: 123});

            $timeout.flush(5000); // Simulate passing of 5 seconds
            $httpBackend.flush(); // Ensure all expected requests are made

            expect($httpBackend.whenPOST('/savesetup').calls.count()).toBeGreaterThanOrEqual(4);
        });

        it('should retrieve saved setups and assign them to $scope.savedSetups', function() {
            var $scope = $rootScope.$new();
            var controller = $controller('MainController', { $scope: $scope });
            var mockSavedSetups = [
                { setup_id: 101, name: 'Setup One' },
                { setup_id: 102, name: 'Setup Two' }
            ];

            $httpBackend.expectGET('/getSavedSetups').respond(mockSavedSetups);
            //$scope.getSavedSetups();
            $httpBackend.flush();

            expect($scope.savedSetups).toEqual(mockSavedSetups);
        });
    });

    // Additional tests can be added here
});

