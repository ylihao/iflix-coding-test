var fs = require('fs');
var path = require('path');

// get program root dir
var app_root = process.cwd();

if (path.basename(app_root) != 'iflix_coding_test')
    app_root = path.dirname(app_root);

const data_dir = app_root + '/data/';
const accounts_data = data_dir + 'accounts.json';
const amazecom_data = data_dir + 'amazecom.json';
const wondertel_data = data_dir + 'wondertel.json';

const output_dir = app_root + '/output/';
const output_file = output_dir + 'result.json';

// Reads data from file synchronously and parses the content into objects
// Returns the object
// Experimented with Promise but couldn't get it to work
function parse_data(file, encoding = 'utf8') {
    return JSON.parse(fs.readFileSync(file, encoding));
}

// Returns an array of offers given to a user by a partner
function get_offers(number, partner) {
    var partner_name = partner.name;
    var offers_data = partner.data;
    var offers = [];

    // filter revocations with user phone number
    if (typeof offers_data.revocations !== "undefined") {
        var revocations = offers_data.revocations.filter(function (el) {
            return el.number == number;
        });

        for (i in revocations) {
            var offer = {};
            offer.type = 'revocation';
            offer.partner = partner_name;
            offer.date = revocations[i].date;
            offers.push(offer);
        }
    }

    // filter amazecom grants with user phone number
    var grants = offers_data.grants.filter(function (el) {
        return el.number == number;
    });

    for (i in grants) {
        var offer = {};
        offer.type = 'grant';
        offer.partner = partner_name;
        offer.period = grants[i].period;
        offer.date = grants[i].date;

        if (typeof offer.period !== "undefined" && offer.period > 0)
            offers.push(offer);
    }

    return offers;
}

// Returns number of days in between two dates
function count_days_in_between(date1, date2) {
    var start_date;
    var end_date;

    // end_date should always come later than start_date
    if (date1 < date2) {
        start_date = date1;
        end_date = date2;
    } else {
        start_date = date2;
        end_date = date1;
    }

    return Math.floor((end_date - start_date) / (1000 * 60 * 60 * 24));
}

// Returns subscription info of a user
// user is an object consists of a name and a phone number
// partner1 and partner2 are subscription info of each partner
function get_subscription(user, partner1, partner2) {
    var name = user.name;
    var number = user.number;
    var offers = [];
    
    try {
        offers = get_offers(number, partner1);
        offers = offers.concat(get_offers(number, partner2));
    } catch(e) {
        console.log("Partner data incomplete.", e.stack);
    }

    // ignores offers that don't map to an existing account
    if (offers.length && name != '') {

        // sorts offers by date
        offers.sort(function (a, b) {
            var date_a = new Date(a.date);
            var date_b = new Date(b.date);
            return date_a.getTime() > date_b.getTime();
        });

        var days = { Amazecom: 0, Wondertel: 0 };
        var active_partner = '';
        var active_grant_start_date = new Date();
        var active_grant_end_date = new Date();

        for (k in offers) {
            var start_date = new Date(offers[k].date.replace('+00:00', ''));
            var end_date = new Date(offers[k].date.replace('+00:00', ''));
            end_date.setMonth(end_date.getMonth() + offers[k].period);

            var days_in_between = count_days_in_between(start_date, end_date);

            // new grant starts
            if (offers[k].type == 'grant' && active_partner == '') {
                active_partner = offers[k].partner;
                active_grant_start_date = new Date(start_date);
                active_grant_end_date = new Date(end_date);
                days[offers[k].partner] += days_in_between;
            }

            // previous grant from the same partner is still active
            // stack grants on top of each other
            else if (offers[k].type == 'grant' && active_partner == offers[k].partner) {
                days[offers[k].partner] += days_in_between;
            }

            // when an active grant is revoked
            else if (offers[k].type == 'revocation' && active_partner == offers[k].partner) {
                active_partner = '';
                active_grant_end_date = new Date(offers[k].date);

                days_in_between = count_days_in_between(active_grant_start_date, active_grant_end_date);
                days[offers[k].partner] = days_in_between;
            }
        }

        if (days['Amazecom'] > 0 && days['Wondertel'] > 0)
            return { Wondertel: days['Wondertel'], Amazecom: days['Amazecom'] };

        if (days['Amazecom'] > 0)
            return { Amazecom: days['Amazecom'] };

        if (days['Wondertel'] > 0)
            return { Wondertel: days['Wondertel'] };
    }

    return;
}

try {
    var accounts = parse_data(accounts_data);
    var amazecom = { name: 'Amazecom', data: parse_data(amazecom_data) };
    var wondertel = { name: 'Wondertel', data: parse_data(wondertel_data) };

    var subs = {};
    var subscription = {};

    // sorts accounts by name
    accounts.users.sort(function (a, b) {
        return b.name.localeCompare(a.name);
    });

    for (i in accounts.users) {
        subscription[accounts.users[i].name] = get_subscription(accounts.users[i], amazecom, wondertel);
    }

    subs['subscriptions'] = subscription;

    var output = JSON.stringify(subs, null, 2) + '\n';

    fs.writeFile(output_file, output, function(err) {
        if (err) {
            return console.log(err);
        }
    
        // console.log("'result.json' created.");
    });

} catch(e) {
    console.log('Error:', e.stack);
}

module.exports = {
    parse_data: parse_data,
    count_days_in_between: count_days_in_between,
    get_offers: get_offers,
    get_subscription: get_subscription
}