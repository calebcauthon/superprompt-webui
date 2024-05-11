angular.module('aiProjectBuilder', ['ngSanitize'])
.controller('MainController', function($scope, $http, $timeout, $window, $interval, $sce) {
    $scope.formData = {};
    $scope.buttonText = 'Build with AI';
    $scope.isBlinking = false;
    $scope.activeTab = 'single';
    $scope.resultsData = '';
    $scope.fadeClass = '';

    $scope.formData.aiInput = "A short story about space exploration";
    $scope.formData.mustHaves = "Include a talking robot and a twist ending";
    $scope.formData.supportingText = "Background information or context related to the request";

    const tabInfoTemplate = {
        buttonText: 'Build with AI',
        isBlinking: false,
        formData: {},
        title: 'Input',
        id: 'single'
    };

    $scope.inputTabs = [
        { ...tabInfoTemplate, id: 'single', title: 'Input', formData: {} }
    ];

    $window.addEventListener('keydown', function(event) {
        if (event.altKey && event.key === 'n') {
            $scope.$apply(function() {
                $scope.addInputTab();
            });
        }
    });
    $window.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowRight') {
            $scope.$apply(function() {
                var currentIndex = $scope.inputTabs.findIndex(tab => tab.id === $scope.activeTab);
                if (currentIndex < $scope.inputTabs.length - 1) {
                    $scope.activateTab($scope.inputTabs[currentIndex + 1].id);
                }
            });
        } else if (event.key === 'ArrowLeft') {
            $scope.$apply(function() {
                var currentIndex = $scope.inputTabs.findIndex(tab => tab.id === $scope.activeTab);
                if (currentIndex > 0) {
                    $scope.activateTab($scope.inputTabs[currentIndex - 1].id);
                }
            });
        }
    });
    $scope.addInputTab = function() {
        var newTabId = 'tab' + ($scope.inputTabs.length + 1);
        $scope.inputTabs.push({ ...tabInfoTemplate, id: newTabId, title: 'Input ' + ($scope.inputTabs.length + 1) });
        $scope.activateTab(newTabId);
    };

    $scope.activateTab = function(tabId) {
        $scope.activeTab = tabId;
    };

    $scope.submitForm = function(tab) {
        tab.buttonText = 'Generating ⏳';
        tab.isBlinking = true;
        $http.post('/build', {
            description_input: tab.formData.aiInput,
            must_haves_input: tab.formData.mustHaves,
            supporting_text_input: tab.formData.supportingText,
            user_id: 1 // Assuming a static user ID for demonstration
        })
            .then(function(response) {
                console.log('Success:', response);
                var countdown = 3;
                tab.buttonText = 'Redirecting to results in ' + countdown + '...';
                tab.isBlinking = false; 
                var interval = $interval(function() {
                    countdown--;
                    tab.buttonText = 'Redirecting to results in ' + countdown + '...';
                    if (countdown === 1) {
                        $scope.fadeClass = 'fade';
                    }
                    if (countdown === 0) {
                        $interval.cancel(interval);
                        $scope.activeTab = 'multiple';
                        $scope.fadeClass = '';
                        $http.get(`/output/${response.data.uuid}`)
                            .then(function(outputResponse) {
                                $scope.resultsData = outputResponse.data;
                                tab.buttonText = 'Build with AI';
                                tab.isBlinking = false;
                            });
                    }
                }, 1000);
            }, function(error) {
                console.error('Error:', error);
                tab.isBlinking = false;
                tab.buttonText = 'Build with AI';
            });
    };
});
