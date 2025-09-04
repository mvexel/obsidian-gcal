import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, Notice } from 'obsidian';
import { GCalPluginSettings, DEFAULT_SETTINGS, getCalendarEvents, getAvailableCalendars, CalendarInfo } from './src/google-calendar';
import { CalendarView, CALENDAR_VIEW_TYPE } from './src/calendar-view';

export default class GCalPlugin extends Plugin {
    settings: GCalPluginSettings;

    async onload() {
        await this.loadSettings();

        this.registerView(
            CALENDAR_VIEW_TYPE,
            (leaf) => new CalendarView(leaf, this.settings)
        );

        this.addCommand({
            id: 'gcal:open-view',
            name: 'Open Google Calendar view',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'gcal:insert-events',
            name: 'Insert today\'s events',
            editorCallback: async (editor) => {
                const events = await getCalendarEvents(this.settings);
                if (events && events.length > 0) {
                    let output = `## ${new Date().toDateString()} Events\n\n`;
                    for (const event of events) {
                        if (!event.start) continue;
                        let time;
                        if (event.start.dateTime && event.end?.dateTime) {
                            const startTime = new Date(event.start.dateTime);
                            const endTime = new Date(event.end.dateTime);
                            const startStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const endStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            time = `${startStr}-${endStr}`;
                        } else {
                            time = 'All-day';
                        }
                        output += `- **${time}**: ${event.summary || 'Untitled'}`;
                        if (event.hangoutLink) {
                            output += ` [Join Meeting](${event.hangoutLink})`;
                        }
                        output += '\n';
                    }
                    editor.replaceSelection(output);
                } else {
                    editor.replaceSelection('No events today.\n');
                }
            }
        });

        this.addSettingTab(new GCalSettingTab(this.app, this));
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(CALENDAR_VIEW_TYPE);

        const rightLeaf = this.app.workspace.getRightLeaf(false);
        if (rightLeaf) {
            await rightLeaf.setViewState({
                type: CALENDAR_VIEW_TYPE,
                active: true,
            });
        }

        const leaf = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE)[0];
        if (leaf) {
            this.app.workspace.revealLeaf(leaf);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        
        const calendarViews = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
        calendarViews.forEach(leaf => {
            const view = leaf.view as CalendarView;
            view.updateSettings(this.settings);
        });
    }
}

class GCalSettingTab extends PluginSettingTab {
    plugin: GCalPlugin;
    private availableCalendars: CalendarInfo[] = [];

    constructor(app: App, plugin: GCalPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h3', { text: 'Google Calendar Authentication' });
        containerEl.createEl('p', { 
            text: 'See README for instructions on setting up Google Calendar API credentials.',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Client ID')
            .setDesc('Google Calendar API Client ID')
            .addText(text => text
                .setPlaceholder('Enter your client ID')
                .setValue(this.plugin.settings.clientId)
                .onChange(async (value) => {
                    if (value.trim().length === 0) {
                        new Notice('Client ID cannot be empty');
                        return;
                    }
                    this.plugin.settings.clientId = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Client Secret')
            .setDesc('Google Calendar API Client Secret')
            .addText(text => text
                .setPlaceholder('Enter your client secret')
                .setValue(this.plugin.settings.clientSecret ? '••••••••••••••••' : '')
                .onChange(async (value) => {
                    if (value !== '••••••••••••••••') {
                        if (value.trim().length === 0) {
                            new Notice('Client Secret cannot be empty');
                            return;
                        }
                        this.plugin.settings.clientSecret = value.trim();
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Refresh Token')
            .setDesc('Google Calendar API Refresh Token')
            .addText(text => text
                .setPlaceholder('Enter your refresh token')
                .setValue(this.plugin.settings.refreshToken ? '••••••••••••••••' : '')
                .onChange(async (value) => {
                    if (value !== '••••••••••••••••') {
                        this.plugin.settings.refreshToken = value;
                        await this.plugin.saveSettings();
                    }
                }));

        containerEl.createEl('h3', { text: 'Additional Calendars' });
        containerEl.createEl('p', { 
            text: 'By default, your primary calendar is used. To add other calendars, discover them first:',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Discover Calendars')
            .setDesc('Load your available Google Calendars')
            .addButton(button => button
                .setButtonText('Load Calendars')
                .onClick(async () => {
                    button.setButtonText('Loading...');
                    button.setDisabled(true);
                    this.availableCalendars = await getAvailableCalendars(this.plugin.settings);
                    button.setButtonText('Load Calendars');
                    button.setDisabled(false);
                    this.display();
                }));

        if (this.availableCalendars.length > 0) {
            for (const cal of this.availableCalendars.filter(c => !c.primary)) {
                new Setting(containerEl)
                    .setName(cal.summary)
                    .setDesc(cal.id)
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.calendarIds.includes(cal.id))
                        .onChange(async (value) => {
                            if (value) {
                                if (!this.plugin.settings.calendarIds.includes(cal.id)) {
                                    this.plugin.settings.calendarIds.push(cal.id);
                                }
                            } else {
                                this.plugin.settings.calendarIds = this.plugin.settings.calendarIds.filter(id => id !== cal.id);
                            }
                            await this.plugin.saveSettings();
                        }));
            }
        }
    }
}
