"use strict";

import * as vscode from "vscode";
import * as path from "path";
import {BaseFormatter} from "./../formatters/baseFormatter";
import {YapfFormatter} from "./../formatters/yapfFormatter";
import {AutoPep8Formatter} from "./../formatters/autoPep8Formatter";
import * as settings from "./../common/configSettings";
import * as telemetryHelper from "../common/telemetry";
import * as telemetryContracts from "../common/telemetryContracts";

export class PythonFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    private rootDir: string;
    private settings: settings.IPythonSettings;
    private formatters = new Map<string, BaseFormatter>();

    public constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.rootDir = context.asAbsolutePath(".");
        this.settings = settings.PythonSettings.getInstance();
        let yapfFormatter = new YapfFormatter(outputChannel);
        let autoPep8 = new AutoPep8Formatter(outputChannel);
        this.formatters.set(yapfFormatter.Id, yapfFormatter);
        this.formatters.set(autoPep8.Id, autoPep8);
    }

    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        let formatter = this.formatters.get(this.settings.formatting.provider);
        let delays = new telemetryHelper.Delays();
        return formatter.formatDocument(document, options, token).then(edits => {
            delays.stop();
            telemetryHelper.sendTelemetryEvent(telemetryContracts.IDE.Format, { Format_Provider: formatter.Id }, delays.toMeasures());
            return edits;
        });
    }
}
