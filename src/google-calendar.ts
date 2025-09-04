import { Notice } from 'obsidian';
import { google } from 'googleapis';

export interface GCalPluginSettings {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    calendarIds: string[];
}

export interface CalendarInfo {
    id: string;
    summary: string;
    primary?: boolean;
}

export const DEFAULT_SETTINGS: GCalPluginSettings = {
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    calendarIds: []
}

export async function getCalendarEvents(settings: GCalPluginSettings, date?: Date) {
    try {
        const { clientId, clientSecret, refreshToken } = settings;
        if (!clientId || !clientSecret || !refreshToken) {
            new Notice('Google Calendar credentials not set.');
            return;
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const allEvents: any[] = [];
        const calendarsInfo = await calendar.calendarList.list();
        const calendarMap = new Map(calendarsInfo.data.items?.map(cal => [cal.id, cal.summary]) || []);
        
        const calendarIds = settings.calendarIds.length > 0 ? settings.calendarIds : ['primary'];
        
        for (const calendarId of calendarIds) {
            const res = await calendar.events.list({
                calendarId,
                timeMin: targetDate.toISOString(),
                timeMax: nextDay.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });
            if (res.data.items) {
                const eventsWithSource = res.data.items.map(event => ({
                    ...event,
                    calendarName: calendarMap.get(calendarId) || calendarId
                }));
                allEvents.push(...eventsWithSource);
            }
        }
        
        allEvents.sort((a, b) => {
            const timeA = a.start?.dateTime || a.start?.date || '';
            const timeB = b.start?.dateTime || b.start?.date || '';
            return timeA.localeCompare(timeB);
        });
        
        return allEvents;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error === 'invalid_grant') {
            new Notice('Invalid refresh token. Please check your credentials in the plugin settings.');
        } else {
            new Notice('Error fetching Google Calendar events: ' + error.message);
        }
        return;
    }
}

export async function getAvailableCalendars(settings: GCalPluginSettings): Promise<CalendarInfo[]> {
    try {
        const { clientId, clientSecret, refreshToken } = settings;
        if (!clientId || !clientSecret || !refreshToken) {
            new Notice('Google Calendar credentials not set.');
            return [];
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const res = await calendar.calendarList.list();
        
        return res.data.items?.map(cal => ({
            id: cal.id || '',
            summary: cal.summary || '',
            primary: cal.primary || false
        })) || [];
    } catch (error) {
        new Notice('Error fetching calendars: ' + error.message);
        return [];
    }
}
