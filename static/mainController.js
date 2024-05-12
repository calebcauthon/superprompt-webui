const app = angular.module('aiProjectBuilder', ['ngSanitize'])
app.filter('pluralize', function() {
    return function(number, singular, plural) {
        return number === 1 ? singular : plural;
    };
});

app.factory('UtilsService', function($http) {
    function getSavedSetups() {
        return $http.get('/getSavedSetups').then(function(response) {
            return response.data;
        });
    }

    return {
        getSavedSetups
    };
});

app.controller('MainController', function($scope, $http, $timeout, $window, $interval, $sce, UtilsService) {
    const utils = UtilsService;

    $scope.isBlinking = false;
    $scope.activeTab = 'single';
    $scope.resultsData = '';
    $scope.fadeClass = '';

    $scope.jsonData = { 'test': 'test' };
    $interval(function() {
        refreshJsonTabs();
    }, 1000);

    utils.getSavedSetups().then(setups => $scope.savedSetups = setups);

    $scope.loadSavedSetup = function(savedSetup) {
        console.log('loading setup:', savedSetup);
        $scope.jsonData = {}
        $scope.jsonData.id = savedSetup.id;
        $scope.jsonData.name = savedSetup.name;
        $scope.inputTabs = savedSetup.setup_data.inputTabs;
        $scope.inputTabs.forEach(function(tab) {
            tab.buttonText = 'Build with AI';
            tab.isBlinking = false;
        });
        refreshJsonTabs();
        console.log('after a full load, json data:', {
            'jsonData': $scope.jsonData,
            'inputTabs': $scope.inputTabs
        });
    };

    function refreshJsonTabs() {
        // Preserve the overarching ID if it exists
        const existingId = $scope.jsonData.id;

        $scope.jsonData = {
            id: existingId, // Reapply the existing overarching ID
            name: $scope.jsonData.name,
            inputTabs: $scope.inputTabs.map(tab => {
                return {
                    id: tab.id,
                    title: tab.title,
                    formData: tab.formData,
                    resultsData: tab.resultsData
                };
            })
        };
        if ($scope.inputTabs.length === 1 && $scope.inputTabs[0].title === "Input") {
            const formData = $scope.inputTabs[0].formData;
            if (!formData.aiInput && !formData.mustHaves && !formData.supportingText) {
                console.log("Skipping save due to empty input fields in the only tab.");
                return;
            }
        }

        saveJsonDataToDB();
    }

    function saveJsonDataToDB() {
        $http.post('/savesetup', {
            setup_data: $scope.jsonData
        })
        .then(function(response) {
            const setup_id = response.data.setup_id;

            if (!$scope.jsonData.id) {
                getSavedSetups();
            };
            
            $scope.jsonData.id = setup_id;
        })
        .catch(function(error) {
            console.error('Error saving setup:', error);
        });
    }

    $scope.saveJsonDataToDB = saveJsonDataToDB;

    $scope.getTabTitles = function(savedSetup) {
        return savedSetup.setup_data.inputTabs.map(tab => tab.title).join(', ');
    };

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

//    on('ArrowRight', tabRight, { $window, $scope });
//    on('ArrowLeft', tabLeft, { $window, $scope });
//    on('n', newTab, { $window, $scope });

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
        startBlinking(tab);
        const data = {
            description_input: tab.formData.aiInput,
            must_haves_input: tab.formData.mustHaves,
            supporting_text_input: tab.formData.supportingText,
            other_outputs: $scope.inputTabs.map(t => ({ title: t.title, resultsData: t.resultsData })),
            user_id: 1 // Assuming a static user ID for demonstration
        };
        postBuild(data).then(response => {
            setTabData(tab, response);
            stopBlinking(tab);
            startCountdown(tab, response);
            retrieveOutput(tab, response);
        }).catch(error => {
            console.error('Error:', error);
            stopBlinking(tab);
        });
    };

    function startBlinking(tab) {
        tab.buttonText = 'Generating ⏳';
        tab.isBlinking = true;
    }

    function stopBlinking(tab) {
        tab.isBlinking = false;
        tab.buttonText = 'Build with AI';
    }

    function postBuild(data) {
        return $http.post('/build', data);
    }

    function setTabData(tab, response) {
        console.log('Success:', response);
        $http.get(`/output/${response.data.uuid}`).then(outputResponse => {
            tab.resultsData = outputResponse.data;
        });
    }

    function startCountdown(tab, response) {
        var countdown = 3;
        tab.buttonText = 'Redirecting to results in ' + countdown + '...';
        var interval = $interval(function() {
            countdown--;
            tab.buttonText = 'Displaying results in ' + countdown + '...';
            if (countdown === 1) {
                $scope.fadeClass = 'fade';
            }
            if (countdown === 0) {
                $interval.cancel(interval);
                $scope.fadeClass = '';
                tab.buttonText = 'Build with AI';
                tab.isBlinking = false;
            }
        }, 1000);
    }

    function retrieveOutput(tab, response) {
        $http.get(`/output/${response.data.uuid}`).then(outputResponse => {
            tab.resultsData = outputResponse.data;
        });
    }
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

