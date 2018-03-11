var fs = require('fs');

const data_dir = '../data/';
const accounts_data = data_dir + 'accounts.json';
const amazecom_data = data_dir + 'amazecom.json';
const wondertel_data = data_dir + 'wondertel.json';

const output_dir = '../output/';
const output_file = output_dir + 'result.json';

try {
    // Reads data from file synchronously.
    // Experimented with Promise but couldn't get it to work.
    var accounts = JSON.parse(fs.readFileSync(accounts_data, 'utf8'));
    var amazecom = JSON.parse(fs.readFileSync(amazecom_data, 'utf8'));
    var wondertel = JSON.parse(fs.readFileSync(wondertel_data, 'utf8'));

    var subs = {};
    var subscription = {};

    for (i in accounts.users) {
        var name = accounts.users[i].name;
        var number = accounts.users[i].number;
        var offers = [];

        // filter amazecom revocations with user number
        var revocations_a = amazecom.revocations.filter(function (el) {
            return el.number == number;
        });

        // filter amazecom grants with user number
        var grants_a = amazecom.grants.filter(function (el) {
            return el.number == number;
        });

        // filter wondertel revocations with user number
        var revocations_w = wondertel.revocations.filter(function (el) {
            return el.number == number;
        });

        // filter wondertel grants with user number
        var grants_w = wondertel.grants.filter(function (el) {
            return el.number == number;
        });

        for (j in revocations_a) {
            var offer = {};
            offer.type = 'revocation';
            offer.partner = 'Amazecom';
            offer.date = revocations_a[j].date;
            offers.push(offer);
        }

        for (j in grants_a) {
            var offer = {};
            offer.type = 'grant';
            offer.partner = 'Amazecom';
            offer.period = grants_a[j].period;
            offer.date = grants_a[j].date;

            if (typeof offer.period !== undefined && offer.period > 0)
                offers.push(offer);
        }

        for (j in revocations_w) {
            var offer = {};
            offer.type = 'revocation';
            offer.partner = 'Wondertel';
            offer.date = revocations_w[j].date;
            offers.push(offer);
        }

        for (j in grants_w) {
            var offer = {};
            offer.type = 'grant';
            offer.partner = 'Wondertel';
            offer.period = grants_w[j].period;
            offer.date = grants_w[j].date;

            if (typeof offer.period !== undefined && offer.period > 0)
                offers.push(offer);
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
            var revoked = 0;
            var active_grant_start_date = new Date();
            var active_grant_end_date = new Date();

            for (k in offers) {
                var start_date = new Date(offers[k].date.replace('+00:00', ''));
                var end_date = new Date(offers[k].date.replace('+00:00', ''));
                end_date.setMonth(end_date.getMonth() + offers[k].period);

                var days_in_between = Math.floor((end_date - start_date) / (1000 * 60 * 60 * 24));

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

                    days_in_between = Math.floor((active_grant_end_date - active_grant_start_date) / (1000 * 60 * 60 * 24));
                    days[offers[k].partner] = days_in_between;
                }
            }

            if (days['Amazecom'] > 0 && days['Wondertel'] > 0)
                subscription[name] = { Wondertel: days['Wondertel'], Amazecom: days['Amazecom'] };
            else if (days['Amazecom'] > 0)
                subscription[name] = { Amazecom: days['Amazecom'] };
            else if (days['Wondertel'] > 0)
                subscription[name] = { Wondertel: days['Wondertel'] };
        }
    }

    subs['subscriptions'] = subscription;

    var output = JSON.stringify(subs, null, 2)
    // console.log(JSON.stringify(subs));

    fs.writeFile(output_file, output, function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    });

    return;

} catch(e) {
    console.log('Error:', e.stack);
}