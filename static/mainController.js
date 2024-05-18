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

    // HTML Helpers
    $scope.show = function(result, tab) {
        tab.resultsData.forEach((r, index) => r.selectedResultIndex = index);
        result.selectedResultIndex = -1;
    };

    $scope.showCopyAlert = function(textContent) {
        const copyAlert = document.createElement('div');
        copyAlert.textContent = textContent;
        copyAlert.style.position = 'absolute';
        copyAlert.style.bottom = '20px';
        copyAlert.style.right = '20px';
        copyAlert.style.padding = '10px';
        copyAlert.style.background = 'lightgreen';
        copyAlert.style.borderRadius = '5px';
        copyAlert.style.zIndex = '1000';
        document.body.appendChild(copyAlert);
        setTimeout(() => {
            copyAlert.style.transition = 'opacity 0.5s';
            copyAlert.style.opacity = '0';
            setTimeout(() => document.body.removeChild(copyAlert), 500);
        }, 1000);
    };

    $scope.copyOutput = function(tab) {
        if (tab && tab.resultsData && tab.resultsData.result) {
            const textToCopy = tab.resultsData.result;
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            navigator.clipboard.writeText(textArea.value)
                .then(() => {
                    $scope.showCopyAlert('Output copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            document.body.removeChild(textArea);
        } else {
            alert('No output available to copy.');
        }
    };

    $scope.buildAll = function() {
        $scope.inputTabs.forEach(tab => {
            $scope.submitForm(tab);
        });
    };

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

        $scope.inputTabs.forEach(tab => {
            if (tab.selectedLLM) {
                const matchingLLM = $scope.llms.find(llm => llm.display === tab.selectedLLM.display);
                if (matchingLLM) {
                    tab.selectedLLM = matchingLLM;
                }
            } else {
                tab.selectedLLM = $scope.llms[0]; // Set default to the first LLM in the list if none is selected
            }
        });
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
                prompt: t.resultsData && t.resultsData[0] && t.resultsData[0].all_prompts ? t.resultsData[0].all_prompts[0] : t.formData.aiInput,
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
