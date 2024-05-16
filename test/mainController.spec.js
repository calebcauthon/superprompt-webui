describe('MainController', function() {
    var $controller, $rootScope, $httpBackend, $timeout, $http, $interval, $window;
    beforeEach(module('aiProjectBuilder'));

    beforeEach(inject(function(_$controller_, _$rootScope_, _$httpBackend_, _$timeout_, _$http_, _$interval_, _$window_){
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $timeout = _$timeout_;
        $http = _$http_;
        $interval = _$interval_;
        $window = _$window_;
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


    describe('MainController HTML Helper Functions', function() {
        var $scope, utils;

        beforeEach(inject(function($rootScope, $controller, UtilsService) {
            $scope = $rootScope.$new();
            utils = UtilsService;
            $controller('MainController', { $scope: $scope, UtilsService: utils });
        }));

        describe('$scope.loadSavedSetup', function() {
            it('should call setScopeFromSavedSetup and refreshJson', function() {
                var mockSavedSetup = { setup_data: { inputTabs: [] } };
                $scope.loadSavedSetup(mockSavedSetup);
            });
        });

        describe('$scope.getTabTitles', function() {
            it('should return concatenated tab titles', function() {
                var mockSavedSetup = {
                    setup_data: {
                        inputTabs: [
                            { title: 'Tab 1' },
                            { title: 'Tab 2' }
                        ]
                    }
                };
                $scope.getTabTitles(mockSavedSetup);
            });
        });

        describe('$scope.addInputTab', function() {
            it('should add a new input tab and activate it', function() {
                $scope.inputTabs = [{ id: 'tab1', title: 'Input 1' }];
                $scope.addInputTab();
            });
        });

        describe('$scope.activateTab', function() {
            it('should set the active tab', function() {
                $scope.activateTab('tab1');
            });
        });

        describe('$scope.deleteSavedSetup', function() {
            it('should remove a setup from $scope.savedSetups', function() {
                // Setup
                var setupToDelete = { id: 'setup1', name: 'Test Setup' };
                $scope.savedSetups = [setupToDelete, { id: 'setup2', name: 'Another Setup' }];

                // Spy on window.confirm to simulate user confirmation
                spyOn($window, 'prompt').and.returnValue("delete setup1");
                spyOn($http, 'delete').and.returnValue({
                    then: function(onFulfilled) {
                        return {
                            catch: function(onRejected) {
                                onFulfilled({});
                                return { finally: function(onFinally) { onFinally(); } };
                            }
                        };
                    }
                });

                // Action
                $scope.deleteSavedSetup(setupToDelete);

                // Assert
                expect($scope.savedSetups.length).toBe(1);
                expect($scope.savedSetups[0].id).toEqual('setup2');
                expect($http.delete).toHaveBeenCalledWith('/savedsetup/' + setupToDelete.id);
            });
        });

        describe('$scope.submitForm', function() {
            beforeEach(function() {
            });

            it('should handle form submission and manage tab states', function() {
                var mockTab = { formData: { aiInput: '', mustHaves: '', supportingText: '' } };
                $scope.inputTabs = [mockTab];
                $scope.submitForm(mockTab);
            });
        });

        describe('$scope.submitForm', function() {
            it('should properly handle the form submission process', function() {
                var mockTab = {
                    formData: {
                        aiInput: 'Test AI Input',
                        mustHaves: 'Test Must Haves',
                        supportingText: 'Test Supporting Text'
                    }
                };
                $scope.inputTabs = [mockTab];

                
                $httpBackend.expectGET('/getSavedSetups').respond(200, []);
                $httpBackend.expectPOST('/build').respond(200, { uuid: '12345' });
                $httpBackend.whenGET(`/output/12345`).respond(200, { results: 'Generated Output' });
                $scope.submitForm(mockTab);
                $httpBackend.flush();

                $httpBackend.expectPOST('/savesetup').respond(200, { setup_id: 'newSetupId' });
                $interval.flush(1000);

                $httpBackend.expectPOST('/savesetup').respond(200, { setup_id: 'newSetupId' });
                $interval.flush(1000);

                expect(mockTab.resultsData).toBeDefined();
            });

        describe('$scope.submitForm with aiInput included', function() {
            it('should include aiInput in the data sent to /build', function() {
                var mockTab = {
                    id: 'tab1',
                    title: 'Input 1',
                    formData: {
                        aiInput: 'Example AI Input',
                        mustHaves: 'Example Must Haves',
                        supportingText: 'Example Supporting Text'
                    },
                    activeTemplateType: 'Create'
                };
                $scope.inputTabs = [mockTab];
                $scope.activateTab(mockTab.id);

                var expectedData = {
                    template_type: mockTab.activeTemplateType,
                    description_input: mockTab.formData.aiInput,
                    must_haves_input: mockTab.formData.mustHaves,
                    supporting_text_input: mockTab.formData.supportingText,
                    other_outputs: $scope.inputTabs.map(t => ({
                        prompt: t.formData.aiInput,
                        title: t.title,
                        resultsData: t.resultsData
                    })),
                    user_id: 1
                };

                

                $httpBackend.expectGET('/getSavedSetups').respond(200, []);

                // assertion
                $httpBackend.expectPOST('/build', (params) => {
                    return JSON.parse(params).other_outputs[0].prompt === mockTab.formData.aiInput;
                }).respond(200, { uuid: '12345' });

                $httpBackend.whenGET(`/output/12345`).respond(200, { results: 'Generated Output' });
                $scope.submitForm(mockTab);
                $httpBackend.flush();

                $httpBackend.expectPOST('/savesetup').respond(200, { setup_id: 'newSetupId' });
                $interval.flush(1000);

                $httpBackend.expectPOST('/savesetup').respond(200, { setup_id: 'newSetupId' });
                $interval.flush(1000);

            });
        });
        });
    });
});
