const app = angular.module('aiProjectBuilder', ['ngSanitize'])
app.filter('pluralize', function() {
    return function(number, singular, plural) {
        return number === 1 ? singular : plural;
    };
});
