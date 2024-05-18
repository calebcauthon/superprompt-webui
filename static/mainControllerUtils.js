app.factory('api', function($http) {
    function saveSetup(jsonData) {
      return $http.post('/savesetup', {
          setup_data: jsonData
      })
    }

    function getOutput(response) {
      return $http.get(`/output/${response.data.uuid}`).then(outputResponse => {
          return outputResponse.data;
      });
    }

    function getSavedSetups() {
        return $http.get('/getSavedSetups').then(function(response) {
            return response.data;
        });
    }

    function postBuild(data) {
        return $http.post('/build', data);
    }

    return {
      getSavedSetups,
      postBuild,
      saveSetup,
      getOutput
    };
});


app.factory('UtilsService', function($interval, api) {
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

    function refreshJsonTabs(jsonData, inputTabs) {
        // Preserve the overarching ID if it exists
        const existingId = jsonData.id;

        return {
            id: existingId, // Reapply the existing overarching ID
            name: jsonData.name,
            inputTabs: inputTabs.map(tab => {
                return {
                    id: tab.id,
                    title: tab.title,
                    formData: tab.formData,
                    resultsData: tab.resultsData,
                    activeTemplateType: tab.activeTemplateType,
                    selectedLLM: tab.selectedLLM
                };
            })
        };
    }

    function setScopeFromSavedSetup($scope, savedSetup) {
        $scope.jsonData = {}
        $scope.jsonData.id = savedSetup.id;
        $scope.jsonData.name = savedSetup.name;
        $scope.inputTabs = savedSetup.setup_data.inputTabs;
        $scope.inputTabs.forEach(function(tab) {
            tab.buttonText = 'Build with AI';
            tab.isBlinking = false;
        });
    }

    const tabInfoTemplate = {
        buttonText: 'Build with AI',
        isBlinking: false,
        formData: {},
        title: 'Input',
        id: 'single',
        resultsData: null
    }


    function startBlinking(tab) {
        tab.buttonText = 'Generating ⏳';
        tab.isBlinking = true;
    }

    function stopBlinking(tab) {
        tab.isBlinking = false;
        tab.buttonText = 'Build with AI';
    }

    function setTabData(tab, response) {
        api.getOutput(response).then(output => tab.resultsData = output);
    }

    function startCountdown(tab, response, $scope) {
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
        api.getOutput(response).then(output => tab.resultsData = output);
    }


    function saveJsonDataToDB($scope) {
        api.saveSetup($scope.jsonData)
        .then(function(response) {
            const setup_id = response.data.setup_id;

            if (!$scope.jsonData.id) {
                api.getSavedSetups();
            };
            
            $scope.jsonData.id = setup_id;
        })
        .catch(function(error) {
            console.error('Error saving setup:', error);
        });
    }


    function refreshJson($scope) {
        $scope.jsonData = refreshJsonTabs($scope.jsonData, $scope.inputTabs);

        if ($scope.inputTabs.length === 1 && $scope.inputTabs[0].title === "Input") {
            const formData = $scope.inputTabs[0].formData;
            if (!formData.aiInput && !formData.mustHaves && !formData.supportingText) {
                console.log("Skipping save due to empty input fields in the only tab.");
                return;
            }
        }

        saveJsonDataToDB($scope);
    }

    return {
        refreshJsonTabs,
        setScopeFromSavedSetup,
        tabInfoTemplate,
        startBlinking,
        stopBlinking,
        setTabData,
        startCountdown,
        retrieveOutput,
        saveJsonDataToDB,
        refreshJson,
        tabRight,
        tabLeft,
        newTab
    };
});

