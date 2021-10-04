# zendesk-phone-notify

Application to send text or call reminders through twilio when there are new tickets in a zendesk queue.

## Requirements

* Nodejs runtime
* Twilio account with funds
* Zendesk API key to use for authenticating

## Installation

```
git clone https://github.com/aveliz1999/zendesk-phone-notify
cd zendesk-phone-notify
npm install
```

## Configuration

There are two sets of config files that have to be filled in for the application to work. The files twilio.yaml.example and zendesk.yaml.example are provided as example configurations, so you can either copy or rename them to just twilio.yaml and zendesk.yaml to fill them in.

### Twilio Config

You can find your accountSid and authToken in your twilio account.
The fromNumber is the number of a phone you reserved in twilio.
The toNumber is the phone number you want receiving the notifications.

The messageFormat and callFormat fields are the text that you went either sent in a text message or read to them in TTS when called.
Both have two wildcards available, `$TICKET_ID` and `$MINUTES_IN_QUEUE` that will be replaced with the actual ticket ID and minutes in queue once sent in a notification.

### Zendesk Config

The zendeskUrl is the base url to your zendesk instance.
The email and apiToken are used to access the data for the tickets.
The monitoredQueueId can be found at the end of your URL when you click on any view in zendesk.
The checkQueueCron is the actual schedule to run the notifications at. You can find out more about cron expressions at https://crontab.guru/
The messagesBeforeCalling is the amount of messages to send before defaulting to calling.

## Running

Just run the command `npm start`