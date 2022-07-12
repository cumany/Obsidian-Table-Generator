import {
    App,
    Editor,
    MarkdownView,
    Menu,
    Plugin,
    PluginSettingTab, requireApiVersion,
    Setting
} from 'obsidian';
import { tableGeneratorMenu } from './tableGeneratorMenu';
import TableGenerator from "./ui/TableGenerator.svelte";
import { hideTable } from "./utils/modifiedTable";

interface TableGeneratorPluginSettings {
    rowCount: number;
    columnCount: number;
}

const DEFAULT_SETTINGS: TableGeneratorPluginSettings = {
    rowCount: 8,
    columnCount: 8
}

export default class TableGeneratorPlugin extends Plugin {
    tableGeneratorEl: HTMLElement;
    settings: TableGeneratorPluginSettings;

    async onload() {
        await this.loadSettings();

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => this.handleTableGeneratorMenu(menu, editor, view))
        );

        this.addSettingTab(new SampleSettingTab(this.app, this));

        // Check click and cancel the menu if the click is outside the menu

        this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            if ((evt.target as HTMLElement).classList.contains("table-generator-menu") || (evt.target as HTMLElement).parentElement?.classList.contains("table-generator-menu")) return;
            if (!this.tableGeneratorEl?.contains(evt.target as HTMLElement)) {
                if (!document.body.contains(this.tableGeneratorEl)) return;
                hideTable();
            }
        });


        if (requireApiVersion("0.15.0")) {
            this.registerDomEvent(window, 'click', (evt: MouseEvent) => {
                    if ((evt.targetNode as HTMLElement)?.classList.contains("table-generator-menu") || (evt.targetNode as HTMLElement)?.parentElement?.classList.contains("table-generator-menu")) return;
                    if ((evt.targetNode as HTMLElement) === null) hideTable(true);
                    if (!this.tableGeneratorEl?.contains(evt.targetNode as HTMLElement))
                        hideTable();
                }
            );

            this.app.workspace.on('window-open', (leaf) => {
                this.registerDomEvent(leaf.doc, 'click', (evt: MouseEvent) => {
                    if ((evt.target as HTMLElement).classList.contains("table-generator-menu") || (evt.target as HTMLElement).parentElement?.classList.contains("table-generator-menu")) return;
                    if (!this.tableGeneratorEl?.contains(evt.target as HTMLElement)) {
                        if (!activeDocument.body.contains(this.tableGeneratorEl)) return;
                        hideTable();
                    }
                });
            });
        }

    }

    createTableGeneratorMenu(editor: Editor, plugin: TableGeneratorPlugin) {
        if (requireApiVersion("0.15.0")) {
            this.tableGeneratorEl = activeDocument.createElement("div");
        } else {
            this.tableGeneratorEl = document.createElement("div");
        }

        this.tableGeneratorEl.className = "table-generator-view";
        this.tableGeneratorEl.style.position = "absolute";
        this.tableGeneratorEl.style.border = "1px solid black";
        this.tableGeneratorEl.style.display = "none";

        if (requireApiVersion("0.15.0")) {
            activeDocument.body.appendChild(this.tableGeneratorEl);
        } else {
            document.body.appendChild(this.tableGeneratorEl);
        }
        new TableGenerator({ target: this.tableGeneratorEl, props: { editor: editor, plugin: plugin } });

    }

    handleTableGeneratorMenu(menu: Menu, editor: Editor, view: MarkdownView) {
        menu.addItem((item) => {
            const itemDom = (item as any).dom as HTMLElement;
            itemDom.addClass("table-generator-menu");
            item
                .setTitle("Table Generator")
                .setIcon("table")
                .onClick(async () => {
                    this.createTableGeneratorMenu(editor, this);
                    tableGeneratorMenu(app, this, menu, editor, view, this.tableGeneratorEl);
                });
        });
    }

    onunload() {
        if (this.tableGeneratorEl === undefined) return;
        if (!(this.tableGeneratorEl instanceof HTMLElement)) return;
        if (requireApiVersion("0.15.0")) {
            if (!activeDocument.body.contains(this.tableGeneratorEl)) return;
            activeDocument.body.removeChild(this.tableGeneratorEl);
        } else {
            if (!document.body.contains(this.tableGeneratorEl)) return;
            document.body.removeChild(this.tableGeneratorEl);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: TableGeneratorPlugin;
    private applyDebounceTimer = 0;

    constructor(app: App, plugin: TableGeneratorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    applySettingsUpdate() {
        clearTimeout(this.applyDebounceTimer);
        const plugin = this.plugin;
        this.applyDebounceTimer = window.setTimeout(() => {
            plugin.saveSettings();
        }, 100);
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Table Generator' });

        let rowText: HTMLDivElement;
        new Setting(containerEl)
            .setName('Row Count')
            .setDesc('The number of rows in the table')
            .addSlider((slider) =>
                slider
                    .setLimits(2, 12, 1)
                    .setValue(this.plugin.settings.rowCount)
                    .onChange(async (value) => {
                        rowText.innerText = ` ${ value.toString() }`;
                        this.plugin.settings.rowCount = value;
                        this.applySettingsUpdate();
                    }),
            )
            .settingEl.createDiv("", (el) => {
            rowText = el;
            el.style.minWidth = "2.3em";
            el.style.textAlign = "right";
            el.innerText = ` ${ this.plugin.settings.rowCount.toString() }`;
        });

        let columnText: HTMLDivElement;
        new Setting(containerEl)
            .setName('Columns Count')
            .setDesc('The number of columns in the table')
            .addSlider((slider) =>
                slider
                    .setLimits(2, 12, 1)
                    .setValue(this.plugin.settings.columnCount)
                    .onChange(async (value) => {
                        columnText.innerText = ` ${ value.toString() }`;
                        this.plugin.settings.columnCount = value;
                        this.applySettingsUpdate();
                    }),
            )
            .settingEl.createDiv("", (el) => {
            columnText = el;
            el.style.minWidth = "2.3em";
            el.style.textAlign = "right";
            el.innerText = ` ${ this.plugin.settings.columnCount.toString() }`;
        });

        this.containerEl.createEl('h2', { text: 'Say Thank You' });

        new Setting(containerEl)
            .setName('Donate')
            .setDesc('If you like this plugin, consider donating to support continued development:')
            .addButton((bt) => {
                bt.buttonEl.outerHTML = `<a href="https://www.buymeacoffee.com/boninall"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=boninall&button_colour=6495ED&font_colour=ffffff&font_family=Inter&outline_colour=000000&coffee_colour=FFDD00"></a>`;
            });
    }
}
