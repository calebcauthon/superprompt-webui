app.controller('MainController', function($scope, $http, $timeout, $window, $interval, $sce, UtilsService, api) {
    const utils = UtilsService;

    $scope.isBlinking = false;
    $scope.activeTab = 'single';
    $scope.resultsData = '';
    $scope.fadeClass = '';
    $scope.jsonData = {};

    $interval(() => utils.refreshJson($scope), 1000);

    api.getSavedSetups().then(setups => $scope.savedSetups = setups);

    $scope.llms = [
        { model: 'claude-3-opus-20240229', display: 'Claude Opus' },
        { model: 'claude-3-sonnet-20240229', display: 'Claude Sonnet' },
        { model: 'claude-3-haiku-20240307', display: 'Claude Haiku' },
        { model: 'gpt-3.5-turbo-0125', display: 'GPT-3.5' },
        { model: 'gpt-3.5-turbo-16k-0613', display: 'GPT-3.5-16k' },
        { model: 'gpt-4o', display: 'GPT-4o' },
        { model: 'gpt-4', display: 'GPT-4' },
        { model: 'gpt-4-turbo', display: 'GPT-4-Turbo' }
    ];

    $scope.inputTabs = [
        { ...utils.tabInfoTemplate, id: 'single', title: 'Input', formData: {}, selectedLLM: $scope.llms[5] }
    ];

    $scope.templateTypes = ['Create', 'Extract', 'Document'];


    $scope.selectedLLM = 'GPT-3';
    // HTML Helpers
    $scope.importJsonData = function() {
        const jsonDataInput = $window.prompt("Please paste the JSON data here:");
        try {
            const jsonData = JSON.parse(jsonDataInput);
            $scope.jsonData = jsonData;
            $scope.inputTabs = jsonData.inputTabs; // Load the JSON data directly into the tabs
            console.log('JSON data loaded into tabs successfully');
        } catch (error) {
            console.error('Invalid JSON data', error);
            alert('Failed to parse JSON. Please ensure it is correctly formatted.');
        }
    };

    $scope.selectTemplateType = function(tab, thing) {
        tab.activeTemplateType = thing;
        console.log(tab.activeTemplateType);
    };

    $scope.loadSavedSetup = function(savedSetup) {
        utils.setScopeFromSavedSetup($scope, savedSetup);
        utils.refreshJson($scope);
    };

    $scope.deleteSavedSetup = function(savedSetup) {
        const confirmationInput = $window.prompt(`Please type 'delete ${savedSetup.id}' to confirm deletion:`);
        console.log('confirmationInput', confirmationInput);
        if (confirmationInput === `delete ${savedSetup.id}`) {
            const index = $scope.savedSetups.indexOf(savedSetup);
            if (index > -1) {
                $scope.savedSetups.splice(index, 1);

                // Perform a DELETE request to the server
                $http.delete('/savedsetup/' + savedSetup.id)
                    .then(() => {
                        console.log('Setup deleted successfully');
                    })
                    .catch(error => {
                        console.error('Error deleting setup:', error);
                    });
            }
        } else {
            alert('Deletion cancelled or incorrect confirmation.');
        }
    };

    $scope.getTabTitles = function(savedSetup) {
        return savedSetup.setup_data.inputTabs.map(tab => tab.title).join(', ');
    };

    $scope.addInputTab = function() {
        var newTabId = 'tab' + ($scope.inputTabs.length + 1);
        const tab = { ...utils.tabInfoTemplate, id: newTabId, title: 'Input ' + ($scope.inputTabs.length + 1) }; 
        tab.formData = {};
        $scope.inputTabs.push(tab);
        $scope.activateTab(newTabId);
    };

    $scope.activateTab = function(tabId) {
        $scope.activeTab = tabId;
    };

    $scope.submitForm = function(tab) {
        utils.startBlinking(tab);
        const data = {
            selected_llm: tab.selectedLLM.model,
            template_type: tab.activeTemplateType,
            description_input: tab.formData.aiInput,
            must_haves_input: tab.formData.mustHaves,
            supporting_text_input: tab.formData.supportingText,
            other_outputs: $scope.inputTabs.map(t => ({
                prompt: t.formData.aiInput,
                title: t.title,
                resultsData: t.resultsData
            })),
            user_id: 1 // Assuming a static user ID for demonstration
        };
        api.postBuild(data).then(response => {
            utils.setTabData(tab, response);
            utils.stopBlinking(tab);
            utils.startCountdown(tab, response, $scope);
        }).catch(error => {
            console.error('Error:', error);
            utils.stopBlinking(tab);
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
