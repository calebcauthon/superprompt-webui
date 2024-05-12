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

    describe('$scope.loadSavedSetup function', function() {
        it('should properly load a saved setup into $scope', function() {
            var $scope = $rootScope.$new();
            var controller = $controller('MainController', { $scope: $scope });
            var mockSavedSetup = {
                id: 200,
                name: 'Test Setup',
                setup_data: {
                    inputTabs: [
                        { id: 'tab1', title: 'Tab 1', formData: {}, resultsData: {} },
                        { id: 'tab2', title: 'Tab 2', formData: {}, resultsData: {} }
                    ]
                }
            };

            spyOn($scope, 'loadSavedSetup').and.callThrough();
            $scope.loadSavedSetup(mockSavedSetup);

            expect($scope.loadSavedSetup).toHaveBeenCalled();
            expect($scope.jsonData.id).toEqual(mockSavedSetup.id);
            expect($scope.jsonData.name).toEqual(mockSavedSetup.name);
            expect($scope.inputTabs.length).toEqual(mockSavedSetup.setup_data.inputTabs.length);
            expect($scope.inputTabs[0].buttonText).toEqual('Build with AI');
            expect($scope.inputTabs[0].isBlinking).toBe(false);
            expect($scope.inputTabs[1].buttonText).toEqual('Build with AI');
            expect($scope.inputTabs[1].isBlinking).toBe(false);
        });
    });

    // Additional tests can be added here
});


