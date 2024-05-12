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
        id: 'single',
        resultsData: null
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

    on('ArrowRight', tabRight, { $window, $scope });
    on('ArrowLeft', tabLeft, { $window, $scope });
    on('n', newTab, { $window, $scope });

    $scope.addInputTab = function() {
        var newTabId = 'tab' + ($scope.inputTabs.length + 1);
        const tab = { ...tabInfoTemplate, id: newTabId, title: 'Input ' + ($scope.inputTabs.length + 1) }; 
        tab.formData = {};
        $scope.inputTabs.push(tab);
        $scope.activateTab(newTabId);
    };

    $scope.activateTab = function(tabId) {
        $scope.activeTab = tabId;
    };

    $scope.submitForm = function(tab) {
        tab.buttonText = 'Generating ⏳';
        tab.isBlinking = true;
        let otherOutputs = $scope.inputTabs.map(t => ({ title: t.title, resultsData: t.resultsData }));
        $http.post('/build', {
            description_input: tab.formData.aiInput,
            must_haves_input: tab.formData.mustHaves,
            supporting_text_input: tab.formData.supportingText,
            other_outputs: otherOutputs,
            user_id: 1 // Assuming a static user ID for demonstration
        })
            .then(function(response) {
                console.log('Success:', response);
                var countdown = 3;
                tab.buttonText = 'Redirecting to results in ' + countdown + '...';
                tab.isBlinking = false; 
                var interval = $interval(function() {
                    countdown--;
                    tab.buttonText = 'Displaying results in ' + countdown + '...';
                    if (countdown === 1) {
                        $scope.fadeClass = 'fade';
                    }
                    if (countdown === 0) {
                        $interval.cancel(interval);
                        $http.get(`/output/${response.data.uuid}`)
                            .then(function(outputResponse) {
                                tab.resultsData = outputResponse.data;
                                tab.buttonText = 'Build with AI';
                                tab.isBlinking = false;
                                $scope.fadeClass = '';
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


function on(key, action, context) {
    context.$window.addEventListener('keydown', function(event) {
        if (event.key === key) {
            context.$scope.$apply(action(context.$scope));
        }
    });
}

function tabRight($scope) {
    var currentIndex = $scope.inputTabs.findIndex(tab => tab.id === $scope.activeTab);
    if (currentIndex < $scope.inputTabs.length - 1) {
        $scope.activateTab($scope.inputTabs[currentIndex + 1].id);
    }
}

function tabLeft($scope) {
    var currentIndex = $scope.inputTabs.findIndex(tab => tab.id === $scope.activeTab);
    if (currentIndex > 0) {
        $scope.activateTab($scope.inputTabs[currentIndex - 1].id);
    }
}

function newTab($scope) {
    $scope.addInputTab();
}

