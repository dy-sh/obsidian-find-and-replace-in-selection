import { App, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';
import * as CodeMirror from "codemirror";

interface PluginSettings {
	findText: string;
	findRegexp: string;
	regexpFlags: string;
	replace: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	findText: '',
	findRegexp: '',
	regexpFlags: 'g',
	replace: ''
}

interface SelectionRange {
	start: { line: number; ch: number };
	end: { line: number; ch: number };
}

export default class FindAndReplaceInSelection extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'find-and-replace-in-selection',
			name: 'Find and replace in selection',
			callback: () => this.findAndReplace()
		});

		this.addSettingTab(new SettingTab(this.app, this));
	}

	findAndReplace(): void {
		let editor = this.getEditor();
		if (editor) {
			let selectedText = editor.getSelection();

			if (this.settings.findText && this.settings.findText != "") {
				selectedText = selectedText.replace(this.settings.findText, this.settings.replace);
			}

			if (this.settings.findRegexp && this.settings.findRegexp != "") {
				var re = new RegExp(this.settings.findRegexp,"g");
				selectedText = selectedText.replace(re, this.settings.replace);
			}

			editor.replaceSelection(selectedText);
		}
	}

	getEditor(): CodeMirror.Editor {
		return this.app.workspace.getActiveViewOfType(MarkdownView)?.sourceMode.cmEditor;
	}




	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



class SettingTab extends PluginSettingTab {
	plugin: FindAndReplaceInSelection;

	constructor(app: App, plugin: FindAndReplaceInSelection) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Find and replace in selection - Settings' });

		new Setting(containerEl)
			.setName('Find to find')
			.setDesc('Leave empty to ignore')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.findText)
				.onChange(async (value) => {
					this.plugin.settings.findText = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('RegExp to find')
			.setDesc('Leave empty to ignore')
			.addText(text => text
				.setPlaceholder('Example: ab+c')
				.setValue(this.plugin.settings.findRegexp)
				.onChange(async (value) => {
					this.plugin.settings.findRegexp = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('RegExp flags')
			.setDesc('Leave empty to ignore')
			.addText(text => text
				.setPlaceholder('Example: "g" for global')
				.setValue(this.plugin.settings.regexpFlags)
				.onChange(async (value) => {
					this.plugin.settings.regexpFlags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Replace by')
			.setDesc('Text to be inserted')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.replace)
				.onChange(async (value) => {
					this.plugin.settings.replace = value;
					await this.plugin.saveSettings();
				}));
	}
}
