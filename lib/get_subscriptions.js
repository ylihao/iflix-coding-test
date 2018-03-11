var fs = require('fs');

const dir = '../data/';
const accounts_data = dir + 'accounts.json';
const amazecom_data = dir + 'amazecom.json';
const wondertel_data = dir + 'wondertel.json';

try {
    // Reads data from file synchronously.
    // Experimented with Promise but couldn't get it to work.

    var accounts = JSON.parse(fs.readFileSync(accounts_data, 'utf8'));
    // console.log(accounts);

    var amazecom = JSON.parse(fs.readFileSync(amazecom_data, 'utf8'));
    // console.log(amazecom);

    var wondertel = JSON.parse(fs.readFileSync(wondertel_data, 'utf8'));
    // console.log(wondertel);

    var subs = {};
    var subscription = {};

    for (i in accounts.users) {
        var name = accounts.users[i].name;
        var number = accounts.users[i].number;
        var offers = [];

        // if (name != 'Bridgette') continue;

        // filter amazecom revocations with user number
        var revocations_a = amazecom.revocations.filter(function (el) {
            return el.number == number;
        });
        // console.log(revocations_a);

        // filter amazecom grants with user number
        var grants_a = amazecom.grants.filter(function (el) {
            return el.number == number;
        });
        // console.log(grants_a);

        // filter wondertel revocations with user number
        var revocations_w = wondertel.revocations.filter(function (el) {
            return el.number == number;
        });
        // console.log(revocations_w);

        // filter wondertel grants with user number
        var grants_w = wondertel.grants.filter(function (el) {
            return el.number == number;
        });
        // console.log(grants_w);

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

            // sort offers by date
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

                    // console.log("### new grant begins ###")
                    // console.log(offers[k]);
                    // console.log("active_grant_start_date", active_grant_start_date);
                    // console.log("active_grant_end_date", active_grant_end_date);
                    // console.log("### new grant ends ###")
                }

                // previous grant from the same partner is still active
                // stack grants on top of each other
                else if (offers[k].type == 'grant' && active_partner == offers[k].partner) {
                    days[offers[k].partner] += days_in_between;
                }

                // if an active grant is revoked
                else if (offers[k].type == 'revocation' && active_partner == offers[k].partner) {
                    active_partner = '';
                    active_grant_end_date = new Date(offers[k].date);

                    // console.log("### revoked begins ###")
                    // console.log(offers[k]);
                    // console.log("active_grant_end_date", active_grant_end_date);
                    // console.log("### revoked ends ###")

                    days_in_between = Math.floor((active_grant_end_date - active_grant_start_date) / (1000 * 60 * 60 * 24));
                    days[offers[k].partner] = days_in_between;
                }

                // a different partner still owns the user
                // grant ignored
                else if (offers[k].type == 'grant' && active_partner != offers[k].partner) {

                }

                // console.log("name", name);
                // console.log("start_date", start_date);
                // console.log("end_date", end_date);
                // console.log("days", days);
                // console.log("=============");
            }

            // subs[name] = offers;

            if (days['Amazecom'] > 0 && days['Wondertel'] > 0)
                subscription[name] = { Wondertel: days['Wondertel'], Amazecom: days['Amazecom'] };
            else if (days['Amazecom'] > 0)
                subscription[name] = { Amazecom: days['Amazecom'] };
            else if (days['Wondertel'] > 0)
                subscription[name] = { Wondertel: days['Wondertel'] };
        }
    }

    subs['subscriptions'] = subscription;

    console.log(JSON.stringify(subs));
    // console.log(subs);
    return;

} catch(e) {
    console.log('Error:', e.stack);
}