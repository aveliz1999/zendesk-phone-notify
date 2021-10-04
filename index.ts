import axios from 'axios';
import { CronJob } from 'cron';
import twilioInit, {twiml} from 'twilio';
import {twilioConfig, zendeskConfig} from './config'
import fs from 'fs';

// Define some of the fields in the tickets that we need
type TicketType = {
    url: string,
    assignee_id?: string,
    status: string,
    subject: string,
    created_at: string,
    id: number
}

// Initialize the twilio client and authenticate
const twilioClient = twilioInit(twilioConfig.accountSid, twilioConfig.authToken);

// The required format is {email}/token:{apiToken} and then base64 encoded
const zendeskKey = Buffer.from(`${zendeskConfig.email}/token:${zendeskConfig.apiToken}`).toString('base64');

// Run the check at an interval designated in the zendesk config file
// https://crontab.guru/
const job = new CronJob(zendeskConfig.checkQueueCron, async () => {
    let baseZendeskUrl = zendeskConfig.zendeskUrl;
    if(!baseZendeskUrl.endsWith('/')) {
        baseZendeskUrl += '/';
    }

    // Get the tickets in this view (Unassigned support as an example)
    const {data} = await axios.get<{[key: string]: any}>(`${baseZendeskUrl}api/v2/views/${zendeskConfig.monitoredQueueId}/tickets`, {
        headers: {
            'Authorization': `Basic ${zendeskKey}`
        }
    })

    // Extract the list of tickets in the view
    const tickets = data.tickets as TicketType[];

    // Read the tracked tickets from the local file
    const tracked = fs.existsSync('./tracked.json') ? JSON.parse(fs.readFileSync('./tracked.json', 'utf-8')) : {};

    for(let ticket of tickets) {
        // Only do the reminder checks if the ticket status is still "new"
        if(ticket.status === 'new') {
            const milliSinceSubmitted = Math.abs(new Date(ticket.created_at).getTime() - new Date().getTime());
            const minutesSinceSubmitted = Math.floor(milliSinceSubmitted / 1000 / 60);

            // Don't notify for brand new tickets
            if(minutesSinceSubmitted < 1) {
                continue;
            }
            
            // Get how many times a notification has been sent for this ticket
            const amountsNotified = tracked[ticket.id] || 0;

            // Send a message if the amount of notifications is still less than the amount of messages before calling in the config
            // Otherwise, send a call
            if(amountsNotified < zendeskConfig.messagesBeforeCalling) {
                let bodyMessage = twilioConfig.messageFormat.replace('$TICKET_ID', ticket.id.toString()).replace('$MINUTES_IN_QUEUE', minutesSinceSubmitted.toString());
                if(amountsNotified + 1 === zendeskConfig.messagesBeforeCalling) {
                    bodyMessage += `\nThis is the last message before you receive a call.`
                }
                twilioClient.messages.create({
                    from: twilioConfig.fromNumber,
                    to: twilioConfig.toNumber,
                    body: bodyMessage
                })
            }
            else {
                // Form the answer to the call
                const VoiceResponse = twiml.VoiceResponse;
                const response = new VoiceResponse();
                response.pause('2');
                response.say({
                    voice: 'Polly.Joey',
                    language: 'en-US',
                }, twilioConfig.callFormat.replace('$TICKET_ID', ticket.id.toString()).replace('$MINUTES_IN_QUEUE', minutesSinceSubmitted.toString()));

                const call = await twilioClient.calls.create({
                    twiml: response.toString(),
                    from: twilioConfig.fromNumber,
                    to: twilioConfig.toNumber,
                });
            }

            // Increase the amounts notified for this ticket in the tracked file
            tracked[ticket.id] = amountsNotified + 1;
        }
    }

    // Save the tracked file back to disk
    fs.writeFileSync('./tracked.json', JSON.stringify(tracked));

}, null, true, 'America/New_York', null, false);