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
	regexpFlags: '',
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
			let selectedText = this.getSelectedText(editor);

			if (this.settings.findText && this.settings.findText != "") {
				selectedText = selectedText.split(this.settings.findText).join(this.settings.replace);
			}

			if (this.settings.findRegexp && this.settings.findRegexp != "") {
				var re = new RegExp(this.settings.findRegexp, this.settings.regexpFlags);
				selectedText = selectedText.replace(re, this.settings.replace);
			}

			editor.replaceSelection(selectedText);
		}
	}

	getEditor(): CodeMirror.Editor {
		return this.app.workspace.getActiveViewOfType(MarkdownView)?.sourceMode.cmEditor;
	}

	getSelectedText(editor: CodeMirror.Editor): string {
		if (!editor.somethingSelected())
			this.selectLineUnderCursor(editor);

		return editor.getSelection();
	}

	selectLineUnderCursor(editor: CodeMirror.Editor) {
		let selection = this.getLineUnderCursor(editor);
		editor.getDoc().setSelection(selection.start, selection.end);
	}

	getLineUnderCursor(editor: CodeMirror.Editor): SelectionRange {
		let fromCh, toCh: number;
		let cursor = editor.getCursor();

		fromCh = 0;
		toCh = editor.getLine(cursor.line).length;

		return {
			start: { line: cursor.line, ch: fromCh },
			end: { line: cursor.line, ch: toCh },
		};
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
			.setName('Text to find')
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
				.setPlaceholder('Example: (\w+)\s(\w+)')
				.setValue(this.plugin.settings.findRegexp)
				.onChange(async (value) => {
					this.plugin.settings.findRegexp = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('RegExp flags')
			.setDesc('Type "gmi" for global, multiline, insensitive')
			.addText(text => text
				.setPlaceholder('Example: gmi')
				.setValue(this.plugin.settings.regexpFlags)
				.onChange(async (value) => {
					this.plugin.settings.regexpFlags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Replace by')
			.setDesc('Text to be inserted')
			.addText(text => text
				.setPlaceholder('Example: $2, $1')
				.setValue(this.plugin.settings.replace)
				.onChange(async (value) => {
					this.plugin.settings.replace = value;
					await this.plugin.saveSettings();
				}));
	}
}
