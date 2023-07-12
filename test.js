const searchCriteria = {
    "first": 2,
    "duration": null,
    "when": "",
    "until": "",
    "departureDate": "",
    "flexibleDays": 0,
    "flexibility": false,
    "noOfAdults": 2,
    "noOfChildren": 0,
    "childrenAge": [],
    "backToSearch": false,
    "pageLabel": "tailored-deals",
    "sortBy": "default",
    "searchType": null,
    "page": 2,
    "filters": {
        "boardBasis": [],
        "budgetpp": {"min": 1600, "max": 1600, "code": "budgetPP", "changed": false, "maxValue": "1600.0"},
        "budgettotal": {"min": 3199, "max": 3199, "code": "budgetTotal", "changed": false, "maxValue": "3199.0"},
        "departurePoints": [],
        "destinations": [{"name": "", "value": "AUT", "locationType": null}],
        "fcRating": {"min": 2, "max": 2, "code": "AF0001", "changed": false, "maxValue": 5, "minValue": 2},
        "tripadvisorrating": {"min": 2, "max": 2, "code": "AF0003", "changed": false, "maxValue": 5, "minValue": 2},
        "customerRating": {},
        "selectedFilters": {
            "noOfAdults": false,
            "noOfChildren": false,
            "boardBasis": false,
            "budgetPP": false,
            "destinations": false,
            "fcRating": false,
            "taRating": false,
            "customerReviewRating": false,
            "dates": false,
            "departurePoints": false,
            "duration": false
        }
    },
    "searchRequestType": "paginate",
    "hashValue": "?units[]=AUT#PpWi9pESqEazgvof0nUVp6kMkN4=&airports%5B%5D=&units%5B%5D=AUT&when=&until=&departureDate=&flexibility=false&flexibleDays=0&noOfAdults=2&noOfChildren=0&childrenAge=&boardBasisCode=&fcRating=&tripadvisorrating=&budgetpp=&budgettotal=&searchRequestType=paginate"
}

const formData = new FormData();
formData.set("searchCriteria", JSON.stringify(searchCriteria));

fetch("https://www.tui.co.uk/destinations/newDeals/customize", {
    method: "POST",
    body: formData
})
    .then(r => r.json())
    .then(response => console.log(response));

