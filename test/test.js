var expect = require("chai").expect;
var get_iflix_subscriptions = require("../lib/get_iflix_subscriptions");

describe("Reads a file synchronously and parses its content into objects", function() {
    it("Returns parsed data", function() {
        var file = "./test/fixture/test-accounts.json";
        var result = {
            "users": [
                {
                    "number": "45875660609",
                    "name": "John"
                },
                {
                    "number": "49509330262",
                    "name": "Jenny"
                }
            ]
        };
        expect(get_iflix_subscriptions.parse_data(file)).to.deep.equal(result);
    });
})

describe("Counts number of days in between two dates", function() {
    it("Returns 30 if date1 is 2015-01-01 and date2 is 2015-01-31", function() {
        var date1 = new Date("2015-01-01");
        var date2 = new Date("2015-01-31");
        expect(get_iflix_subscriptions.count_days_in_between(date1, date2)).to.equal(30);
    });
})

describe("Gets offers given to a user by partners", function() {
    it("Returns an array of offers given to a user by the partners", function() {
        var number = 27528742433;

        var partner = { name: "Amazecom", data: { 
            grants: [
                { "period": 3, "number": "27528742433", "date": "2015-07-21T01:34:10+00:00" }
            ], 
            revocations: [
                { "number": "27528742433", "date": "2015-07-21T01:34:10+00:00" }
            ]
        }};

        var result = [
            { type: "revocation", partner: "Amazecom", date: "2015-07-21T01:34:10+00:00" }, 
            { type: "grant", partner: "Amazecom", period: 3, date: "2015-07-21T01:34:10+00:00"}
        ];

        expect(get_iflix_subscriptions.get_offers(number, partner)).to.deep.equal(result);
    });
});

describe("Gets subscription info of a user", function() {
    it("Returns a subscription object containing the user's subscription info from each partner in days", function() {
        var user = { "number": "77902601451", "name": "Hussain" };

        var partner1 = { name: "Amazecom", data: { 
            revocations: [
                { "number": "77902601451", "date": "2015-04-30T20:34:44+00:00" }
            ],
            grants: [
                { "period": 2, "number": "77902601451", "date": "2015-02-21T15:10:01+00:00" },
                { "period": 5, "number": "77902601451", "date": "2015-02-25T05:05:34+00:00" }
            ]}
        };

        var partner2 = { name: "Wondertel", data: { 
            grants: [
                { "period": 1, "number": "77902601451", "date": "2015-10-14T16:24:24+00:00" }
            ]}
        };

        var result = { "Wondertel": 31, "Amazecom": 68 };

        expect(get_iflix_subscriptions.get_subscription(user, partner1, partner2)).to.deep.equal(result);
    });
});