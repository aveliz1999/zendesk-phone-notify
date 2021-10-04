import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export type TwilioConfig = {
    accountSid: string,
    authToken: string,
    fromNumber: string,
    toNumber: string,
    messageFormat: string,
    callFormat: string
}

export type ZendeskConfig = {
    zendeskUrl: string,
    email: string,
    apiToken: string,
    monitoredQueueId: string,
    checkQueueCron: string,
    messagesBeforeCalling: number
}

export const twilioConfig: TwilioConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'twilio.yaml'), 'utf-8'));
export const zendeskConfig: ZendeskConfig = yaml.parse(fs.readFileSync(path.resolve(__dirname, 'zendesk.yaml'), 'utf-8'));