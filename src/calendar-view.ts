import { ItemView, WorkspaceLeaf } from 'obsidian';
import { getCalendarEvents, GCalPluginSettings } from './google-calendar';

export const CALENDAR_VIEW_TYPE = 'calendar-view';

export class CalendarView extends ItemView {
    private settings: GCalPluginSettings;
    private currentDate: Date;
    private isLoading = false;
    private navigationButtons: { prev: HTMLButtonElement; next: HTMLButtonElement } = { prev: null as any, next: null as any };

    constructor(leaf: WorkspaceLeaf, settings: GCalPluginSettings) {
        super(leaf);
        this.settings = settings;
        this.currentDate = new Date();
    }
    
    updateSettings(settings: GCalPluginSettings) {
        this.settings = settings;
        this.render();
    }

    getViewType() {
        return CALENDAR_VIEW_TYPE;
    }

    getDisplayText() {
        return 'Google Calendar';
    }

    getIcon() {
        return 'calendar';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();

        const header = container.createEl('div', { cls: 'calendar-header' });
        
        const leftControls = header.createEl('div');
        this.navigationButtons.prev = leftControls.createEl('button', { text: '<' });
        this.navigationButtons.prev.addEventListener('click', () => {
            if (this.isLoading) return;
            this.currentDate.setDate(this.currentDate.getDate() - 1);
            this.render();
        });
        
        header.createEl('h2', { text: this.currentDate.toDateString() });
        
        const rightControls = header.createEl('div');
        const todayButton = rightControls.createEl('button', { text: 'Today' });
        todayButton.addEventListener('click', () => {
            if (this.isLoading) return;
            this.currentDate = new Date();
            this.render();
        });
        const refreshButton = rightControls.createEl('button', { text: '🔄' });
        refreshButton.addEventListener('click', () => {
            if (this.isLoading) return;
            this.render();
        });
        this.navigationButtons.next = rightControls.createEl('button', { text: '>' });
        this.navigationButtons.next.addEventListener('click', () => {
            if (this.isLoading) return;
            this.currentDate.setDate(this.currentDate.getDate() + 1);
            this.render();
        });

        const table = container.createEl('table');
        this.render(table);
    }

    async render(table?: HTMLTableElement) {
        const container = this.containerEl.children[1];
        
        if (!table) {
            table = container.querySelector('table') as HTMLTableElement;
            const header = this.containerEl.querySelector('.calendar-header h2') as HTMLHeadingElement;
            header.setText(this.currentDate.toDateString());
        }
        
        table.empty();
        container.querySelectorAll('p').forEach(p => p.remove());

        this.setLoadingState(true);
        
        try {
            const events = await getCalendarEvents(this.settings, this.currentDate);
            if (events && events.length > 0) {
                let tableBody = table.createTBody();
                for (const event of events) {
                    if (!event.start) {
                        continue;
                    }
                    let row = tableBody.createEl('tr');
                    
                    let timeCell = row.createEl('td');
                    let time, duration = '';
                    if (event.start.dateTime && event.end?.dateTime) {
                        const startTime = new Date(event.start.dateTime);
                        const endTime = new Date(event.end.dateTime);
                        time = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const durationMs = endTime.getTime() - startTime.getTime();
                        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                        if (durationHours > 0) {
                            duration = ` (${durationHours}h ${durationMinutes}m)`;
                        } else {
                            duration = ` (${durationMinutes}m)`;
                        }
                    } else {
                        time = 'All-day';
                    }
                    timeCell.setText(time + duration);
                    
                    let titleCell = row.createEl('td');
                    if (event.hangoutLink) {
                        let meetLink = titleCell.createEl('a', {
                            text: '🎥 ',
                            href: event.hangoutLink,
                            cls: 'meet-link'
                        });
                        meetLink.setAttribute('target', '_blank');
                        titleCell.createSpan({ text: event.summary || '' });
                    } else {
                        titleCell.setText(event.summary || '');
                    }
                    
                    if (event.calendarName && event.calendarName !== 'primary') {
                        titleCell.createEl('span', { 
                            text: ` • ${event.calendarName}`,
                            cls: 'calendar-source'
                        });
                    }
                }
            } else {
                container.createEl('p', { text: 'Nothing today!' });
            }
        } catch (error) {
            container.createEl('p', { text: 'Error loading calendar events', cls: 'error' });
        } finally {
            this.setLoadingState(false);
        }
    }

    private setLoadingState(loading: boolean) {
        this.isLoading = loading;
        this.navigationButtons.prev.disabled = loading;
        this.navigationButtons.next.disabled = loading;
        
        const container = this.containerEl.children[1];
        const existingLoader = container.querySelector('.loading');
        
        if (loading && !existingLoader) {
            container.createEl('div', { text: 'Loading...', cls: 'loading' });
        } else if (!loading && existingLoader) {
            existingLoader.remove();
        }
    }

    async onClose() {
        this.navigationButtons.prev?.removeEventListener('click', this.navigationButtons.prev.onclick as any);
        this.navigationButtons.next?.removeEventListener('click', this.navigationButtons.next.onclick as any);
    }
}