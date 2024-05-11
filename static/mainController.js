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

    $scope.submitForm = function() {
        $scope.buttonText = 'Generating ⏳';
        $scope.isBlinking = true;
        $http.post('/build', {
            description_input: $scope.formData.aiInput,
            must_haves_input: $scope.formData.mustHaves,
            supporting_text_input: $scope.formData.supportingText,
            user_id: 1 // Assuming a static user ID for demonstration
        })
            .then(function(response) {
                console.log('Success:', response);
                var countdown = 3;
                $scope.buttonText = 'Redirecting to results in ' + countdown + '...';
                $scope.isBlinking = false; 
                var interval = $interval(function() {
                    countdown--;
                    $scope.buttonText = 'Redirecting to results in ' + countdown + '...';
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
                                $scope.buttonText = 'Build with AI';
                            });
                    }
                }, 1000);
            }, function(error) {
                console.error('Error:', error);
                $scope.isBlinking = false;
            });
    };

    $scope.activateTab = function(tabId) {
        $scope.activeTab = tabId;
    };
});